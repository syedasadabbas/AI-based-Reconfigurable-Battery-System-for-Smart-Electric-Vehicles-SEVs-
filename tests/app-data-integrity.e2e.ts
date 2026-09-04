/**
 * End-to-end check that the APPLICATION serves the verified configuration data.
 *
 * The other dataset tests verify shared/battery-model.ts in isolation. This one
 * goes through the layer the running app actually uses: client/src/lib/
 * local-store.ts, which client/src/lib/queryClient.ts serves every /api/* call
 * from. It also checks that every terrain voltage the app can demand is
 * actually producible, which is what previously failed silently.
 *
 * Run with:  npm run dataset:appcheck
 */
import { getAllConfigurations, getStatistics, calculateConfig } from "@/lib/local-store";
import {
  generateAll,
  generateAllAppConfigurations,
  isUsable,
  OUTPUT_VOLTAGES,
  ACHIEVABLE_VOLTAGES,
} from "@shared/battery-model";
import { terrainMetadata, packTerrainMetadata, PackTerrainType } from "@shared/schema";

let failures = 0;
function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name}${detail ? ` -- ${detail}` : ""}`);
  }
}

const configs = getAllConfigurations();
const stats = getStatistics();
const model = generateAllAppConfigurations();

console.log("\nThe app's configuration store");

check("serves all 4096 configurations", configs.length === 4096, `${configs.length}`);
check(
  "every row matches the verified model field for field",
  configs.every((c, i) => {
    const m = model[i];
    return (
      c.configId === m.configId &&
      c.switchStates === m.switchStates &&
      c.voltage === m.voltage &&
      c.voltageGroup === m.voltageGroup &&
      c.connectionType === m.connectionType &&
      c.activeCells === m.activeCells
    );
  }),
);

const voltages = new Set(configs.map((c) => c.voltage));
check(
  "only achievable voltages appear (no 6 V, 10 V or 14 V)",
  [...voltages].every((v) => (ACHIEVABLE_VOLTAGES as readonly number[]).includes(v)),
  `got ${[...voltages].sort((a, b) => a - b).join(", ")}`,
);

const census: Record<number, number> = { 0: 3531, 4: 437, 8: 101, 12: 22, 16: 5 };
for (const v of [0, 4, 8, 12, 16]) {
  check(
    `${v} V group holds ${census[v]} configurations`,
    configs.filter((c) => c.voltage === v).length === census[v],
    `got ${configs.filter((c) => c.voltage === v).length}`,
  );
}
check(
  "the census accounts for all 4096",
  Object.values(census).reduce((a, b) => a + b, 0) === 4096,
);

console.log("\nConnection types are now fully represented");

const types = new Set(configs.map((c) => c.connectionType));
check("Parallel configurations are reported", types.has("Parallel"));
check("Series-Parallel configurations are reported", types.has("Series-Parallel"));
check("Short Circuit is reported as its own type", types.has("Short Circuit"));
check(
  "counts are 461 series / 91 parallel / 13 series-parallel",
  configs.filter((c) => c.connectionType === "Series").length === 461 &&
    configs.filter((c) => c.connectionType === "Parallel").length === 91 &&
    configs.filter((c) => c.connectionType === "Series-Parallel").length === 13,
  `${configs.filter((c) => c.connectionType === "Series").length}/` +
    `${configs.filter((c) => c.connectionType === "Parallel").length}/` +
    `${configs.filter((c) => c.connectionType === "Series-Parallel").length}`,
);
check(
  "no configuration is labelled with a voltage it cannot deliver",
  configs.every((c) => (c.voltage === 0) === (c.activeCells === 0)),
);

console.log("\nStatistics endpoint");

check("total matches the configuration count", stats.totalConfigurations === 4096);
check(
  "voltage groups are keyed only by achievable voltages",
  Object.keys(stats.voltageGroups).every((k) =>
    (ACHIEVABLE_VOLTAGES as readonly number[]).includes(Number(k)),
  ),
  Object.keys(stats.voltageGroups).join(", "),
);
check(
  "group counts sum to 4096",
  Object.values(stats.voltageGroups).reduce((a, b) => a + b, 0) === 4096,
);
check(
  "distribution percentages sum to about 100",
  Math.abs(stats.distribution.reduce((a, d) => a + d.percentage, 0) - 100) < 1,
);

console.log("\nThe /api/calculate path");

const all = generateAll();
let calcMismatch = 0;
for (let mask = 0; mask < 4096; mask++) {
  const switches: boolean[] = [];
  for (let bit = 0; bit < 12; bit++) switches.push((mask & (1 << bit)) !== 0);
  const got = calculateConfig(switches);
  const want = all[mask];
  const wantVoltage = isUsable(want) ? want.voltage : 0;
  if (
    got.voltage !== wantVoltage ||
    got.activeCellsArray.join(",") !== (isUsable(want) ? want.activeCells.join(",") : "")
  ) {
    calcMismatch++;
  }
}
check(
  "calculateConfig agrees with the verified model on all 4096 inputs",
  calcMismatch === 0,
  `${calcMismatch} mismatches`,
);

console.log("\nEvery terrain voltage the app can demand is producible");

const producible = new Set(configs.filter((c) => c.voltage > 0).map((c) => c.voltage));

const routeVoltages = new Set(Object.values(terrainMetadata).map((t: any) => t.requiredVoltage));
const unsatisfiableRoute = [...routeVoltages].filter((v) => v !== 0 && !producible.has(v));
check(
  "terrainMetadata: every requiredVoltage can be supplied",
  unsatisfiableRoute.length === 0,
  `unsatisfiable: ${unsatisfiableRoute.join(", ")}`,
);

const packVoltages = new Set(Object.values(packTerrainMetadata).map((t: any) => t.voltage));
const unsatisfiablePack = [...packVoltages].filter((v) => v !== 0 && !producible.has(v));
check(
  "packTerrainMetadata: every required voltage can be supplied",
  unsatisfiablePack.length === 0,
  `unsatisfiable: ${unsatisfiablePack.join(", ")}`,
);
check(
  "pack terrain voltages are drawn from the producible output set",
  [...packVoltages].every((v) => (OUTPUT_VOLTAGES as readonly number[]).includes(v)),
  `got ${[...packVoltages].sort((a, b) => a - b).join(", ")}`,
);

// The six terrains that originally specified 6 V are served at 8 V. Assert the
// substitution held and did not disturb the level ordering: within each terrain
// family, Level 1 must not demand more than Level 2, nor Level 2 more than
// Level 3.
check(
  "no terrain still asks for 6 V",
  !Object.values(packTerrainMetadata).some((t: any) => t.voltage === 6),
);
// PackTerrainType members are single-letter codes ("A".."Y"), so go through the
// enum to reach each terrain by its readable member name.
const voltageOf = (member: keyof typeof PackTerrainType) =>
  packTerrainMetadata[PackTerrainType[member]]?.voltage;

check(
  "the six formerly-6 V terrains are served at 8 V",
  (["INCLINED_L1", "CURVY_L2", "DECLINED_L2", "BUMPY_L1", "DE_CU_L2", "IN_CU_L1"] as const).every(
    (k) => voltageOf(k) === 8,
  ),
  (["INCLINED_L1", "CURVY_L2", "DECLINED_L2", "BUMPY_L1", "DE_CU_L2", "IN_CU_L1"] as const)
    .map((k) => `${k}=${voltageOf(k)}`)
    .join(" "),
);

const families = new Map<string, { level: number; voltage: number }[]>();
for (const member of Object.keys(PackTerrainType) as (keyof typeof PackTerrainType)[]) {
  const m = /^(.*)_L([123])$/.exec(member);
  if (!m) continue;
  if (!families.has(m[1])) families.set(m[1], []);
  families.get(m[1])!.push({ level: Number(m[2]), voltage: voltageOf(member)! });
}
const nonMonotone: string[] = [];
for (const [family, levels] of Array.from(families.entries())) {
  levels.sort((a, b) => a.level - b.level);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i].voltage < levels[i - 1].voltage) nonMonotone.push(family);
  }
}
check(
  "terrain level ordering is monotone in every family",
  nonMonotone.length === 0,
  `broken: ${nonMonotone.join(", ")}`,
);
check(
  "all 8 levelled terrain families were checked",
  families.size === 8,
  `${families.size}`,
);

console.log(
  failures === 0
    ? "\nThe application serves the verified dataset everywhere.\n"
    : `\n${failures} check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
