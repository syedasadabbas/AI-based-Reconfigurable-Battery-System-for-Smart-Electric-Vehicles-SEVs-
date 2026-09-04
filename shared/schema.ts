import { z } from "zod";

// ─── Core DB-like types (formerly inferred from drizzle tables) ───────────────

export type Configuration = {
  id: string;
  configId: string;
  switchStates: string; // "101 101 000 000" format
  voltage: number;
  voltageGroup: string;
  connectionType: string;
  activeCells: number;
  createdAt: Date;
};

export type InsertConfiguration = Omit<Configuration, "id" | "createdAt">;

export type Session = {
  id: string;
  configId: string;
  switchStates: string;
  voltage: number;
  sessionId: string;
  createdAt: Date;
};

export type InsertSession = Omit<Session, "id" | "createdAt">;

export type CellStateDB = {
  id: string;
  sessionId: string;
  cellId: number;
  health: number;
  soc: number;
  activations: number;
  restingTime: number;
  totalUsageTime: number;
  degradationRate: number;
  useCount: number;
  lastUsedDistance: number;
  isResting: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertCellState = Omit<CellStateDB, "id" | "createdAt" | "updatedAt">;

// ─── Switch / export schemas ──────────────────────────────────────────────────

export const switchConfigSchema = z.object({
  switches: z.array(z.boolean()).length(12),
});

export type SwitchConfig = z.infer<typeof switchConfigSchema>;

export const exportRequestSchema = z.object({
  format: z.enum(["xlsx", "csv", "pdf"]),
  voltageFilter: z.string().optional(),
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;

// ─── Statistics ───────────────────────────────────────────────────────────────

export const statisticsSchema = z.object({
  totalConfigurations: z.number(),
  voltageGroups: z.record(z.number()),
  distribution: z.array(
    z.object({
      voltage: z.number(),
      count: z.number(),
      percentage: z.number(),
    })
  ),
});

export type Statistics = z.infer<typeof statisticsSchema>;

// ─── Terrain / simulation types ───────────────────────────────────────────────

export enum TerrainType {
  STRAIGHT_L1 = "A",
  STRAIGHT_L2 = "B",
  INCLINE_L1 = "D",
  INCLINE_L2 = "E",
  DECLINE_L1 = "V",
  DECLINE_L2 = "W",
  HILL = "H",
  TURN = "T",
  ROUGH = "R",
  PAVED = "P",
  STEEP = "S",
}

export enum SceneType {
  HIGHWAY = "highway",
  URBAN = "urban",
  CITY = "city",
  MOUNTAIN = "mountain",
  DESERT = "desert",
  RURAL = "rural",
}

export enum SurfaceType {
  SMOOTH = "smooth",
  ROUGH = "rough",
  GRAVEL = "gravel",
  DIRT = "dirt",
}

export enum AudioCue {
  IDLE = "idle",
  CRUISE = "cruise",
  POWER = "power",
  MAX_POWER = "max_power",
  BUMP = "bump",
}

export const terrainMetadata: Record<
  TerrainType,
  {
    name: string;
    requiredVoltage: number;
    speedModifier: number;
    color: string;
    description: string;
    curveAngle: number;
    grade: number;
    surface: SurfaceType;
    audioCue: AudioCue;
  }
> = {
  [TerrainType.STRAIGHT_L1]: {
    name: "Straight Road L1",
    requiredVoltage: 4,
    speedModifier: 1.0,
    color: "#3b82f6",
    description: "Flat straight road - minimal power",
    curveAngle: 0,
    grade: 0,
    surface: SurfaceType.SMOOTH,
    audioCue: AudioCue.CRUISE,
  },
  [TerrainType.STRAIGHT_L2]: {
    name: "Straight Road L2",
    requiredVoltage: 8,
    speedModifier: 1.2,
    color: "#60a5fa",
    description: "Straight road with moderate traffic",
    curveAngle: 0,
    grade: 0,
    surface: SurfaceType.SMOOTH,
    audioCue: AudioCue.CRUISE,
  },
  [TerrainType.INCLINE_L1]: {
    name: "Incline L1",
    requiredVoltage: 8,
    speedModifier: 0.7,
    color: "#f59e0b",
    description: "Gentle uphill slope",
    curveAngle: 0,
    grade: 15,
    surface: SurfaceType.SMOOTH,
    audioCue: AudioCue.POWER,
  },
  [TerrainType.INCLINE_L2]: {
    name: "Incline L2",
    requiredVoltage: 12,
    speedModifier: 0.5,
    color: "#f97316",
    description: "Steep uphill climb",
    curveAngle: 0,
    grade: 25,
    surface: SurfaceType.SMOOTH,
    audioCue: AudioCue.POWER,
  },
  [TerrainType.DECLINE_L1]: {
    name: "Decline L1",
    requiredVoltage: 4,
    speedModifier: 1.3,
    color: "#10b981",
    description: "Gentle downhill slope",
    curveAngle: 0,
    grade: -15,
    surface: SurfaceType.SMOOTH,
    audioCue: AudioCue.IDLE,
  },
  [TerrainType.DECLINE_L2]: {
    name: "Decline L2",
    requiredVoltage: 0,
    speedModifier: 1.5,
    color: "#34d399",
    description: "Steep downhill - regenerative braking",
    curveAngle: 0,
    grade: -25,
    surface: SurfaceType.SMOOTH,
    audioCue: AudioCue.IDLE,
  },
  [TerrainType.HILL]: {
    name: "Hill",
    requiredVoltage: 12,
    speedModifier: 0.6,
    color: "#dc2626",
    description: "Rolling hills - variable power",
    curveAngle: 0,
    grade: 20,
    surface: SurfaceType.SMOOTH,
    audioCue: AudioCue.POWER,
  },
  [TerrainType.TURN]: {
    name: "Turn",
    requiredVoltage: 8,
    speedModifier: 0.8,
    color: "#8b5cf6",
    description: "Sharp turn - moderate power",
    curveAngle: 45,
    grade: 0,
    surface: SurfaceType.SMOOTH,
    audioCue: AudioCue.CRUISE,
  },
  [TerrainType.ROUGH]: {
    name: "Rough Terrain",
    requiredVoltage: 12,
    speedModifier: 0.5,
    color: "#78716c",
    description: "Unpaved rough road - high power",
    curveAngle: 0,
    grade: 5,
    surface: SurfaceType.ROUGH,
    audioCue: AudioCue.POWER,
  },
  [TerrainType.PAVED]: {
    name: "Highway",
    requiredVoltage: 4,
    speedModifier: 1.4,
    color: "#06b6d4",
    description: "Smooth paved highway",
    curveAngle: 0,
    grade: 0,
    surface: SurfaceType.SMOOTH,
    audioCue: AudioCue.CRUISE,
  },
  [TerrainType.STEEP]: {
    name: "Steep Incline",
    requiredVoltage: 16,
    speedModifier: 0.4,
    color: "#dc2626",
    description: "Very steep climb - maximum power",
    curveAngle: 0,
    grade: 30,
    surface: SurfaceType.SMOOTH,
    audioCue: AudioCue.MAX_POWER,
  },
};

export const roadSegmentSchema = z.object({
  distance: z.number().positive(),
  terrainType: z.nativeEnum(TerrainType),
  requiredVoltage: z.number(),
  terrainName: z.string(),
  color: z.string(),
  speedModifier: z.number(),
  curveAngle: z.number().default(0),
  grade: z.number().default(0),
  surface: z.nativeEnum(SurfaceType).default(SurfaceType.SMOOTH),
  audioCue: z.nativeEnum(AudioCue),
});

export type RoadSegment = z.infer<typeof roadSegmentSchema>;

export const roadProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  encoded: z.string(),
  segments: z.array(roadSegmentSchema),
  totalDistance: z.number(),
  averageVoltage: z.number(),
  difficulty: z.enum(["Easy", "Medium", "Hard", "Extreme"]),
  sceneType: z.nativeEnum(SceneType).default(SceneType.HIGHWAY),
});

export type RoadProfile = z.infer<typeof roadProfileSchema>;

export const carSimulationStateSchema = z.object({
  currentSegmentIndex: z.number(),
  distanceInSegment: z.number(),
  totalDistanceTraveled: z.number(),
  currentVoltage: z.number(),
  currentConfiguration: z.string().optional(),
  speed: z.number(),
  isPlaying: z.boolean(),
  playbackSpeed: z.number(),
});

export type CarSimulationState = z.infer<typeof carSimulationStateSchema>;

// ─── Pack Analysis types ──────────────────────────────────────────────────────

export enum PackTerrainType {
  STRAIGHT_ROAD = "A",
  INCLINED_L1 = "B",
  INCLINED_L2 = "C",
  INCLINED_L3 = "D",
  CURVY_L1 = "E",
  CURVY_L2 = "F",
  CURVY_L3 = "G",
  DECLINED_L1 = "H",
  DECLINED_L2 = "I",
  DECLINED_L3 = "J",
  BUMPY_L1 = "K",
  BUMPY_L2 = "L",
  BUMPY_L3 = "M",
  IN_CU_BU_L1 = "N",
  IN_CU_BU_L2 = "O",
  IN_CU_BU_L3 = "P",
  DE_CU_L1 = "Q",
  DE_CU_L2 = "R",
  DE_CU_L3 = "S",
  DE_CU_BUMPY_L1 = "T",
  DE_CU_BUMPY_L2 = "U",
  DE_CU_BUMPY_L3 = "V",
  IN_CU_L1 = "W",
  IN_CU_L2 = "X",
  IN_CU_L3 = "Y",
}

// Required supply voltage per terrain, in volts.
//
// These were originally specified as 4/6/8/12/16 V, but 6 V cannot be produced
// by a 4-cell pack of 4 V cells: the terminal voltage is always a whole number
// of cells in series, and unequal parallel branches short circuit rather than
// averaging (see shared/battery-model.ts, OUTPUT_VOLTAGES). The six terrains
// that asked for 6 V are therefore served at 8 V - the nearest achievable
// voltage that does not under-supply them. Under-supplying by dropping to 4 V
// would leave those terrains without enough voltage to be driven.
// TODO(supervisor): confirm 8 V is the intended substitution for the former
// 6 V terrains, or re-specify those terrains at 4 V.
export const packTerrainMetadata: Record<PackTerrainType, { description: string; voltage: number }> = {
  [PackTerrainType.STRAIGHT_ROAD]: { description: "Straight Road", voltage: 4 },
  [PackTerrainType.INCLINED_L1]: { description: "Inclined Level 1", voltage: 8 }, // was 6 V (unachievable)
  [PackTerrainType.INCLINED_L2]: { description: "Inclined Level 2", voltage: 8 },
  [PackTerrainType.INCLINED_L3]: { description: "Inclined Level 3", voltage: 16 },
  [PackTerrainType.CURVY_L1]: { description: "Curvy Level 1", voltage: 4 },
  [PackTerrainType.CURVY_L2]: { description: "Curvy Level 2", voltage: 8 }, // was 6 V (unachievable)
  [PackTerrainType.CURVY_L3]: { description: "Curvy Level 3", voltage: 12 },
  [PackTerrainType.DECLINED_L1]: { description: "Declined Level 1", voltage: 4 },
  [PackTerrainType.DECLINED_L2]: { description: "Declined Level 2", voltage: 8 }, // was 6 V (unachievable)
  [PackTerrainType.DECLINED_L3]: { description: "Declined Level 3", voltage: 8 },
  [PackTerrainType.BUMPY_L1]: { description: "Bumpy Level 1", voltage: 8 }, // was 6 V (unachievable)
  [PackTerrainType.BUMPY_L2]: { description: "Bumpy Level 2", voltage: 8 },
  [PackTerrainType.BUMPY_L3]: { description: "Bumpy Level 3", voltage: 16 },
  [PackTerrainType.IN_CU_BU_L1]: { description: "In-Cu-Bu- Level1", voltage: 8 },
  [PackTerrainType.IN_CU_BU_L2]: { description: "In-Cu-Bu- Level2", voltage: 12 },
  [PackTerrainType.IN_CU_BU_L3]: { description: "In-Cu-Bu- Level3", voltage: 16 },
  [PackTerrainType.DE_CU_L1]: { description: "De-Cu Level 1", voltage: 4 },
  [PackTerrainType.DE_CU_L2]: { description: "De-Cu Level 2", voltage: 8 }, // was 6 V (unachievable)
  [PackTerrainType.DE_CU_L3]: { description: "De-Cu Level 3", voltage: 8 },
  [PackTerrainType.DE_CU_BUMPY_L1]: { description: "De-Cu-Bumpy Level 1", voltage: 8 },
  [PackTerrainType.DE_CU_BUMPY_L2]: { description: "De-Cu-Bumpy Level 2", voltage: 12 },
  [PackTerrainType.DE_CU_BUMPY_L3]: { description: "De-Cu-Bumpy Level 3", voltage: 16 },
  [PackTerrainType.IN_CU_L1]: { description: "In-Cu Level 1", voltage: 8 }, // was 6 V (unachievable)
  [PackTerrainType.IN_CU_L2]: { description: "In-Cu Level 2", voltage: 8 },
  [PackTerrainType.IN_CU_L3]: { description: "In-Cu Level 3", voltage: 12 },
};

export const packConfigurationSchema = z.object({
  id: z.string(),
  voltage: z.number(),
  combination: z.string(),
  closedSwitches: z.array(z.string()),
  switchValues: z.record(z.number()),
});

export type PackConfiguration = z.infer<typeof packConfigurationSchema>;

export const packSegmentSchema = z.object({
  type: z.nativeEnum(PackTerrainType),
  description: z.string(),
  length: z.number(),
  voltage: z.number(),
});

export type PackSegment = z.infer<typeof packSegmentSchema>;

export const cellStateSchema = z.object({
  id: z.number(),
  activations: z.number(),
  health: z.number(),
  soc: z.number(),
});

export type CellState = z.infer<typeof cellStateSchema>;

export const packAnalysisResultSchema = z.object({
  segments: z.array(
    packSegmentSchema.extend({
      configId: z.string(),
      configCombination: z.string(),
      closedSwitches: z.array(z.string()),
      activatedCells: z.array(z.number()),
    })
  ),
  totalDistance: z.number(),
  averageVoltage: z.number(),
  configCount: z.number(),
  switchCount: z.number(),
  totalCellActivations: z.number(),
  cellStates: z.array(cellStateSchema),
  voltageDistribution: z.record(z.number()),
  switchUsage: z.record(z.number()),
  configUsage: z.record(z.number()),
});

export type PackAnalysisResult = z.infer<typeof packAnalysisResultSchema>;

// ─── AI Monitoring types ──────────────────────────────────────────────────────

export enum AIModelType {
  LSTM = "LSTM",
  LINEAR_REGRESSION = "LINEAR_REGRESSION",
  SVM = "SVM",
  ENSEMBLE = "ENSEMBLE",
}

export const aiCellStateSchema = cellStateSchema.extend({
  restingTime: z.number().default(0),
  totalUsageTime: z.number().default(0),
  degradationRate: z.number().default(0),
  predictedSOH: z.number(),
  predictedSOC: z.number(),
  isResting: z.boolean().default(false),
  useCount: z.number().default(0),
  lastUsedDistance: z.number().default(0),
});

export type AICellState = z.infer<typeof aiCellStateSchema>;

export const aiPredictionSchema = z.object({
  cellId: z.number(),
  predictedSOC: z.number(),
  predictedSOH: z.number(),
  confidence: z.number(),
  recommendRest: z.boolean(),
  estimatedRestTime: z.number(),
});

export type AIPrediction = z.infer<typeof aiPredictionSchema>;

export const aiConfigRecommendationSchema = z.object({
  voltage: z.number(),
  recommendedConfigId: z.string(),
  alternativeConfigIds: z.array(z.string()),
  cellsToActivate: z.array(z.number()),
  cellsToRest: z.array(z.number()),
  confidence: z.number(),
  reason: z.string(),
});

export type AIConfigRecommendation = z.infer<typeof aiConfigRecommendationSchema>;

export const aiMonitoringSegmentSchema = z.object({
  distance: z.number(),
  terrainType: z.nativeEnum(TerrainType),
  requiredVoltage: z.number(),
  selectedConfigId: z.string(),
  selectedConfigCombination: z.string(),
  activatedCells: z.array(z.number()),
  restedCells: z.array(z.number()),
  aiRecommendation: aiConfigRecommendationSchema,
  cellStatesAfter: z.array(aiCellStateSchema),
  switchesUsed: z.array(z.string()),
});

export type AIMonitoringSegment = z.infer<typeof aiMonitoringSegmentSchema>;

export const aiMonitoringSessionSchema = z.object({
  sessionId: z.string(),
  roadProfileId: z.string(),
  roadProfileName: z.string(),
  modelType: z.nativeEnum(AIModelType),
  startTime: z.date(),
  endTime: z.date().optional(),
  totalDistance: z.number(),
  segments: z.array(aiMonitoringSegmentSchema),
  cellStates: z.array(aiCellStateSchema),
  metrics: z.object({
    averageSOH: z.number(),
    averageSOC: z.number(),
    totalConfigSwitches: z.number(),
    uniqueConfigsUsed: z.number(),
    cellBalanceScore: z.number(),
    restEfficiency: z.number(),
    predictedRemainingLife: z.number(),
    energyEfficiency: z.number(),
  }),
  recommendations: z.array(z.string()),
});

export type AIMonitoringSession = z.infer<typeof aiMonitoringSessionSchema>;

export const aiTrainingDataSchema = z.object({
  cellId: z.number(),
  distance: z.number(),
  voltage: z.number(),
  activations: z.number(),
  soh: z.number(),
  soc: z.number(),
  temperature: z.number().default(25),
  current: z.number().default(0),
});

export type AITrainingData = z.infer<typeof aiTrainingDataSchema>;
