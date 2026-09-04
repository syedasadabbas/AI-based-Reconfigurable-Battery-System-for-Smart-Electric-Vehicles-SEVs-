/**
 * Independent cross-check of the configuration dataset.
 *
 * tools/generate-config-dataset.ts is a *topological* solver: it contracts
 * closed switches with a union-find and propagates node potentials, treating
 * cells as ideal EMFs. This file deliberately uses a completely different
 * method - numeric Modified Nodal Analysis over a real resistive network with
 * finite conductances and a Gaussian-elimination matrix solve - and asserts the
 * two agree on all 4096 configurations for voltage, short-circuit status and
 * active-cell set.
 *
 * Agreement between an ideal-graph solver and a numeric circuit solve is strong
 * evidence the dataset is physically correct rather than an artefact of one
 * implementation.
 *
 * Run with:  npm run dataset:crosscheck
 */
import { analyseConfiguration } from "../shared/battery-model";

// Element values for the numeric model.
// The conductance spread must stay inside double precision: a range wider than
// about 1e14 makes the MNA matrix ill-conditioned and the solve returns
// physically impossible voltages. 1e-4 .. 1e8 ohm keeps the condition number
// tractable while still approximating ideal switches to within a few mV.
const R_CLOSED = 1e-4; // ohm, closed switch
const R_OPEN = 1e8; // ohm, open switch
const R_LOAD = 1; // ohm, terminal load R_T
const CELL_EMF = 4; // volt
const SHORT_CURRENT = 1e3; // ampere; above this a cell is being short circuited
const VOLTAGE_TOLERANCE = 0.05; // volt, allowance for the finite switch resistance
const MIN_CELL_CURRENT = 1e-3; // ampere; below this a cell is only leaking through R_OPEN

// Node numbering. ESN is the ground reference and is not an unknown.
const ESP = 0;
const BBUS = 1;
const Pn = (i: number) => 2 + (i - 1) * 2;
const Nn = (i: number) => 3 + (i - 1) * 2;
const GROUND = -1; // ESN
const NODES = 10; // ESP, BBUS, P1..P4, N1..N4
const SOURCES = 4; // the four cells
const DIM = NODES + SOURCES;

/** Solves A x = b by Gaussian elimination with partial pivoting. */
function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-30) return null; // singular
    [M[col], M[pivot]] = [M[pivot], M[col]];

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col] / M[col][col];
      if (factor === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
    }
  }

  return Array.from({ length: n }, (_, i) => M[i][n] / M[i][i]);
}

type NumericResult = {
  voltage: number;
  shorted: boolean;
  activeCells: number[];
};

function numericSolve(switches: boolean[]): NumericResult {
  const A: number[][] = Array.from({ length: DIM }, () => Array(DIM).fill(0));
  const rhs: number[] = Array(DIM).fill(0);

  /** Stamps a conductance between two nodes (GROUND is the reference). */
  const stampResistor = (a: number, b: number, resistance: number) => {
    const g = 1 / resistance;
    if (a !== GROUND) A[a][a] += g;
    if (b !== GROUND) A[b][b] += g;
    if (a !== GROUND && b !== GROUND) {
      A[a][b] -= g;
      A[b][a] -= g;
    }
  };

  /** Stamps an ideal voltage source: V(pos) - V(neg) = emf. */
  const stampSource = (index: number, pos: number, neg: number, emf: number) => {
    const row = NODES + index;
    if (pos !== GROUND) {
      A[pos][row] += 1;
      A[row][pos] += 1;
    }
    if (neg !== GROUND) {
      A[neg][row] -= 1;
      A[row][neg] -= 1;
    }
    rhs[row] = emf;
  };

  const r = (closed: boolean) => (closed ? R_CLOSED : R_OPEN);

  for (let i = 1; i <= 4; i++) {
    const a = switches[(i - 1) * 3];
    const b = switches[(i - 1) * 3 + 1];
    const c = switches[(i - 1) * 3 + 2];
    stampResistor(ESP, Pn(i), r(a)); // type a: ES+ to cell positive pole
    stampResistor(Nn(i), BBUS, r(b)); // type b: cell negative pole to common bus
    if (i < 4) stampResistor(Nn(i), Pn(i + 1), r(c)); // type c: cell i to cell i+1
    else stampResistor(Nn(4), GROUND, r(c)); // type c exception: cell 4 to ES-
    stampSource(i - 1, Pn(i), Nn(i), CELL_EMF);
  }
  stampResistor(ESP, GROUND, R_LOAD); // the terminal load R_T

  const x = solve(A, rhs);
  if (x === null) return { voltage: 0, shorted: true, activeCells: [] };

  // Source currents come out of the MNA solution directly.
  const cellCurrents = Array.from({ length: SOURCES }, (_, k) => Math.abs(x[NODES + k]));
  if (cellCurrents.some((i) => i > SHORT_CURRENT)) {
    return { voltage: 0, shorted: true, activeCells: [] };
  }

  const terminalVoltage = x[ESP]; // ESN is ground
  const loadCurrent = Math.abs(terminalVoltage) / R_LOAD;

  // A cell is active when it carries a meaningful share of the load current.
  // Both an absolute floor and a relative share are required: the finite
  // R_OPEN leaks a nanoamp through every open switch, and without the absolute
  // floor that leakage would register as a conducting cell in the configurations
  // that produce no output at all.
  const conducting = Math.abs(terminalVoltage) > VOLTAGE_TOLERANCE;
  const activeCells: number[] = [];
  cellCurrents.forEach((current, k) => {
    if (conducting && current > MIN_CELL_CURRENT && current > loadCurrent * 0.01) {
      activeCells.push(k + 1);
    }
  });

  return { voltage: terminalVoltage, shorted: false, activeCells };
}

