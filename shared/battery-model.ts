/**
 * THE single source of truth for the 4-cell reconfigurable battery pack model.
 *
 * Every part of the application - the simulation page, the car simulation, the
 * dashboard, the statistics and the exports - must obtain voltage, connection
 * class and active-cell data from this module. Do not reimplement it: earlier
 * duplicate implementations in server/circuit-solver.ts and server/storage.ts
 * disagreed with each other and with the specification.
 *
 * Topology is taken directly from the project specification
 * (attached_assets/Pasted-Type-a-switch-connects-...txt), i.e. the Kirchhoff
 * loop equations supplied with the project:
 *
 *   Node ESP  - energy-source positive terminal ("RA bus")
 *   Node ESN  - energy-source negative terminal
 *   Node BBUS - common bus tied to the type-b switches ("RB bus")
 *   Cell i    - ideal 4 V EMF between node Pi (+) and node Ni (-)
 *
 *   Ria : switch  ESP <-> Pi        (type a: ES+ to cell positive pole)
 *   Rib : switch  Ni  <-> BBUS      (type b: cell negative pole to common bus)
 *   Ric : switch  Ni  <-> P(i+1)    (type c: cell i negative to cell i+1 positive)
 *   R4c : switch  N4  <-> ESN       (type c exception: last cell to ES-)
 *
 *   The load R_T sits between ESN and ESP; V_T is measured across it.
 *
 * Switches are ideal: closed = 0 ohm, open = infinite ohm, per the spec
 * ("R in {0, inf}"). Cells are ideal EMFs with no internal resistance, which is
 * what the supplied loop equations assume - no internal-resistance term appears
 * in them.
 *
* Verification (see tests/, run `npm run dataset:all`):
 *   - tests/config-dataset.e2e.ts        hand-worked circuit cases + invariants
 *   - tests/config-dataset-independent-check.e2e.ts
 *       an independent numeric Modified Nodal Analysis solve over a real
 *       resistive network agrees with this module on the voltage, short-circuit
 *       status and active-cell set of all 4096 configurations
 *   - tests/config-hand-derivation.e2e.ts
 *       closed-form hand derivation reproducing every count
 *
 * Census of the 4096 configurations: 2380 short circuit, 1150 zero output,
 * 1 invalid, 565 usable (4 V x437, 8 V x101, 12 V x22, 16 V x5).
 *
  * Method: closed switches are contracted with a union-find, leaving a graph
 * whose only edges are the four cells. Node potentials are propagated over that
 * graph; any contradiction is a short circuit, which the spec says must be
 * excluded. V_T is the potential difference across the load when ESP and ESN
 * are in one component, and 0 V (open circuit) otherwise.
 */

const CELL_VOLTAGE = 4; // volts per cell, per specification
const CELLS = 4;
const SWITCH_COUNT = CELLS * 3;

// Node indices
const ESP = 0;
const ESN = 1;
const BBUS = 2;
const P = (i: number) => 3 + (i - 1) * 2; // cell i positive pole
const N = (i: number) => 4 + (i - 1) * 2; // cell i negative pole
const NODE_COUNT = 3 + CELLS * 2;

/** Switch index within the 12-bit vector, ordered R1A,R1B,R1C,R2A,... */
const swIndex = (cell: number, type: 0 | 1 | 2) => (cell - 1) * 3 + type;

export type ConfigRow = {
  configId: string;
  switches: boolean[];
  status: "valid" | "short-circuit" | "invalid";
  voltage: number;
  voltageGroup: string;
  connectionClass: "series" | "parallel" | "both" | "none";
  cellsInSeries: number;
  activeCells: number[];
  /**
   * Signed terminal voltage before the "no useful output" clamp below, exposed
   * for the independent numeric cross-check. A negative value marks the
   * configuration invalid: current flows, but the wrong way through the load.
   */
  rawVoltage: number;
};

class UnionFind {
  private parent: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }
  find(x: number): number {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  union(a: number, b: number) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent[rb] = ra;
  }
}

/** The switch-contracted netlist: closed switches merged, cells left as edges. */
function contract(switches: boolean[]) {
  const uf = new UnionFind(NODE_COUNT);
  for (let i = 1; i <= CELLS; i++) {
    if (switches[swIndex(i, 0)]) uf.union(ESP, P(i)); // type a
    if (switches[swIndex(i, 1)]) uf.union(N(i), BBUS); // type b
    if (switches[swIndex(i, 2)]) {
      // type c
      if (i < CELLS) uf.union(N(i), P(i + 1));
      else uf.union(N(CELLS), ESN); // last-cell exception
    }
  }
  return uf;
}

type CellEdge = { cell: number; pos: number; neg: number };

/**
 * Propagates node potentials across the cell edges. Returns null when the
 * network is inconsistent, which is the ideal-source signature of a short
 * circuit (some loop current becomes infinite, per the spec).
 */
