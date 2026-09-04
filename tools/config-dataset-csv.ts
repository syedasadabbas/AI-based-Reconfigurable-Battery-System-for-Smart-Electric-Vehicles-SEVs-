/**
 * CSV serialisation for the configuration dataset. The circuit model itself
 * lives in shared/battery-model.ts - this file only formats it.
 */
import { generateAll, type ConfigRow } from "../shared/battery-model";
import { SWITCH_NAMES, formatSwitchStates } from "../shared/battery-model";

export { generateAll };
export type { ConfigRow };

const SWITCH_HEADERS = SWITCH_NAMES;

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
    const grouped = formatSwitchStates(r.switches);
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
