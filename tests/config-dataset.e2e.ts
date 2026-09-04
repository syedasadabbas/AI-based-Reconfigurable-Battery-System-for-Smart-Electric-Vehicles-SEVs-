/**
 * End-to-end verification of the generated configuration dataset.
 *
 * Runs the generator, writes nothing, and asserts both hand-derived circuit
 * cases and structural invariants against the emitted CSV text. Exits non-zero
 * on any failure so it can be wired into CI.
 *
 * Run with:  npm run dataset:verify
 */
import { analyseConfiguration, generateAll } from "../shared/battery-model";
import { toCsv } from "../tools/config-dataset-csv";

let failures = 0;

function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name}${detail ? ` -- ${detail}` : ""}`);
  }
}

/** Builds a 12-bit switch vector from switch names such as "R1A". */
const NAMES = [
  "R1A", "R1B", "R1C", "R2A", "R2B", "R2C",
  "R3A", "R3B", "R3C", "R4A", "R4B", "R4C",
];
function sw(...on: string[]): boolean[] {
  const bits = Array(12).fill(false);
  for (const name of on) {
    const idx = NAMES.indexOf(name);
    if (idx < 0) throw new Error(`unknown switch ${name}`);
    bits[idx] = true;
  }
  return bits;
}

console.log("\nHand-derived circuit cases (topology per project specification):");

// 1. Everything open: no path from the energy source to any cell.
{
  const r = analyseConfiguration(sw(), "t1");
  check("all switches open -> 0 V, no output", r.voltage === 0 && r.status === "valid", JSON.stringify(r.voltage));
}

// 2. Only the last-cell type-c switch closed: ES- reaches N4, but nothing
//    connects any cell positive pole back to ES+, so the loop stays open.
{
  const r = analyseConfiguration(sw("R4C"), "t2");
  check("R4C alone -> 0 V (open loop)", r.voltage === 0 && r.status === "valid");
}

// 3. Cell 4 alone across the load: ES+ -R4A- P4 -cell4- N4 -R4C- ES-.
{
  const r = analyseConfiguration(sw("R4A", "R4C"), "t3");
  check(
    "R4A+R4C -> 4 V, cell 4 only",
    r.voltage === 4 && r.activeCells.join(",") === "4",
    `got ${r.voltage} V cells=${r.activeCells}`,
  );
}

// 4. Full four-cell series string:
//    ES+ -R1A- P1 -c1- N1 -R1C- P2 -c2- N2 -R2C- P3 -c3- N3 -R3C- P4 -c4- N4 -R4C- ES-
{
  const r = analyseConfiguration(sw("R1A", "R1C", "R2C", "R3C", "R4C"), "t4");
  check(
    "four-cell series string -> 16 V, series, all cells active",
    r.voltage === 16 && r.connectionClass === "series" && r.activeCells.join(",") === "1,2,3,4",
    `got ${r.voltage} V class=${r.connectionClass}`,
  );
}

// 5. Two cells paralleled through the common (type-b) bus: positives tied to
//    ES+ by R3A/R4A, negatives tied together by R3B/R4B, and N4 to ES- by R4C.
{
  const r = analyseConfiguration(sw("R3A", "R3B", "R4A", "R4B", "R4C"), "t5");
  check(
    "cells 3+4 paralleled via the b-bus -> 4 V, parallel",
    r.voltage === 4 && r.connectionClass === "parallel" && r.activeCells.join(",") === "3,4",
    `got ${r.voltage} V class=${r.connectionClass} cells=${r.activeCells}`,
  );
}

// 6. Shorted cell: R1A and R2A both tie ES+ to P1 and P2, while R1C ties N1 to
//    P2. N1 therefore reaches P1 and cell 1 is short-circuited.
{
  const r = analyseConfiguration(sw("R1A", "R2A", "R1C"), "t6");
  check("R1A+R2A+R1C -> short circuit", r.status === "short-circuit", r.status);
}

// 7. Exactly five configurations reach 16 V. The series string of case 4 fixes
//    five switches; of the seven free switches, any type-a switch other than
//    R1A shorts a cell, and closing two type-b switches ties two cell negatives
//    together and also shorts a cell. So only "no type-b switch" or "exactly
//    one of R1B..R4B" survive: 1 + 4 = 5.
{
  const rows = generateAll().filter((r) => r.voltage === 16);
  check("exactly 5 configurations reach 16 V", rows.length === 5, `got ${rows.length}`);
}

console.log("\nStructural invariants across all 4096 configurations:");

const all = generateAll();

check("dataset covers all 2^12 = 4096 configurations", all.length === 4096, `got ${all.length}`);
check("config IDs are unique", new Set(all.map((r) => r.configId)).size === 4096);

const valid = all.filter((r) => r.status === "valid" && r.voltage > 0);

check(
  "voltage is always 4 V x cells-in-series",
  valid.every((r) => r.voltage === 4 * r.cellsInSeries),
);
check(
  "voltage is always a positive multiple of the 4 V cell voltage",
  valid.every((r) => r.voltage > 0 && r.voltage % 4 === 0),
);
check(
  "voltage never exceeds the 4-cell maximum of 16 V",
  valid.every((r) => r.voltage <= 16),
);
check(
  "series rows have exactly cells-in-series active cells",
  valid.filter((r) => r.connectionClass === "series").every((r) => r.activeCells.length === r.cellsInSeries),
);
check(
  "parallel rows carry one cell per branch and share more than one cell",
  valid
    .filter((r) => r.connectionClass === "parallel")
    .every((r) => r.cellsInSeries === 1 && r.activeCells.length > 1),
);
check(
  "both rows are genuinely series-parallel (multi-cell branches, extra cells)",
  valid
    .filter((r) => r.connectionClass === "both")
    .every((r) => r.cellsInSeries > 1 && r.activeCells.length > r.cellsInSeries),
);
check(
  "every voltage-producing row closes the loop through R4C",
  valid.every((r) => r.switches[NAMES.indexOf("R4C")]),
);
check(
  "short-circuit and zero-output rows report 0 V and no active cells",
  all
    .filter((r) => r.voltage === 0)
    .every((r) => r.activeCells.length === 0 && r.cellsInSeries === 0),
);
check(
  "connection class is NOT a pure function of voltage (it carries real information)",
  new Set(valid.filter((r) => r.voltage === 4).map((r) => r.connectionClass)).size > 1,
);

console.log("\nCSV output:");
const csvAll = toCsv(all);
const csvValid = toCsv(valid);
const headerCols = csvAll.split("\n")[0].split(",").length;

check("all-configurations CSV has 4096 data rows", csvAll.trim().split("\n").length - 1 === 4096);
check("valid-configurations CSV row count matches the filtered set", csvValid.trim().split("\n").length - 1 === valid.length);
check(
  "every CSV row has the same column count as the header",
  csvAll.trim().split("\n").every((line) => line.split(",").length === headerCols),
);

console.log(
  failures === 0
    ? `\nAll checks passed (${failures} failures).\n`
    : `\n${failures} check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
