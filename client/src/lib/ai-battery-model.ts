import type { 
  AICellState, 
  AIPrediction, 
  AIConfigRecommendation, 
  Configuration
} from '@shared/schema';
import { AIModelType } from '@shared/schema';
import { circuitSolver } from './circuit-solver';

const TOTAL_RANGE = 400;

// LSTM Model Constants (Conservative - slower degradation, higher accuracy)
const LSTM_SOC_REDUCTION_PER_KM = 0.20; // Slower SOC consumption
const LSTM_SOH_REDUCTION_PER_KM = 0.008; // Slower health degradation
const LSTM_REST_RECOVERY_RATE = 0.025; // Better recovery during rest
const LSTM_CONFIDENCE_BASE = 95; // Highest confidence

// Linear Regression Constants (Aggressive - faster degradation, baseline)
const LR_SOC_REDUCTION_PER_KM = 0.30; // Faster SOC consumption
const LR_SOH_REDUCTION_PER_KM = 0.015; // Faster health degradation
const LR_REST_RECOVERY_RATE = 0.018; // Lower recovery during rest
const LR_CONFIDENCE_BASE = 75; // Baseline confidence

// Actual physics constants (average for updateCellState - represents "real world")
const ACTUAL_SOC_REDUCTION_PER_KM = 0.25; // Average consumption
const ACTUAL_SOH_REDUCTION_PER_KM = 0.012; // Average health degradation
const ACTUAL_REST_RECOVERY_RATE = 0.022; // Average recovery

// Model-specific thresholds for intelligent cell resting decisions
// LSTM: Conservative - only rest when truly critical (lower thresholds = less frequent resting)
const LSTM_MIN_SOC_THRESHOLD = 25;
const LSTM_MIN_SOH_THRESHOLD = 65;

// Linear Regression: Aggressive - rest cells more often (higher thresholds = more frequent resting)
const LR_MIN_SOC_THRESHOLD = 40;
const LR_MIN_SOH_THRESHOLD = 80;

// Ensemble: Balanced approach
const ENSEMBLE_MIN_SOC_THRESHOLD = 30;
const ENSEMBLE_MIN_SOH_THRESHOLD = 70;

// Cell activation conditions (same as pack-analysis)
const CELL_CONDITIONS = {
  1: [['RA1', 'RC1'], ['RA1', 'RB1'], ['RA1', 'RB1', 'RC1']],
  2: [['RC1', 'RB2'], ['RC1', 'RC2'], ['RA2', 'RB2'], ['RA2', 'RC2']],
  3: [['RC2', 'RB3'], ['RC2', 'RC3'], ['RA3', 'RB3'], ['RA3', 'RC3']],
  4: [['RC3', 'RB4'], ['RC3', 'RC4'], ['RA4', 'RB4'], ['RA4', 'RC4']],
};

/**
 * LSTM-inspired model for battery state prediction
 * Implements simplified LSTM logic with forget, input, and output gates
 */
class LSTMBatteryModel {
  private hiddenStates: Map<number, number[]>;
  private cellStates: Map<number, number[]>;
  private weights: {
    forget: number[][];
    input: number[][];
    output: number[][];
  };

  constructor() {
    this.hiddenStates = new Map();
    this.cellStates = new Map();
    
    // Initialize weights for 4 cells with simplified LSTM architecture
    this.weights = {
      forget: this.initializeWeights(4, 3),
      input: this.initializeWeights(4, 3),
      output: this.initializeWeights(4, 3),
    };

    // Initialize hidden states for each cell
    for (let i = 1; i <= 4; i++) {
      this.hiddenStates.set(i, [0.5, 0.5, 0.5]);
      this.cellStates.set(i, [1.0, 1.0, 1.0]);
    }
  }

