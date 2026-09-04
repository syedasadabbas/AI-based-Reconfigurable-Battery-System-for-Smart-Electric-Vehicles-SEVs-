/**
 * Thin delegate onto shared/battery-model.ts.
 *
 * This file used to contain its own 200-line circuit analysis, duplicated
 * byte-for-byte in server/circuit-solver.ts, which disagreed with the project
 * specification: it derived the terminal voltage as
 * `activeCells.size * CELL_VOLTAGE` regardless of how those cells were wired,
 * so it counted cells that carry no load current, could not distinguish a
 * short circuit from a working configuration, and never reported a parallel or
 * series-parallel connection.
 *
 * The verified model now lives in shared/battery-model.ts and is checked three
 * independent ways by `npm run dataset:all`. Keep this as a delegate only - do
 * not reintroduce circuit logic here.
 */
import { analyseConfiguration, isUsable, CELL_VOLTAGE } from "@shared/battery-model";

export const circuitSolver = {
  /** Terminal voltage in volts; 0 for open, short-circuit or invalid configurations. */
  calculateVoltage(switches: boolean[]): number {
    const row = analyseConfiguration(switches, "#calc");
    return isUsable(row) ? row.voltage : 0;
  },

  /** The cells that actually carry load current. */
  getActiveCellsSet(switches: boolean[]): Set<number> {
    const row = analyseConfiguration(switches, "#calc");
    return new Set(isUsable(row) ? row.activeCells : []);
  },

  /** How many cells carry load current. */
  getActiveCellCount(switches: boolean[]): number {
    return this.getActiveCellsSet(switches).size;
  },

  CELL_VOLTAGE,
};

export default circuitSolver;
