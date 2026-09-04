/**
 * Asserts that shared/battery-model.ts implements the reconfigurable battery
 * pack proposed in Muhammad Shaheer's paper, "AI-based Reconfigurable Battery
 * System for Smart Electric Vehicles (SEVs)" (Shaheer, Abbas, Adeel, Asghar,
 * Iqbal, Alaulamie).
 *
 * The paper's architecture (its Section 2, Fig. 1 "3-switch reconfigurable
 * battery pack", and Eqs. 1-12):
 *
 *   - Three switches per cell, four cells: twelve switches in total.
 *   - Type-a connects the positive poles of the energy source and the cell.
 *   - Type-b connects to the common bus tied to all cells' negative poles.
 *   - Type-c connects cell n's negative pole to cell n+1's positive pole, with
 *     one exception: the last cell's type-c switch connects directly to the
 *     negative pole of the main energy source.
 *   - The load R_T sits across the energy-source terminals and V_T is measured
 *     across it (Eqs. 3-4).
 *   - "As Ri are modeled and assigned as switches so they can only have values
 *     0 or infinity, i.e. R in {0, infinity}."
 *   - "Note that short circuit may occur for some configurations. The
 *     optimization target will automatically exclude short circuit
 *     configurations from our solution because some of Iia or Iib will become
 *     infinite."
 *
 * That last rule is exactly this model's short-circuit criterion: an
 * inconsistent set of node potentials is the ideal-source signature of an
 * infinite loop current.
 *
 * The paper's Section 3.2 also gives worked switch lists. The ones that follow
 * from the architecture above are asserted here. Two groups do not follow from
 * it and are recorded as such rather than reproduced - see the notes below.
 *
 * Run with:  npm run dataset:papercheck
 */
import { analyseConfiguration, CELL_VOLTAGE, CELLS, generateAll } from "../shared/battery-model";