  private initializeWeights(rows: number, cols: number): number[][] {
    const weights: number[][] = [];
    for (let i = 0; i < rows; i++) {
      weights[i] = [];
      for (let j = 0; j < cols; j++) {
        // Xavier initialization
        weights[i][j] = (Math.random() - 0.5) * 2 * Math.sqrt(6 / (rows + cols));
      }
    }
    return weights;
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  private tanh(x: number): number {
    return Math.tanh(x);
  }

  /**
   * Predict SOC and SOH using LSTM-inspired forward pass
   */
  predictCellState(
    cellId: number,
    currentSOC: number,
    currentSOH: number,
    activations: number,
    distance: number,
    isResting: boolean
  ): AIPrediction {
    // Normalize inputs
    const inputs = [
      currentSOC / 100,
      currentSOH / 100,
      activations / 100,
    ];

    const hiddenState = this.hiddenStates.get(cellId) || [0.5, 0.5, 0.5];
    const cellState = this.cellStates.get(cellId) || [1.0, 1.0, 1.0];

    // Forget gate
    const forgetGate = inputs.map((input, i) => 
      this.sigmoid(input * this.weights.forget[cellId - 1][i])
    );

    // Input gate
    const inputGate = inputs.map((input, i) => 
      this.sigmoid(input * this.weights.input[cellId - 1][i])
    );

    // Cell state update
    const candidateCell = inputs.map((input, i) => 
      this.tanh(input * this.weights.input[cellId - 1][i])
    );

    const newCellState = cellState.map((c, i) => 
      forgetGate[i] * c + inputGate[i] * candidateCell[i]
    );

    // Output gate
    const outputGate = inputs.map((input, i) => 
      this.sigmoid(input * this.weights.output[cellId - 1][i])
    );

    const newHiddenState = newCellState.map((c, i) => 
      outputGate[i] * this.tanh(c)
    );

    // Update stored states
    this.hiddenStates.set(cellId, newHiddenState);
    this.cellStates.set(cellId, newCellState);

    // Calculate predictions based on LSTM output and physics-based degradation
    let predictedSOC = currentSOC;
    let predictedSOH = currentSOH;

    if (isResting) {
      // Cell recovering while resting (LSTM is more optimistic)
      predictedSOC = Math.min(100, currentSOC + LSTM_REST_RECOVERY_RATE * distance);
      predictedSOH = Math.max(currentSOH - LSTM_SOH_REDUCTION_PER_KM * distance * 0.1, 0);
    } else {
      // Cell degrading during use (LSTM predicts slower degradation)
      predictedSOC = Math.max(0, currentSOC - LSTM_SOC_REDUCTION_PER_KM * distance);
      predictedSOH = Math.max(0, currentSOH - LSTM_SOH_REDUCTION_PER_KM * distance);
    }

    // Apply LSTM correction (blend physics model with learned model)
    const lstmSOCCorrection = (newHiddenState[0] - 0.5) * 10;
    const lstmSOHCorrection = (newHiddenState[1] - 0.5) * 5;

    predictedSOC = Math.max(0, Math.min(100, predictedSOC + lstmSOCCorrection));
    predictedSOH = Math.max(0, Math.min(100, predictedSOH + lstmSOHCorrection));

    // Calculate confidence based on prediction consistency (LSTM has highest confidence)
    const confidence = LSTM_CONFIDENCE_BASE - Math.abs(lstmSOCCorrection) - Math.abs(lstmSOHCorrection);

    // LSTM: Conservative resting strategy - only rest when truly critical
    const recommendRest = predictedSOC < LSTM_MIN_SOC_THRESHOLD || predictedSOH < LSTM_MIN_SOH_THRESHOLD;
    const estimatedRestTime = recommendRest ? 
      Math.max(10, (LSTM_MIN_SOC_THRESHOLD - predictedSOC) / LSTM_REST_RECOVERY_RATE) : 0;

    return {
      cellId,
      predictedSOC: Math.round(predictedSOC * 100) / 100,
      predictedSOH: Math.round(predictedSOH * 100) / 100,
      confidence: Math.max(0, Math.min(100, confidence)),
      recommendRest,
      estimatedRestTime: Math.round(estimatedRestTime),
    };
  }
}

/**
 * Linear Regression model for baseline comparison
 */
class LinearRegressionModel {
  predictCellState(
    cellId: number,
    currentSOC: number,
    currentSOH: number,
    activations: number,
    distance: number,
    isResting: boolean
  ): AIPrediction {
    // Simple linear model (more aggressive degradation)
    let predictedSOC = currentSOC;
    let predictedSOH = currentSOH;

    if (isResting) {
      predictedSOC = Math.min(100, currentSOC + LR_REST_RECOVERY_RATE * distance);
      predictedSOH = Math.max(currentSOH - LR_SOH_REDUCTION_PER_KM * distance * 0.1, 0);
    } else {
      predictedSOC = Math.max(0, currentSOC - LR_SOC_REDUCTION_PER_KM * distance);
      predictedSOH = Math.max(0, currentSOH - LR_SOH_REDUCTION_PER_KM * distance);
    }

    // Linear Regression: Aggressive resting strategy - rest cells more often
    const recommendRest = predictedSOC < LR_MIN_SOC_THRESHOLD || predictedSOH < LR_MIN_SOH_THRESHOLD;
    const estimatedRestTime = recommendRest ? 
      Math.max(10, (LR_MIN_SOC_THRESHOLD - predictedSOC) / LR_REST_RECOVERY_RATE) : 0;

    return {
      cellId,
      predictedSOC: Math.round(predictedSOC * 100) / 100,
      predictedSOH: Math.round(predictedSOH * 100) / 100,
      confidence: LR_CONFIDENCE_BASE,
      recommendRest,
      estimatedRestTime: Math.round(estimatedRestTime),
    };
  }
}

/**
 * Ensemble model combining LSTM and Linear Regression
 */
class EnsembleModel {
  private lstm: LSTMBatteryModel;
  private lr: LinearRegressionModel;

