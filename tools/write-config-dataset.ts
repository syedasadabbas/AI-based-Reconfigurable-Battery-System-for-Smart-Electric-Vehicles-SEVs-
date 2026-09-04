/**
 * CLI entry point: writes the full 4096-configuration dataset to
 * data/battery-configurations-all.csv (every configuration, including
 * short-circuit and zero-output cases) and
 * data/battery-configurations-valid.csv (voltage-producing configurations only).
 *
 * Run with:  npx tsx tools/write-config-dataset.ts
 */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { generateAll, toCsv } from "./generate-config-dataset";

const rows = generateAll();
const valid = rows.filter((r) => r.status === "valid" && r.voltage > 0);

const outputs: [string, string][] = [
  ["data/battery-configurations-all.csv", toCsv(rows)],
  ["data/battery-configurations-valid.csv", toCsv(valid)],
];

for (const [relativePath, contents] of outputs) {
  const target = resolve(process.cwd(), relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, "utf8");
  console.log(`wrote ${relativePath} (${contents.split("\n").length - 2} data rows)`);
}

// Summary for the report / supervisor hand-off.
const byVoltage = new Map<number, number>();
const byClass = new Map<string, number>();
for (const r of valid) {
  byVoltage.set(r.voltage, (byVoltage.get(r.voltage) ?? 0) + 1);
  byClass.set(r.connectionClass, (byClass.get(r.connectionClass) ?? 0) + 1);
}

console.log(`\ntotal configurations      : ${rows.length}`);
console.log(`short circuit (excluded)  : ${rows.filter((r) => r.status === "short-circuit").length}`);
console.log(`zero output               : ${rows.filter((r) => r.status === "valid" && r.voltage === 0).length}`);
console.log(`voltage producing         : ${valid.length}`);
console.log("\nby voltage (V):");
[...byVoltage.entries()].sort((a, b) => a[0] - b[0]).forEach(([v, n]) => console.log(`  ${v} V : ${n}`));
console.log("\nby connection class:");
[...byClass.entries()].sort().forEach(([c, n]) => console.log(`  ${c} : ${n}`));