let failures = 0;
function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name}${detail ? ` -- ${detail}` : ""}`);
  }
}

/** Builds a switch vector from the paper's Rxy names (R = 0 means closed). */
function closed(...names: string[]): boolean[] {
  const v: boolean[] = Array(CELLS * 3).fill(false);
  for (const n of names) {
    const type = { a: 0, b: 1, c: 2 }[n[1].toLowerCase() as "a" | "b" | "c"];
    const cell = Number(n[2]) - 1;
    if (type === undefined || Number.isNaN(cell)) throw new Error(`bad switch name ${n}`);
    v[cell * 3 + type] = true;
  }
  return v;
}

console.log("\nPack architecture");

check("four cells, as in the paper's 4-cell architecture", CELLS === 4);
check("three switches per cell, twelve in total", CELLS * 3 === 12);
check("2^12 = 4096 switch settings enumerated", generateAll().length === 4096);
check("cell voltage is the 4 V used throughout the paper", CELL_VOLTAGE === 4);

console.log("\nThe paper's own worked switch lists (Section 3.2)");

// Eq. 17, consecutive cells in series: Rai, Rci, Rc(j-1), Rbj, Rbn, Rcn.
// Cell1 + Cell2: Ra1, Rc1, Rb2 close the string, Rb4 + Rc4 complete the circuit.
{
  const r = analyseConfiguration(closed("Ra1", "Rc1", "Rb2", "Rb4", "Rc4"), "#eq17");
  check(
    "Eq. 17 consecutive series (Cell1+Cell2) -> 8 V series",
    r.voltage === 8 && r.connectionClass === "series" && r.activeCells.join(",") === "1,2",
    `${r.status} ${r.voltage} V ${r.connectionClass} [${r.activeCells}]`,
  );
}

// Eq. 13 as printed, which additionally closes Rc2. Cell3 hangs off the string
// but carries no load current, so the output is unchanged at 8 V.
{
  const r = analyseConfiguration(closed("Ra1", "Rc1", "Rc2", "Rb2", "Rb4", "Rc4"), "#eq13");
  check(
    "Eq. 13 as printed -> still 8 V on cells 1 and 2",
    r.voltage === 8 && r.activeCells.join(",") === "1,2",
    `${r.status} ${r.voltage} V [${r.activeCells}]`,
  );
}

// Eq. 18 / 20, two cells in parallel: Rai, Rbi, Raj, Rbj, Rbn, Rcn.
{
  const r = analyseConfiguration(closed("Ra1", "Rb1", "Ra2", "Rb2", "Rb4", "Rc4"), "#eq18");
  check(
    "Eq. 18 parallel (Cell1||Cell2) -> 4 V parallel",
    r.voltage === 4 && r.connectionClass === "parallel" && r.activeCells.join(",") === "1,2",
    `${r.status} ${r.voltage} V ${r.connectionClass} [${r.activeCells}]`,
  );
}

// Eq. 19, non-adjacent cells in parallel - the common bus makes this work.
{
  const r = analyseConfiguration(closed("Ra1", "Rb1", "Ra3", "Rb3", "Rb4", "Rc4"), "#eq19");
  check(
    "Eq. 19 parallel (Cell1||Cell3) -> 4 V parallel",
    r.voltage === 4 && r.connectionClass === "parallel" && r.activeCells.join(",") === "1,3",
    `${r.status} ${r.voltage} V ${r.connectionClass} [${r.activeCells}]`,
  );
}

// Eq. 21, the general parallel case, here with all four cells.
{
  const r = analyseConfiguration(
    closed("Ra1", "Rb1", "Ra2", "Rb2", "Ra3", "Rb3", "Ra4", "Rb4", "Rc4"),
    "#eq21",
  );
  check(
    "Eq. 21 all four cells in parallel -> 4 V parallel",
    r.voltage === 4 && r.connectionClass === "parallel" && r.activeCells.join(",") === "1,2,3,4",
    `${r.status} ${r.voltage} V ${r.connectionClass} [${r.activeCells}]`,
  );
}

// The full series string, the paper's maximum voltage class.
{
  const r = analyseConfiguration(closed("Ra1", "Rc1", "Rc2", "Rc3", "Rc4"), "#full");
  check(
    "full four-cell series string -> 16 V, the paper's top class",
    r.voltage === 16 && r.connectionClass === "series",
    `${r.status} ${r.voltage} V ${r.connectionClass}`,
  );
}

console.log("\nThe paper's exclusion rule");

// "short circuit may occur for some configurations ... because some of Iia or
// Iib will become infinite". Closing Ra1, Ra2 and Rc1 ties N1 to P1 through
// ES+, shorting cell 1.
{
  const r = analyseConfiguration(closed("Ra1", "Ra2", "Rc1", "Rb4", "Rc4"), "#short");
  check("a shorted cell is excluded as a short circuit", r.status === "short-circuit", r.status);
}

// Unequal parallel branches: an 8 V string (cells 1-2) in parallel with a 4 V
// branch (cell 4). With R in {0, infinity} the loop current is unbounded, so
// the paper's own rule excludes it. This is the configuration family the paper
// labels v6; it is not a producible 6 V output.
{
  const r = analyseConfiguration(closed("Ra1", "Rc1", "Rb2", "Ra4", "Rb4", "Rc4"), "#unequal");
  check(
    "unequal parallel branches are excluded, not averaged to 6 V",
    r.status === "short-circuit",
    r.status,
  );
}

console.log("\nNo 6 V class exists under the paper's own R in {0, infinity}");

const all = generateAll();
const usableVoltages = new Set(
  all.filter((r) => r.status === "valid" && r.voltage > 0).map((r) => r.voltage),
);
check(
  "usable voltages are exactly 4, 8, 12 and 16 V",
  [...usableVoltages].sort((a, b) => a - b).join(",") === "4,8,12,16",
  [...usableVoltages].sort((a, b) => a - b).join(","),
);
check(
  "no configuration produces 6 V, 10 V or 14 V",
  !all.some((r) => [6, 10, 14].includes(r.voltage)),
);
check(
  "every usable voltage is a whole number of 4 V cells in series",
  all
    .filter((r) => r.status === "valid" && r.voltage > 0)
    .every((r) => r.voltage === CELL_VOLTAGE * r.cellsInSeries),
);

// Recorded, not asserted: Eqs. 14-16 describe "non-consecutive cells in
// series" (e.g. Cell1 in series with Cell3 via Ra1, Rb1, Rb2, Rb3, Rb4, Rc4).
// No switch in the proposed architecture can connect one cell's negative pole
// to a non-adjacent cell's positive pole - type-c only reaches cell n+1 - so
// those switch lists place all cell negatives on the common bus instead, which
// is a parallel connection. The model reports 4 V for them.
{
  const r = analyseConfiguration(closed("Ra1", "Rb1", "Rb2", "Rb3", "Rb4", "Rc4"), "#eq14");
  console.log(
    `\n  note  Eq. 14 (Cell1 "in series" with Cell3) evaluates to ${r.voltage} V ` +
      `${r.connectionClass} on cells [${r.activeCells}]: the architecture has no switch ` +
      `joining non-adjacent cells in series, so the listed switches form a parallel bus.`,
  );
}

console.log(
  failures === 0
    ? "\nThe model implements the pack architecture proposed in the paper.\n"
    : `\n${failures} check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