  constructor() {
    this.lstm = new LSTMBatteryModel();
    this.lr = new LinearRegressionModel();
  }

  predictCellState(
    cellId: number,
    currentSOC: number,
    currentSOH: number,
    activations: number,
    distance: number,
    isResting: boolean
  ): AIPrediction {
    const lstmPred = this.lstm.predictCellState(cellId, currentSOC, currentSOH, activations, distance, isResting);
    const lrPred = this.lr.predictCellState(cellId, currentSOC, currentSOH, activations, distance, isResting);

    // Weighted average (70% LSTM, 30% LR)
    const predictedSOC = lstmPred.predictedSOC * 0.7 + lrPred.predictedSOC * 0.3;
    const predictedSOH = lstmPred.predictedSOH * 0.7 + lrPred.predictedSOH * 0.3;
    const confidence = lstmPred.confidence * 0.7 + lrPred.confidence * 0.3;

    // Ensemble: Balanced resting strategy
    const recommendRest = predictedSOC < ENSEMBLE_MIN_SOC_THRESHOLD || predictedSOH < ENSEMBLE_MIN_SOH_THRESHOLD;
    const estimatedRestTime = Math.max(lstmPred.estimatedRestTime, lrPred.estimatedRestTime);

    return {
      cellId,
      predictedSOC: Math.round(predictedSOC * 100) / 100,
      predictedSOH: Math.round(predictedSOH * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      recommendRest,
      estimatedRestTime,
    };
  }
}

/**
 * Main AI Battery Monitoring System
 */
export class AIBatteryMonitor {
  private model: LSTMBatteryModel | LinearRegressionModel | EnsembleModel;
  private modelType: AIModelType;
  private recentCellUsage: Map<number, Set<number>>; // voltage -> Set of recently used cells
  private segmentHistory: Array<{ voltage: number; cells: number[] }>; // Track recent segments
  private readonly HISTORY_WINDOW = 3; // Track last 3 segments for each voltage

  constructor(modelType: AIModelType = AIModelType.LSTM) {
    this.modelType = modelType;
    this.recentCellUsage = new Map();
    this.segmentHistory = [];
    
    switch (modelType) {
      case AIModelType.LSTM:
        this.model = new LSTMBatteryModel();
        break;
      case AIModelType.LINEAR_REGRESSION:
        this.model = new LinearRegressionModel();
        break;
      case AIModelType.ENSEMBLE:
        this.model = new EnsembleModel();
        break;
      default:
        this.model = new LSTMBatteryModel();
    }
  }

  /**
   * Track cells used in this segment for history
   */
  private trackCellUsage(voltage: number, cells: number[]) {
    // Add to segment history
    this.segmentHistory.push({ voltage, cells });
    
    // Keep only recent history
    if (this.segmentHistory.length > this.HISTORY_WINDOW * 4) { // 4 voltage classes
      this.segmentHistory.shift();
    }
    
    // Update recent usage map for this voltage
    if (!this.recentCellUsage.has(voltage)) {
      this.recentCellUsage.set(voltage, new Set());
    }
    
    const recentCells = this.recentCellUsage.get(voltage)!;
    cells.forEach(c => recentCells.add(c));
    
    // Get segments of same voltage from history
    const sameVoltageSegments = this.segmentHistory
      .filter(s => s.voltage === voltage)
      .slice(-this.HISTORY_WINDOW);
    
    // Update recent cells to only include those from recent same-voltage segments
    recentCells.clear();
    sameVoltageSegments.forEach(s => {
      s.cells.forEach(c => recentCells.add(c));
    });
  }