function solvePotentials(
  uf: UnionFind,
  cellEdges: CellEdge[],
): { potential: Map<number, number>; component: Map<number, number> } | null {
  // A cell whose own poles are shorted together is a shorted cell.
  for (const e of cellEdges) if (e.pos === e.neg) return null;

  const adjacency = new Map<number, { to: number; delta: number }[]>();
  const link = (from: number, to: number, delta: number) => {
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from)!.push({ to, delta });
  };
  for (const e of cellEdges) {
    link(e.neg, e.pos, CELL_VOLTAGE); // V(pos) = V(neg) + 4
    link(e.pos, e.neg, -CELL_VOLTAGE);
  }

  // Each galvanically connected island (switch-contracted nodes joined by cells)
  // gets its own component id and its own arbitrary 0 V reference.
  const potential = new Map<number, number>();
  const component = new Map<number, number>();
  let nextComponent = 0;

  for (let node = 0; node < NODE_COUNT; node++) {
    const root = uf.find(node);
    if (potential.has(root)) continue;
    const componentId = nextComponent++;
    potential.set(root, 0);
    component.set(root, componentId);
    const queue = [root];
    while (queue.length) {
      const here = queue.shift()!;
      for (const edge of adjacency.get(here) ?? []) {
        const want = potential.get(here)! + edge.delta;
        if (!potential.has(edge.to)) {
          potential.set(edge.to, want);
          component.set(edge.to, componentId);
          queue.push(edge.to);
        } else if (potential.get(edge.to) !== want) {
          return null; // conflicting EMF around a loop -> short circuit
        }
      }
    }
  }
  return { potential, component };
}

/** All simple paths ESN -> ESP over cell edges; these carry the load current. */
function currentCarryingCells(source: number, sink: number, cellEdges: CellEdge[]) {
  const cells = new Set<number>();
  const pathLengths: number[] = [];

  const walk = (node: number, usedEdges: Set<number>, visited: Set<number>) => {
    if (node === sink) {
      usedEdges.forEach((idx) => cells.add(cellEdges[idx].cell));
      pathLengths.push(usedEdges.size);
      return;
    }
    cellEdges.forEach((edge, idx) => {
      if (usedEdges.has(idx)) return;
      const next = edge.pos === node ? edge.neg : edge.neg === node ? edge.pos : null;
      if (next === null || visited.has(next)) return;
      usedEdges.add(idx);
      visited.add(next);
      walk(next, usedEdges, visited);
      visited.delete(next);
      usedEdges.delete(idx);
    });
  };

  walk(source, new Set(), new Set([source]));
  return { cells, pathLengths };
}

export function analyseConfiguration(switches: boolean[], configId: string): ConfigRow {
  const uf = contract(switches);
  const cellEdges: CellEdge[] = Array.from({ length: CELLS }, (_, k) => ({
    cell: k + 1,
    pos: uf.find(P(k + 1)),
    neg: uf.find(N(k + 1)),
  }));

  const base = { configId, switches: [...switches] };
  const solved = solvePotentials(uf, cellEdges);

  if (solved === null) {
    return {
      ...base,
      status: "short-circuit",
      voltage: 0,
      voltageGroup: "Short Circuit",
      connectionClass: "none",
      cellsInSeries: 0,
      activeCells: [],
      rawVoltage: 0,
    };
  }

  const { potential, component } = solved;
  const espRoot = uf.find(ESP);
  const esnRoot = uf.find(ESN);

  // The load sits between ESN and ESP, so those two nodes are never merged by a
  // switch. Current flows only when the cells bridge them galvanically, i.e.
  // when both terminals land in the same component.
  const closedLoop = component.get(espRoot) === component.get(esnRoot);
  const voltage = closedLoop ? potential.get(espRoot)! - potential.get(esnRoot)! : 0;

  // Loop open, or closed but with no net EMF across the load: no current flows.
  if (!closedLoop || voltage === 0) {
    return {
      ...base,
      status: "valid",
      voltage: 0,
      voltageGroup: "0 V (no output)",
      connectionClass: "none",
      cellsInSeries: 0,
      activeCells: [],
      rawVoltage: voltage,
    };
  }

  const { cells } = currentCarryingCells(esnRoot, espRoot, cellEdges);
  const cellsInSeries = Math.abs(voltage) / CELL_VOLTAGE;
  const activeCells = Array.from(cells).sort((a, b) => a - b);

  let connectionClass: ConfigRow["connectionClass"];
  if (activeCells.length === cellsInSeries) connectionClass = "series";
  else if (cellsInSeries === 1) connectionClass = "parallel";
  else connectionClass = "both";

  // A negative terminal voltage means the conducting cells reach the load the
  // wrong way round: the common bus can route ES- to a cell's positive pole
  // while a type-a switch reaches its negative pole. Current genuinely flows,
  // so this is not a zero-output configuration, but it cannot drive the load
  // either. It is reported as invalid and excluded from the usable set, rather
  // than being silently reported as 0 V.
  if (voltage < 0) {
    return {
      ...base,
      status: "invalid",
      voltage: 0,
      voltageGroup: "Invalid Configuration",
      connectionClass: "none",
      cellsInSeries: 0,
      activeCells: [],
      rawVoltage: voltage,
    };
  }

  return {
    ...base,
    status: "valid",
    voltage,
    voltageGroup: `${voltage} V`,
    connectionClass,
    cellsInSeries,
    activeCells,
    rawVoltage: voltage,
  };
}

