/**
 * Local data store — replaces all server/API calls.
 * Everything is computed in-browser with no backend dependency.
 */

import type { Configuration, Statistics, RoadProfile, Session, CellStateDB, AICellState } from "@shared/schema";
import { SceneType } from "@shared/schema";
import { circuitSolver } from "./circuit-solver";
import { parseRoadProfile, PREDEFINED_ROAD_PROFILES } from "./road-profile-parser";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSwitchStates(switches: boolean[]): string {
  const groups: string[] = [];
  for (let i = 0; i < 4; i++) {
    const cell = switches.slice(i * 3, (i + 1) * 3);
    groups.push(cell.map(s => (s ? "1" : "0")).join(""));
  }
  return groups.join(" ");
}

function getVoltageGroup(voltage: number): string {
  if (voltage === 0) return "Zero Output";
  if (voltage === 4) return "Single Cell";
  if (voltage === 6) return "Mixed Configuration";
  if (voltage === 8) return "Two Series";
  if (voltage === 10) return "Three Mixed";
  if (voltage === 12) return "Three Series";
  if (voltage === 14) return "Four Mixed";
  if (voltage === 16) return "Full Series";
  return `${voltage}V Configuration`;
}

function getConnectionType(activeCells: number, voltage: number): string {
  if (activeCells === 0) return "Disconnected";
  if (activeCells === 1) return "Single Cell";
  if (voltage === activeCells * 4) return "Series";
  return "Mixed";
}

// ─── Configurations (generated once, cached in memory) ───────────────────────

let _configurations: Configuration[] | null = null;

export function getAllConfigurations(): Configuration[] {
  if (_configurations) return _configurations;

  const configs: Configuration[] = [];
  for (let i = 0; i < 4096; i++) {
    const switches: boolean[] = [];
    for (let bit = 0; bit < 12; bit++) {
      switches.push((i & (1 << bit)) !== 0);
    }

    const switchStates = formatSwitchStates(switches);
    const voltage = circuitSolver.calculateVoltage(switches);
    const activeCells = circuitSolver.getActiveCellCount(switches);
    const connectionType = getConnectionType(activeCells, voltage);
    const voltageGroup = getVoltageGroup(voltage);

    configs.push({
      id: `cfg-${i}`,
      configId: `#${i.toString().padStart(4, "0")}`,
      switchStates,
      voltage,
      voltageGroup,
      connectionType,
      activeCells,
      createdAt: new Date(0),
    });
  }

  _configurations = configs;
  return configs;
}