  /**
   * Get cells that were recently used for this voltage
   */
  private getRecentlyUsedCells(voltage: number): Set<number> {
    return this.recentCellUsage.get(voltage) || new Set();
  }

  /**
   * Reset usage history (for new simulation)
   */
  resetHistory() {
    this.recentCellUsage.clear();
    this.segmentHistory = [];
  }

  /**
   * Get activated cells from switch configuration using circuit solver
   */
  private getActivatedCells(switchStates: string): number[] {
    // Parse switch states to boolean array
    const switches = switchStates.split(' ').flatMap(group => 
      group.split('').map(bit => bit === '1')
    );
    
    // Use circuit solver to get actual active cells
    const activeCellsSet = circuitSolver.getActiveCellsSet(switches);
    return Array.from(activeCellsSet).sort((a, b) => a - b);
  }

  /**
   * Predict future cell states
   */
  predictCellStates(
    cells: AICellState[],
    distance: number
  ): AIPrediction[] {
    return cells.map(cell => 
      this.model.predictCellState(
        cell.id,
        cell.soc,
        cell.health,
        cell.activations,
        distance,
        cell.isResting
      )
    );
  }

  /**
   * INTELLIGENT PRE-ANALYSIS: Analyze SOC and SOH to determine which cells need rest
   * This is the FIRST step before configuration selection
   * Each model uses its own thresholds for intelligent decision-making
   */
  private analyzeCellHealthBeforeSelection(
    cellStates: AICellState[],
    predictions: AIPrediction[]
  ): { 
    cellsNeedingRest: number[];
    cellsReadyForUse: number[];
    healthAnalysis: Map<number, { currentSOC: number; currentSOH: number; predictedSOC: number; predictedSOH: number; needsRest: boolean; reason: string }>;
  } {
    const cellsNeedingRest: number[] = [];
    const cellsReadyForUse: number[] = [];
    const healthAnalysis = new Map<number, { currentSOC: number; currentSOH: number; predictedSOC: number; predictedSOH: number; needsRest: boolean; reason: string }>();

    // Model-specific thresholds
    let socThreshold: number;
    let sohThreshold: number;
    
    switch (this.modelType) {
      case AIModelType.LSTM:
        socThreshold = LSTM_MIN_SOC_THRESHOLD;
        sohThreshold = LSTM_MIN_SOH_THRESHOLD;
        break;
      case AIModelType.LINEAR_REGRESSION:
        socThreshold = LR_MIN_SOC_THRESHOLD;
        sohThreshold = LR_MIN_SOH_THRESHOLD;
        break;
      case AIModelType.ENSEMBLE:
        socThreshold = ENSEMBLE_MIN_SOC_THRESHOLD;
        sohThreshold = ENSEMBLE_MIN_SOH_THRESHOLD;
        break;
      default:
        socThreshold = ENSEMBLE_MIN_SOC_THRESHOLD;
        sohThreshold = ENSEMBLE_MIN_SOH_THRESHOLD;
    }

    predictions.forEach(prediction => {
      const cell = cellStates.find(c => c.id === prediction.cellId);
      if (!cell) return;

      const currentSOC = cell.soc;
      const currentSOH = cell.health;
      const predictedSOC = prediction.predictedSOC;
      const predictedSOH = prediction.predictedSOH;

      let needsRest = false;
      let reason = '';

      // Check current AND predicted states
      if (currentSOC < socThreshold) {
        needsRest = true;
        reason = `Current SOC ${currentSOC.toFixed(1)}% below threshold ${socThreshold}%`;
      } else if (predictedSOC < socThreshold) {
        needsRest = true;
        reason = `Predicted SOC ${predictedSOC.toFixed(1)}% below threshold ${socThreshold}%`;
      } else if (currentSOH < sohThreshold) {
        needsRest = true;
        reason = `Current SOH ${currentSOH.toFixed(1)}% below threshold ${sohThreshold}%`;
      } else if (predictedSOH < sohThreshold) {
        needsRest = true;
        reason = `Predicted SOH ${predictedSOH.toFixed(1)}% below threshold ${sohThreshold}%`;
      } else if (prediction.recommendRest) {
        needsRest = true;
        reason = `AI model recommends rest`;
      } else {
        reason = `Healthy - SOC: ${currentSOC.toFixed(1)}%, SOH: ${currentSOH.toFixed(1)}%`;
      }

      healthAnalysis.set(prediction.cellId, {
        currentSOC,
        currentSOH,
        predictedSOC,
        predictedSOH,
        needsRest,
        reason
      });

      if (needsRest) {
        cellsNeedingRest.push(prediction.cellId);
      } else {
        cellsReadyForUse.push(prediction.cellId);
      }
    });

    return { cellsNeedingRest, cellsReadyForUse, healthAnalysis };
  }

