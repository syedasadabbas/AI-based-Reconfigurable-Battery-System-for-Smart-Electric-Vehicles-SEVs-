/**
 * Hand derivation of the valid configuration set, encoded as assertions.
 *
 * Take the ES- node as the 0 V reference and write x_i for the potential of
 * cell i's negative pole. Every cell contributes phi(Pi) = x_i + 4, and every
 * closed switch is one linear equation:
 *
 *   a_i closed  ->  x_i = phi(ESP) - 4
 *   b_i closed  ->  x_i = phi(BBUS)
 *   c_i closed  ->  x_i = x_(i+1) + 4        (i < 4)
 *   c_4 closed  ->  x_4 = 0
 *
 * A configuration short circuits exactly when that system is inconsistent,
 * which is the ideal-source form of the infinite loop current the project
 * specification says must be excluded.
 *
 * "Tail run" = the maximal chain of cells m..4 joined by closed type-c
 * switches. Because c_4 pins x_4 = 0, every potential inside the tail run is
 * pinned absolutely: x_i = 4 * (4 - i).
 *
 * Run with:  npm run dataset:handcheck
 */
import { generateAll } from "../shared/battery-model";

let failures = 0;
function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name}${detail ? ` -- ${detail}` : ""}`);
  }
}

const all = generateAll();
const validRows = all.filter((r) => r.status === "valid" && r.voltage > 0);

const tailRunStart = (sw: boolean[]) => {
  const c = (i: number) => sw[(i - 1) * 3 + 2];
  return !c(3) ? 4 : !c(2) ? 3 : !c(1) ? 2 : 1;
};
const tailACells = (sw: boolean[]) => {
  const m = tailRunStart(sw);
  return [1, 2, 3, 4].filter((i) => i >= m && sw[(i - 1) * 3]);
};

console.log("\nStep 1-3: necessary conditions forced by the constraint system");

// ES- is reachable only through the last cell's type-c switch.
check(
  "R4C is closed in every voltage-producing configuration",
  validRows.every((r) => r.switches[11]),
);

// Two closed type-a switches on tail-run cells would force 4*(4-i) = 4*(4-j)
// with i != j, which is inconsistent.
check(
  "at most one type-a switch is closed on a tail-run cell",
  validRows.every((r) => tailACells(r.switches).length <= 1),
);

// Likewise two closed type-b switches on tail-run cells would pin the common
// bus to two different potentials at once.
check(
  "at most one type-b switch is closed on a tail-run cell",
  validRows.every(
    (r) =>
      [1, 2, 3, 4].filter((i) => i >= tailRunStart(r.switches) && r.switches[(i - 1) * 3 + 1])
        .length <= 1,
  ),
);

console.log("\nStep 4-5: the valid set splits into two families");

const familyI = validRows.filter((r) => tailACells(r.switches).length === 1);
const familyII = validRows.filter((r) => tailACells(r.switches).length === 0);

check("Family I (ES+ lands on a tail-run cell) has 466 rows", familyI.length === 466, `${familyI.length}`);
check("Family II (ES+ routed through the b-bus) has 99 rows", familyII.length === 99, `${familyII.length}`);
check("the two families partition the valid set", familyI.length + familyII.length === validRows.length);

// In Family I the load sees phi(ESP) = x_s + 4 = 4*(5-s): the output voltage is
// fixed entirely by which tail cell carries the closed type-a switch.
check(
  "Family I voltage is exactly 4 V x (5 - s)",
  familyI.every((r) => r.voltage === 4 * (5 - tailACells(r.switches)[0])),
);

console.log("\nStep 6: the completion count f(m) depends only on m, never on s");

const f: Record<number, number> = { 1: 5, 2: 14, 3: 63, 4: 278 };
for (const m of [1, 2, 3, 4]) {
  const rows = familyI.filter((r) => tailRunStart(r.switches) === m);
  const perS = new Map<number, number>();
  for (const r of rows) {
    const s = tailACells(r.switches)[0];
    perS.set(s, (perS.get(s) ?? 0) + 1);
  }
  check(
    `f(${m}) = ${f[m]} for each of the ${5 - m} admissible s values`,
    perS.size === 5 - m && [...perS.values()].every((n) => n === f[m]),
    `got ${JSON.stringify([...perS.entries()].sort())}`,
  );
}

// f(1) by hand: the tail run is all four cells, so no type-a or type-c switch
// is free. The only remaining freedom is the common bus, which admits "no
// type-b closed" or "exactly one of b1..b4": 1 + 4 = 5.
check("hand-derived f(1) = 1 + 4 = 5", f[1] === 1 + 4);

// f(2) by hand: c1 is open and c2,c3 are closed, so the free switches are
// {a1, b1, b2, b3, b4}. The tail run {2,3,4} admits at most one of b2,b3,b4
// (4 choices) and a1,b1 are unconstrained (4 combinations): 16 in total. Of
// those, a1 and b1 both closed pins x1 twice - to phi(ESP) - 4 and to the bus -
// which is consistent only when the closed tail b sits at t = s. The 2
// combinations with t != s short circuit, leaving 16 - 2 = 14.
check("hand-derived f(2) = 4 x 4 - 2 = 14", f[2] === 4 * 4 - 2);

console.log("\nStep 7: the closed form accounts for the whole valid set");

// Family I = sum over m of f(m) x (number of admissible s), and s ranges over
// the tail run cells m..4, so there are 5 - m of them.
const familyITotal = [1, 2, 3, 4].reduce((sum, m) => sum + f[m] * (5 - m), 0);
check(
  "5x4 + 14x3 + 63x2 + 278x1 = 466 reproduces Family I",
  familyITotal === 466,
  `${familyITotal}`,
);
check("466 + 99 = 565 reproduces the full valid set", familyITotal + familyII.length === 565);

console.log("\nStep 8: the invalid configuration and the population census");

// The common bus can route ES- to a cell's positive pole while a type-a switch
// reaches its negative pole. Current flows the wrong way through the load, so
// the configuration is invalid and excluded from the usable set.
const reverse = all.filter((r) => r.status === "invalid");
check("exactly one configuration is invalid on this basis", reverse.length === 1, `${reverse.length}`);
check(
  "it is R1B,R1C,R2C,R3A,R4B,R4C",
  reverse.length === 1 &&
    reverse[0].rawVoltage === -4 &&
    reverse[0].voltage === 0 &&
    reverse[0].switches.map((b) => (b ? 1 : 0)).join("") === "011001100011",
  reverse.length === 1
    ? `${reverse[0].rawVoltage} V ${reverse[0].switches.map((b) => (b ? 1 : 0)).join("")}`
    : "",
);
check("no usable row has negative voltage", !validRows.some((r) => r.voltage < 0));

const shorts = all.filter((r) => r.status === "short-circuit").length;
const zero = all.filter((r) => r.status === "valid" && r.voltage === 0).length;
check(
  "2380 short + 1150 zero-output + 1 invalid + 565 usable = 4096",
  shorts === 2380 &&
    zero === 1150 &&
    reverse.length === 1 &&
    validRows.length === 565 &&
    shorts + zero + reverse.length + validRows.length === 4096,
  `${shorts}+${zero}+${reverse.length}+${validRows.length}`,
);

console.log("\nStep 9: per-voltage census, cross-checked against the closed form");

// Family I contributes f(m) rows at voltage 4*(5-s) for each admissible (m,s).
// Collecting by voltage: 16 V needs s=1 hence m=1; 12 V needs s=2 with m in
// {1,2}; 8 V needs s=3 with m in {1,2,3}; 4 V needs s=4 with any m.
const predicted: Record<number, number> = {
  16: f[1],
  12: f[1] + f[2],
  8: f[1] + f[2] + f[3],
  4: f[1] + f[2] + f[3] + f[4],
};
for (const v of [4, 8, 12, 16]) {
  const actualFamilyI = familyI.filter((r) => r.voltage === v).length;
  check(
    `Family I at ${v} V = ${predicted[v]}`,
    actualFamilyI === predicted[v],
    `got ${actualFamilyI}`,
  );
}

const census: Record<number, number> = { 4: 437, 8: 101, 12: 22, 16: 5 };
for (const v of [4, 8, 12, 16]) {
  check(
    `total valid rows at ${v} V = ${census[v]}`,
    validRows.filter((r) => r.voltage === v).length === census[v],
    `got ${validRows.filter((r) => r.voltage === v).length}`,
  );
}
check(
  "the per-voltage census sums to 565",
  Object.values(census).reduce((a, b) => a + b, 0) === 565,
);

console.log(
  failures === 0
    ? `\nHand derivation agrees with the solver on every count.\n`
    : `\n${failures} check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
