/**
 * End-to-end check for the /research-summary page.
 *
 * Verifies that the page content matches the source manuscript
 * "AI-based Reconfigurable Battery System for Smart Electric Vehicles (SEVs)"
 * (Shaheer, Abbas, Adeel, Asghar, Iqbal, Alaulamie).
 *
 * Two layers:
 *   1. Server-render the page and assert the always-mounted content (title,
 *      authors, affiliations, funding, headline results) reaches the DOM.
 *   2. Assert the paper-derived data tables directly, because Radix Tabs mounts
 *      only the active tab, so tab-gated tables never appear in the markup.
 *
 * Run:  npx tsx --tsconfig tsconfig.e2e.json tests/research-summary.e2e.tsx
 */

// wouter reads window.location during render; provide a minimal stub for SSR.
(globalThis as any).location = { pathname: "/research-summary", search: "", hash: "" };
(globalThis as any).history = { pushState() {}, replaceState() {} };
(globalThis as any).addEventListener = () => {};
(globalThis as any).removeEventListener = () => {};

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ResearchSummary, {
  AUTHORS,
  AFFILIATIONS,
  SEED_TRAINING,
  SEED_UNSEEN,
  TABLE_1,
  TABLE_2,
  TABLE_3,
  TABLE_4,
  TABLE_5,
  TABLE_6,
  CLASS_DISTRIBUTION,
  DOMINANT_RESISTORS,
  APP_ENUMERATION,
  REFERENCES,
} from "@/pages/research-summary";

let failures = 0;

function check(label: string, condition: boolean) {
  if (!condition) failures++;
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

// ---------------------------------------------------------------- 1. Rendering
const html = renderToStaticMarkup(React.createElement(ResearchSummary));

console.log("--- rendered DOM ---");
for (const [label, needle] of [
  ["paper title", "AI-based Reconfigurable Battery System for Smart Electric Vehicles"],
  ["keywords line", "AI · SEVs · LSTM · Reconfigurable Battery Pack"],
  ["grant number", "KFU264837"],
  ["LSTM headline accuracy", "92.5"],
  ["energy saving headline", "15%"],
  ["battery life headline", "~20%"],
  ["abstract v-class list", "v4, v6, v8, v12 and v16"],
] as [string, string][]) {
  check(`DOM contains ${label}`, html.includes(needle));
}

for (const a of AUTHORS) {
  check(`DOM contains author ${a.name}`, html.includes(a.name) && html.includes(a.email));
}
for (const aff of AFFILIATIONS) {
  check(`DOM contains affiliation ${aff.slice(0, 40)}…`, html.includes(aff));
}

console.log("\n--- content that must NOT survive from the previous version ---");
for (const [label, needle] of [
  ["co-author Umair Pirzada", "Umair Pirzada"],
  ["co-author Ali Amjad", "Ali Amjad"],
  ["co-author Mahnoor Tahir", "Mahnoor Tahir"],
  ["co-author Haseeb Ahmed", "Haseeb Ahmed"],
  ["'AI-Ready' framing", "AI-Ready"],
  ["invented RL configuration selector", "RL-Based Configuration Selection"],
  ["'Lead Researcher' attribution", "Lead Researcher"],
] as [string, string][]) {
  check(`DOM omits ${label}`, !html.includes(needle));
}

// ------------------------------------------------------------ 2. Paper figures
console.log("\n--- paper data ---");

check("6 authors", AUTHORS.length === 6);
check(
  "2 corresponding authors (Adeel, Asghar)",
  AUTHORS.filter((a) => a.role === "Corresponding author")
    .map((a) => a.name)
    .join("|") === "Hannan Adeel|Muhammad Nabeel Asghar",
);
check("3 affiliations", AFFILIATIONS.length === 3);

check("training seed", SEED_TRAINING === "36P41U86R9Q45D");
check("unseen seed", SEED_UNSEEN === "59R12A36U19Q55D10A");

check("Table 1 has 5 segments", TABLE_1.length === 5);
check(
  "Table 1 segments concatenate to the training seed",
  TABLE_1.map((r) => r.seg).join("") === SEED_TRAINING,
);
check(
  "Table 1 km match the segment prefixes",
  TABLE_1.every((r) => parseInt(r.seg, 10) === r.km),
);

check("Table 2 has 3 layers", TABLE_2.length === 3);
check(
  "Table 2 params sum to 67,076",
  TABLE_2.reduce((a, r) => a + Number(r.params.replace(/,/g, "")), 0) === 67076,
);

check("Table 3 covers ANN/RNN/CNN/LSTM", TABLE_3.map((r) => r.model).join(",") === "ANN,RNN,CNN,LSTM");
check("Table 3 LSTM accuracy is 92.5%", TABLE_3.find((r) => r.model === "LSTM")?.acc === 92.5);
check(
  "LSTM is the most accurate model",
  Math.max(...TABLE_3.map((r) => r.acc)) === TABLE_3.find((r) => r.model === "LSTM")!.acc,
);

check("Table 4 LSTM has the lowest loss", Math.min(...TABLE_4.map((r) => r.loss)) === 0.14);
check("Table 4 LSTM trains in 48 s", TABLE_4.find((r) => r.model === "LSTM")?.time === 48);

check("Table 5 reports epochs 1/10 and 10/10", TABLE_5.map((r) => r.epoch).join(",") === "1/10,10/10");
check(
  "Table 5 final validation loss below final training loss",
  TABLE_5[1].vloss < TABLE_5[1].loss,
);

check("Table 6 has 6 segments", TABLE_6.length === 6);
check(
  "Table 6 segments concatenate to the unseen seed",
  TABLE_6.map((r) => r.seg).join("") === SEED_UNSEEN,
);
check("Table 6 55D predicts v16", TABLE_6.find((r) => r.seg === "55D")?.cls === "v16");
check(
  "Table 6 straight L1 segments predict v4",
  TABLE_6.filter((r) => r.type === "Straight L1").every((r) => r.cls === "v4"),
);

check("5 voltage classes including 6 V", CLASS_DISTRIBUTION.length === 5);
check("8 V is the most common class at 60.7%", CLASS_DISTRIBUTION[0].voltage === "8 V" && CLASS_DISTRIBUTION[0].pct === 60.7);
check(
  "class percentages sum to ~99.9%",
  Math.abs(CLASS_DISTRIBUTION.reduce((a, c) => a + c.pct, 0) - 99.9) < 0.001,
);

check("dominant resistor for 8 V is RA2 (743)", DOMINANT_RESISTORS.find((r) => r.cls === "8 V")?.count === 743);
check("6 V comes only from combined topology", DOMINANT_RESISTORS.find((r) => r.cls === "6 V")?.topology === "Combined series-parallel");

// --------------------------------------------- 3. This application's own data
console.log("\n--- this application's solver enumeration ---");
const total = APP_ENUMERATION.reduce((a, r) => a + r.n, 0);
const operational = APP_ENUMERATION.filter((r) => r.v !== "0 V").reduce((a, r) => a + r.n, 0);
check("enumeration totals 4,096 switch settings", total === 4096);
check("1,573 operational configurations", operational === 1573);

console.log("\n--- references ---");
check("37 references", REFERENCES.length === 37);
check("no empty reference", REFERENCES.every((r) => r.trim().length > 20));
check("no duplicate reference text", new Set(REFERENCES).size === REFERENCES.length);

console.log(`\nRendered ${html.length} bytes of HTML. ${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