  /**
   * Select optimal configuration based on cell states and required voltage
   * NOW WITH INTELLIGENT PRE-ANALYSIS:
   * 1. First analyze SOC/SOH to determine which cells need rest
   * 2. Then select configuration based on that analysis
   * 3. Each model works differently with its own thresholds
   */
  selectConfiguration(
    requiredVoltage: number,
    availableConfigs: Configuration[],
    cellStates: AICellState[],
    currentDistance: number,
    previousConfigIds: string[]
  ): AIConfigRecommendation {
    if (availableConfigs.length === 0) {
      throw new Error(`No configurations available for ${requiredVoltage}V`);
    }

    // STEP 1: Predict future states for all cells
    const predictions = this.predictCellStates(cellStates, 1);

    // STEP 2: INTELLIGENT PRE-ANALYSIS - Analyze SOC and SOH to determine which cells need rest
    // This is model-specific and happens BEFORE configuration selection
    const { cellsNeedingRest, cellsReadyForUse, healthAnalysis } = 
      this.analyzeCellHealthBeforeSelection(cellStates, predictions);

    // Get recently used cells for this voltage
    const recentlyUsedCells = this.getRecentlyUsedCells(requiredVoltage);

    // STEP 3: Score each configuration based on SOC/SOH analysis and model-specific priorities
    const scoredConfigs = availableConfigs.map(config => {
      const activatedCells = this.getActivatedCells(config.switchStates);
      const restedCells = [1, 2, 3, 4].filter(id => !activatedCells.includes(id));
      
      // Count how many cells in this config were recently used for this voltage
      const reusedCellsCount = activatedCells.filter(c => recentlyUsedCells.has(c)).length;
      
      // Count cells ready for use vs cells needing rest
      const activatedReadyCells = activatedCells.filter(id => cellsReadyForUse.includes(id));
      const activatedRestingCells = activatedCells.filter(id => cellsNeedingRest.includes(id));
      
      // Calculate cell health scores for ACTIVATED cells
      const activatedCellScores = activatedCells.map(cellId => {
        const cell = cellStates.find(c => c.id === cellId);
        if (!cell) return -1000;
        
        // CRITICAL: STRICTLY BLOCK activating cells that need rest
        // This is the highest priority - cells needing rest MUST rest
        if (cellsNeedingRest.includes(cellId)) {
          // Model-specific penalties for using cells that should rest
          switch (this.modelType) {
            case AIModelType.LSTM:
              return -500; // LSTM is conservative but still very strict
            case AIModelType.LINEAR_REGRESSION:
              return -800; // LR is most aggressive about resting
            case AIModelType.ENSEMBLE:
              return -650; // Ensemble is balanced but firm
            default:
              return -500;
          }
        }

        // HIGH PRIORITY BONUS: Cells that are READY for use (passed SOC/SOH check)
        const readyBonus = cellsReadyForUse.includes(cellId) ? 150 : 0;

        // STRONG penalty for cells recently used for this same voltage
        const recentUsagePenalty = recentlyUsedCells.has(cellId) ? -100 : 0;

        // Model-specific prioritization for healthy cells
        let socScore: number, sohScore: number;
        switch (this.modelType) {
          case AIModelType.LSTM:
            // LSTM: Prioritize cells with higher SOC more (maximize usage)
            socScore = cell.soc * 0.7;
            sohScore = cell.health * 0.4;
            break;
          case AIModelType.LINEAR_REGRESSION:
            // LR: Prioritize cells with higher SOH more (preserve health)
            socScore = cell.soc * 0.4;
            sohScore = cell.health * 0.7;
            break;
          case AIModelType.ENSEMBLE:
            // Ensemble: Balance both equally
            socScore = cell.soc * 0.55;
            sohScore = cell.health * 0.55;
            break;
          default:
            socScore = cell.soc * 0.5;
            sohScore = cell.health * 0.5;
        }
        
        // Penalize frequently used cells for overall load balancing
        const balanceScore = -cell.useCount * 2;
        
        // Bonus for cells that have rested recently (encourage rotation)
        const restBonus = cell.restingTime > 20 ? 30 : cell.restingTime > 10 ? 15 : 0;
        
        return readyBonus + socScore + sohScore + balanceScore + recentUsagePenalty + restBonus;
      });

      // Calculate rest benefit scores for RESTED cells
      const restedCellScores = restedCells.map(cellId => {
        const cell = cellStates.find(c => c.id === cellId);
        if (!cell) return 0;
        
        // Give HIGH bonus for resting cells with low SoC or SoH
        // The lower the SoC/SoH, the higher the benefit of resting this cell
        const socRestBenefit = (100 - cell.soc) * 0.8; // Max 80 points if SoC is 0%
        const sohRestBenefit = (100 - cell.health) * 0.8; // Max 80 points if SoH is 0%
        
        // Extra bonus if cell was recently used (needs recovery)
        const recoveryBonus = cell.lastUsedDistance >= currentDistance - 10 ? 20 : 0;
        
        return socRestBenefit + sohRestBenefit + recoveryBonus;
      });

      const avgActivatedScore = activatedCellScores.length > 0 
        ? activatedCellScores.reduce((a, b) => a + b, 0) / activatedCellScores.length 
        : 0;
      
      const avgRestedScore = restedCellScores.length > 0
        ? restedCellScores.reduce((a, b) => a + b, 0) / restedCellScores.length
        : 0;
      
      // PRIORITY 1: HEAVILY favor configurations that use ONLY ready cells
      // This ensures we prioritize cells that CAN be utilized
      const allActivatedAreReady = activatedCells.length > 0 && activatedCells.every(id => cellsReadyForUse.includes(id));
      const readyCellPriorityBonus = allActivatedAreReady ? 200 : 0;
      
      // PRIORITY 2: Bonus proportional to number of ready cells used
      const readyCellRatio = activatedCells.length > 0 ? (activatedReadyCells.length / activatedCells.length) : 0;
      const readyRatioBonus = readyCellRatio * 100;
      
      // PRIORITY 3: STRICT penalty if ANY cell needing rest is activated
      // This ensures cells that MUST rest are NOT used
      const restViolationPenalty = activatedRestingCells.length > 0 ? -1000 * activatedRestingCells.length : 0;
      
      // Prefer configurations not used recently (round-robin effect)
      const noveltyScore = previousConfigIds.includes(config.configId) ? -20 : 10;
      
      // Prefer configurations with fewer active cells (energy efficiency)
      const efficiencyScore = (4 - activatedCells.length) * 5;

      // CRITICAL: Strong penalty for configurations that reuse many recently-used cells
      // This forces rotation to different cell combinations within same voltage
      const cellRotationPenalty = -reusedCellsCount * 80;
      
      // Bonus for using completely different cells (none recently used)
      const freshCellBonus = reusedCellsCount === 0 ? 50 : 0;

      const finalScore = avgActivatedScore + avgRestedScore + readyCellPriorityBonus + 
                         readyRatioBonus + restViolationPenalty + noveltyScore + 
                         efficiencyScore + cellRotationPenalty + freshCellBonus;

      return {
        config,
        score: finalScore,
        activatedCells,
        reusedCellsCount,
        readyCellsCount: activatedReadyCells.length,
        allActivatedAreReady,
      };
    });

    // Sort by score
    scoredConfigs.sort((a, b) => b.score - a.score);
    
    // Intelligent selection with variation for similar scores
    // This creates different patterns each run while maintaining optimization
    const bestScore = scoredConfigs[0].score;
    const scoreThreshold = Math.max(20, Math.abs(bestScore) * 0.15); // 15% threshold or min 20 points
    
    // Find all configs within threshold of best score
    const topConfigs = scoredConfigs.filter(sc => 
      bestScore - sc.score <= scoreThreshold
    );
    
    let selected;
    if (topConfigs.length > 1) {
      // Multiple similarly-good options - use weighted random selection
      // Higher scores get higher probability, but not guaranteed
      const weights = topConfigs.map(sc => {
        const normalizedScore = sc.score - scoredConfigs[scoredConfigs.length - 1].score;
        return Math.max(1, normalizedScore + 50); // Add baseline weight
      });
      
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const random = Math.random() * totalWeight;
      
      let cumulativeWeight = 0;
      selected = topConfigs[0]; // fallback
      for (let i = 0; i < topConfigs.length; i++) {
        cumulativeWeight += weights[i];
        if (random <= cumulativeWeight) {
          selected = topConfigs[i];
          break;
        }
      }
    } else {
      // Clear best choice - use it
      selected = scoredConfigs[0];
    }

    // Track this selection for future rotation
    this.trackCellUsage(requiredVoltage, selected.activatedCells);

    // Get alternative configurations
    const alternatives = scoredConfigs.slice(1, 4).map(s => s.config.configId);

    // Determine which cells will rest
    const allCells = [1, 2, 3, 4];
    const cellsToRest = allCells.filter(id => !selected.activatedCells.includes(id));

    // Calculate confidence based on score distribution
    const scoreRange = scoredConfigs[0].score - scoredConfigs[scoredConfigs.length - 1].score;
    const confidence = Math.min(100, 60 + scoreRange);

    // Generate explanation with rotation info and health analysis
    const modelName = this.modelType === AIModelType.LSTM ? 'LSTM' : 
                     this.modelType === AIModelType.LINEAR_REGRESSION ? 'LR' : 'Ensemble';
    let reason = `[${modelName}] Config ${selected.config.configId} for ${requiredVoltage}V: `;
    
    // Highlight SOC/SOH-based prioritization
    if (selected.allActivatedAreReady) {
      reason += `✓ Using ONLY healthy cells ${selected.activatedCells.join(', ')} (all passed SOC/SOH check). `;
    } else if (selected.readyCellsCount > 0) {
      reason += `Prioritizing ${selected.readyCellsCount} healthy cell(s) from ${selected.activatedCells.join(', ')}. `;
    } else {
      reason += `Activating cells ${selected.activatedCells.join(', ')}. `;
    }
    
    // Show which cells are resting and why (based on SOC/SOH analysis)
    if (cellsNeedingRest.length > 0) {
      const restReasons = cellsNeedingRest
        .map(id => {
          const analysis = healthAnalysis.get(id);
          return analysis ? `Cell ${id}: ${analysis.reason}` : `Cell ${id}`;
        })
        .join('; ');
      reason += `RESTING: ${restReasons}. `;
    }
    
    reason += `${selected.config.connectionType} (${selected.config.activeCells} cells).`;

    return {
      voltage: requiredVoltage,
      recommendedConfigId: selected.config.configId,
      alternativeConfigIds: alternatives,
      cellsToActivate: selected.activatedCells,
      cellsToRest,
      confidence,
      reason,
    };
  }