export function generateAll(): ConfigRow[] {
  const rows: ConfigRow[] = [];
  for (let mask = 0; mask < 1 << SWITCH_COUNT; mask++) {
    const switches: boolean[] = [];
    for (let bit = 0; bit < SWITCH_COUNT; bit++) switches.push((mask & (1 << bit)) !== 0);
    rows.push(analyseConfiguration(switches, `#${mask.toString().padStart(4, "0")}`));
  }
  return rows;
}

/** Canonical "100 011 000 001" rendering of a switch vector. */
export function formatSwitchStates(switches: boolean[]): string {
  return [0, 3, 6, 9].map((o) => switches.slice(o, o + 3).map((s) => (s ? 1 : 0)).join("")).join(" ");
}

/** The 12 switch names in vector order. */
export const SWITCH_NAMES = [
  "R1A", "R1B", "R1C", "R2A", "R2B", "R2C",
  "R3A", "R3B", "R3C", "R4A", "R4B", "R4C",
] as const;

export { CELL_VOLTAGE, CELLS };

// ─── Application-facing labels ───────────────────────────────────────────────
//
// Every layer (client local-store, server storage, exports) must derive its
// labels here so the same configuration never gets two different names.

/** The only terminal voltages this pack can produce, in volts. */
export const ACHIEVABLE_VOLTAGES = [0, 4, 8, 12, 16] as const;

/**
 * The only voltages that deliver power to the load, in volts. 6 V, 10 V and
 * 14 V are NOT reachable: the terminal voltage is always a whole number of 4 V
 * cells in series, and any unequal parallel branches short circuit instead of
 * averaging. See tests/config-hand-derivation.e2e.ts.
 */
export const OUTPUT_VOLTAGES = [4, 8, 12, 16] as const;

export type ConnectionTypeLabel =
  | "Disconnected"
  | "Series"
  | "Parallel"
  | "Series-Parallel"
  | "Short Circuit"
  | "Invalid";

export function connectionTypeLabel(row: ConfigRow): ConnectionTypeLabel {
  if (row.status === "short-circuit") return "Short Circuit";
  if (row.status === "invalid") return "Invalid";
  switch (row.connectionClass) {
    case "series":
      return "Series";
    case "parallel":
      return "Parallel";
    case "both":
      return "Series-Parallel";
    default:
      return "Disconnected";
  }
}

export function voltageGroupLabel(row: ConfigRow): string {
  if (row.status === "short-circuit") return "Short Circuit";
  if (row.status === "invalid") return "Invalid Configuration";
  if (row.voltage === 0) return "Zero Output";
  return `${row.voltage} V`;
}

/** True when this configuration usefully powers the load. */
export function isUsable(row: ConfigRow): boolean {
  return row.status === "valid" && row.voltage > 0;
}

/**
 * The flattened record the application stores and renders. Field names match
 * the existing Configuration shape in shared/schema.ts so consumers are
 * unaffected, with `status` added so faults are no longer indistinguishable
 * from a legitimate 0 V configuration.
 */
export type AppConfiguration = {
  configId: string;
  switchStates: string;
  voltage: number;
  voltageGroup: string;
  connectionType: ConnectionTypeLabel;
  activeCells: number;
  activeCellsArray: number[];
  status: ConfigRow["status"];
  cellsInSeries: number;
};

export function toAppConfiguration(row: ConfigRow): AppConfiguration {
  return {
    configId: row.configId,
    switchStates: formatSwitchStates(row.switches),
    // Faults deliver nothing to the load, so they are reported as 0 V with the
    // fault carried in `status`/`voltageGroup` rather than as a usable output.
    voltage: isUsable(row) ? row.voltage : 0,
    voltageGroup: voltageGroupLabel(row),
    connectionType: connectionTypeLabel(row),
    activeCells: isUsable(row) ? row.activeCells.length : 0,
    activeCellsArray: isUsable(row) ? row.activeCells : [],
    status: row.status,
    cellsInSeries: isUsable(row) ? row.cellsInSeries : 0,
  };
}

/** Analyses a switch vector and returns the application-facing record. */
export function calculateConfiguration(switches: boolean[]): AppConfiguration {
  const index = switches.reduce((acc, s, i) => acc + (s ? 1 << i : 0), 0);
  return toAppConfiguration(analyseConfiguration(switches, `#${index.toString().padStart(4, "0")}`));
}

/** All 4096 configurations as application-facing records. */
export function generateAllAppConfigurations(): AppConfiguration[] {
  return generateAll().map(toAppConfiguration);
}