let mismatchVoltage = 0;
let mismatchStatus = 0;
let mismatchCells = 0;
const examples: string[] = [];

for (let mask = 0; mask < 4096; mask++) {
  const switches: boolean[] = [];
  for (let bit = 0; bit < 12; bit++) switches.push((mask & (1 << bit)) !== 0);

  const ideal = analyseConfiguration(switches, `#${mask}`);
  const numeric = numericSolve(switches);

  const idealShorted = ideal.status === "short-circuit";
  if (idealShorted !== numeric.shorted) {
    mismatchStatus++;
    if (examples.length < 8) {
      examples.push(`#${mask} status: graph=${ideal.status} numeric=${numeric.shorted ? "short" : "ok"}`);
    }
    continue;
  }
  if (idealShorted) continue;

  // An invalid (wrong-polarity) configuration is reported as 0 V with no active
  // cells by the model, because it delivers nothing usable. The numeric solve
  // still sees the real negative voltage, so compare against rawVoltage and
  // skip the active-cell comparison for these.
  if (ideal.status === "invalid") {
    if (!(numeric.voltage < 0) || Math.abs(numeric.voltage - ideal.rawVoltage) > VOLTAGE_TOLERANCE) {
      mismatchVoltage++;
      if (examples.length < 8) {
        examples.push(`#${mask} invalid: graph=${ideal.rawVoltage} numeric=${numeric.voltage.toFixed(6)}`);
      }
    }
    continue;
  }

  // The numeric model carries a small error from the finite switch resistance.
  if (Math.abs(numeric.voltage - ideal.rawVoltage) > VOLTAGE_TOLERANCE) {
    mismatchVoltage++;
    if (examples.length < 8) {
      examples.push(`#${mask} voltage: graph=${ideal.rawVoltage} numeric=${numeric.voltage.toFixed(6)}`);
    }
    continue;
  }
  if (numeric.activeCells.join(",") !== ideal.activeCells.join(",")) {
    mismatchCells++;
    if (examples.length < 8) {
      examples.push(`#${mask} cells: graph=[${ideal.activeCells}] numeric=[${numeric.activeCells}]`);
    }
  }
}

console.log("\nIndependent numeric (MNA) cross-check over all 4096 configurations:");
console.log(`  short-circuit status mismatches : ${mismatchStatus}`);
console.log(`  terminal voltage mismatches     : ${mismatchVoltage}`);
console.log(`  active-cell set mismatches      : ${mismatchCells}`);
if (examples.length) {
  console.log("\n  examples:");
  examples.forEach((e) => console.log(`    ${e}`));
}

const total = mismatchStatus + mismatchVoltage + mismatchCells;
console.log(
  total === 0
    ? "\nThe topological solver and the numeric circuit solve agree on every configuration.\n"
    : `\n${total} disagreement(s) between the two independent methods.\n`,
);
process.exit(total === 0 ? 0 : 1);