  /**
   * Update cell state after segment
   */
  updateCellState(
    cell: AICellState,
    wasActivated: boolean,
    distance: number,
    prediction: AIPrediction
  ): AICellState {
    let newSOC = cell.soc;
    let newSOH = cell.health;
    
    if (wasActivated) {
      // Cell was used (actual physics)
      newSOC = Math.max(0, cell.soc - ACTUAL_SOC_REDUCTION_PER_KM * distance);
      newSOH = Math.max(0, cell.health - ACTUAL_SOH_REDUCTION_PER_KM * distance);
      
      return {
        ...cell,
        soc: newSOC,
        health: newSOH,
        predictedSOC: prediction.predictedSOC,
        predictedSOH: prediction.predictedSOH,
        activations: cell.activations + 1,
        useCount: cell.useCount + 1,
        totalUsageTime: cell.totalUsageTime + distance,
        isResting: false,
        lastUsedDistance: distance,
        restingTime: 0,
        degradationRate: (cell.health - newSOH) / distance,
      };
    } else {
      // Cell is resting - slight recovery in SOC (actual physics)
      newSOC = Math.min(100, cell.soc + ACTUAL_REST_RECOVERY_RATE * distance);
      newSOH = Math.max(0, cell.health - ACTUAL_SOH_REDUCTION_PER_KM * distance * 0.1);
      
      return {
        ...cell,
        soc: newSOC,
        health: newSOH,
        predictedSOC: prediction.predictedSOC,
        predictedSOH: prediction.predictedSOH,
        isResting: true,
        restingTime: cell.restingTime + distance,
        degradationRate: (cell.health - newSOH) / distance,
      };
    }
  }

  getModelType(): AIModelType {
    return this.modelType;
  }
}
