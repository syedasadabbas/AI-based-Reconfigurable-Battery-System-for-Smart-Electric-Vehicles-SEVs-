/**
 * Generates the authoritative dataset of ALL 4096 switch configurations for the
 * 4-cell reconfigurable battery pack: terminal voltage, voltage group and
 * connection class (series / parallel / both).
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
 * TODO(unreconciled): server/circuit-solver.ts, which the running app uses to
 * answer POST /api/calculate, is a SEPARATE implementation and does not agree
 * with this module. It yields 1573 non-zero configurations (4 V x454, 8 V x470,
 * 12 V x420, 16 V x229) against the 565 here, emits no "both" class, and its
 * R4C is wired to the cell-4 POSITIVE junction (see the comment in
 * client/src/components/circuit-diagram.tsx) where the specification puts the
 * cell-4 negative pole. The spreadsheet artefact
 * attached_assets/FormulaValidConfig (2)_1759486139357.xlsx disagrees with both
 * and additionally contains 6 V rows, which are unreachable with ideal cells.
 * Deciding which model is authoritative needs the project supervisor; until
 * then the app and this dataset will report different figures.
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
  status: "valid" | "short-circuit";
  voltage: number;
  voltageGroup: string;
  connectionClass: "series" | "parallel" | "both" | "none";
  cellsInSeries: number;
  activeCells: number[];
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

export function analyse(switches: boolean[], configId: string): ConfigRow {
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

  // ESP and ESN in one component but at equal potential means no net EMF drives
  // the load; that is an open / zero-output configuration, not a fault.
  if (!closedLoop || voltage <= 0) {
    return {
      ...base,
      status: "valid",
      voltage: 0,
      voltageGroup: "0 V (no output)",
      connectionClass: "none",
      cellsInSeries: 0,
      activeCells: [],
    };
  }

  const { cells } = currentCarryingCells(esnRoot, espRoot, cellEdges);
  const cellsInSeries = voltage / CELL_VOLTAGE;
  const activeCells = [...cells].sort((a, b) => a - b);

  let connectionClass: ConfigRow["connectionClass"];
  if (activeCells.length === cellsInSeries) connectionClass = "series";
  else if (cellsInSeries === 1) connectionClass = "parallel";
  else connectionClass = "both";

  return {
    ...base,
    status: "valid",
    voltage,
    voltageGroup: `${voltage} V`,
    connectionClass,
    cellsInSeries,
    activeCells,
  };
}

export function generateAll(): ConfigRow[] {
  const rows: ConfigRow[] = [];
  for (let mask = 0; mask < 1 << SWITCH_COUNT; mask++) {
    const switches: boolean[] = [];
    for (let bit = 0; bit < SWITCH_COUNT; bit++) switches.push((mask & (1 << bit)) !== 0);
    rows.push(analyse(switches, `#${mask.toString().padStart(4, "0")}`));
  }
  return rows;
}

const SWITCH_HEADERS = [
  "R1A", "R1B", "R1C", "R2A", "R2B", "R2C",
  "R3A", "R3B", "R3C", "R4A", "R4B", "R4C",
];

export function toCsv(rows: ConfigRow[]): string {
  const header = [
    "ConfigID",
    ...SWITCH_HEADERS,
    "SwitchStates",
    "Status",
    "Voltage_V",
    "VoltageGroup",
    "ConnectionClass",
    "CellsInSeries",
    "ActiveCells",
  ].join(",");

  const lines = rows.map((r) => {
    const bits = r.switches.map((s) => (s ? 1 : 0));
    const grouped = [0, 3, 6, 9].map((o) => bits.slice(o, o + 3).join("")).join(" ");
    return [
      r.configId,
      ...bits,
      grouped,
      r.status,
      r.voltage,
      r.voltageGroup,
      r.connectionClass,
      r.cellsInSeries,
      `"${r.activeCells.join(" ")}"`,
    ].join(",");
  });

  return [header, ...lines].join("\n") + "\n";
}