export function getConfigurationsByVoltage(voltage: number): Configuration[] {
  return getAllConfigurations().filter(c => c.voltage === voltage);
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export function getStatistics(): Statistics {
  const configs = getAllConfigurations();
  const voltageGroups: Record<string, number> = {};

  for (const config of configs) {
    const key = config.voltage.toString();
    voltageGroups[key] = (voltageGroups[key] ?? 0) + 1;
  }

  const distribution = Object.entries(voltageGroups)
    .map(([voltage, count]) => ({
      voltage: parseFloat(voltage),
      count,
      percentage: Math.round((count / configs.length) * 100 * 10) / 10,
    }))
    .sort((a, b) => a.voltage - b.voltage);

  return { totalConfigurations: configs.length, voltageGroups, distribution };
}

// ─── Calculate (circuit solver, same as before) ───────────────────────────────

export function calculateConfig(switches: boolean[]) {
  const voltage = circuitSolver.calculateVoltage(switches);
  const activeCellsSet = circuitSolver.getActiveCellsSet(switches);
  const activeCells = activeCellsSet.size;
  const connectionType = getConnectionType(activeCells, voltage);
  const voltageGroup = getVoltageGroup(voltage);
  const switchStates = formatSwitchStates(switches);
  const configIndex = switches.reduce((acc, s, i) => acc + (s ? 1 << i : 0), 0);
  const configId = `#${configIndex.toString().padStart(4, "0")}`;

  return {
    voltage,
    voltageGroup,
    connectionType,
    activeCells,
    activeCellsArray: Array.from(activeCellsSet),
    configId,
    switchStates,
  };
}

// ─── Road Profiles ────────────────────────────────────────────────────────────

const SCENE_TYPES: Record<string, SceneType> = {
  "city-commute": SceneType.URBAN,
  "mountain-pass": SceneType.MOUNTAIN,
  "highway-cruise": SceneType.HIGHWAY,
  "off-road-adventure": SceneType.RURAL,
  "extreme-challenge": SceneType.MOUNTAIN,
  "mixed-terrain": SceneType.HIGHWAY,
  "gentle-hills": SceneType.RURAL,
  "urban-delivery": SceneType.CITY,
};

let _roadProfiles: RoadProfile[] | null = null;

export function getRoadProfiles(): RoadProfile[] {
  if (_roadProfiles) return _roadProfiles;

  const profiles: RoadProfile[] = [];
  for (const p of PREDEFINED_ROAD_PROFILES) {
    try {
      const parsed = parseRoadProfile(p.encoded, p.name, p.id);
      profiles.push({ ...parsed, sceneType: SCENE_TYPES[p.id] ?? SceneType.HIGHWAY });
    } catch (e) {
      console.error(`Failed to parse road profile ${p.id}:`, e);
    }
  }

  _roadProfiles = profiles;
  return profiles;
}

export function getRoadProfile(id: string): RoadProfile | null {
  return getRoadProfiles().find(p => p.id === id) ?? null;
}

// ─── Sessions (localStorage) ──────────────────────────────────────────────────

const sessionKey = (sessionId: string) => `bc_sessions_${sessionId}`;

export function getSessionHistory(sessionId: string): Session[] {
  try {
    const raw = localStorage.getItem(sessionKey(sessionId));
    if (!raw) return [];
    const sessions = JSON.parse(raw) as Session[];
    return sessions.map(s => ({ ...s, createdAt: new Date(s.createdAt) }));
  } catch {
    return [];
  }
}

export function createSession(data: {
  configId: string;
  switchStates: string;
  voltage: number;
  sessionId: string;
}): Session {
  const existing = getSessionHistory(data.sessionId);
  const newSession: Session = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date(),
  };
  existing.unshift(newSession);
  localStorage.setItem(sessionKey(data.sessionId), JSON.stringify(existing));
  return newSession;
}

export function clearSessionHistory(sessionId: string): void {
  localStorage.removeItem(sessionKey(sessionId));
}

// ─── Cell States (localStorage) ───────────────────────────────────────────────

const cellStateKey = (sessionId: string) => `bc_cell_states_${sessionId}`;

export function getCellStates(sessionId: string): CellStateDB[] {
  try {
    const raw = localStorage.getItem(cellStateKey(sessionId));
    if (!raw) return [];
    return JSON.parse(raw) as CellStateDB[];
  } catch {
    return [];
  }
}

export function saveCellStates(sessionId: string, cellStates: AICellState[]): CellStateDB[] {
  const now = new Date();
  const dbStates: CellStateDB[] = cellStates.map(cs => ({
    id: crypto.randomUUID(),
    sessionId,
    cellId: cs.id,
    health: cs.health,
    soc: cs.soc,
    activations: cs.activations,
    restingTime: cs.restingTime,
    totalUsageTime: cs.totalUsageTime,
    degradationRate: cs.degradationRate,
    useCount: cs.useCount,
    lastUsedDistance: cs.lastUsedDistance,
    isResting: cs.isResting,
    createdAt: now,
    updatedAt: now,
  }));
  localStorage.setItem(cellStateKey(sessionId), JSON.stringify(dbStates));
  return dbStates;
}

export function clearCellStates(sessionId: string): void {
  localStorage.removeItem(cellStateKey(sessionId));
}

// ─── CSV generation (for export) ─────────────────────────────────────────────

export function generateCSV(configurations: Configuration[]): string {
  const headers = [
    "Config ID",
    "R1A", "R1B", "R1C",
    "R2A", "R2B", "R2C",
    "R3A", "R3B", "R3C",
    "R4A", "R4B", "R4C",
    "Voltage",
    "Voltage Class",
    "Combination Type",
    "Active Cells",
  ];

  const rows = configurations.map(config => {
    const switchArray = config.switchStates.replace(/\s/g, "").split("").map(s => s === "1");
    return [
      config.configId,
      ...switchArray.map(s => (s ? "1" : "0")),
      config.voltage,
      config.voltageGroup,
      config.connectionType,
      config.activeCells,
    ];
  });

  return [headers, ...rows].map(row => row.join(",")).join("\n");
}
