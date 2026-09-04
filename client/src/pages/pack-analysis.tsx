import { useState } from 'react';
import { read, utils } from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Upload, PlayCircle, AlertCircle, Activity, Table as TableIcon, TrendingUp, Lightbulb, AlertTriangle, Award, DollarSign, LineChart, Battery } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { PackConfiguration, PackTerrainType, packTerrainMetadata, CellState, PackAnalysisResult } from '@shared/schema';
import { circuitSolver } from '@/lib/circuit-solver';
import { OUTPUT_VOLTAGES } from '@shared/battery-model';

// Constants
const TOTAL_RANGE = 400;
const SOC_REDUCTION_PER_KM = 100 / TOTAL_RANGE;
const SOH_REDUCTION_PER_KM = 0.01;
const SWITCH_COST_PER_ACTIVATION = 0.05; // Energy cost per switch
const CELL_COST_PER_ACTIVATION = 0.1; // Degradation cost per cell activation
const ALL_SWITCHES = ['RA1', 'RA2', 'RA3', 'RA4', 'RB1', 'RB2', 'RB3', 'RB4', 'RC1', 'RC2', 'RC3', 'RC4'];

const CHART_COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444'];

interface AdvancedMetrics {
  efficiencyScore: number;
  switchingCost: number;
  degradationCost: number;
  totalCost: number;
  configurationBalance: number;
  cellBalanceScore: number;
  optimizationRecommendations: string[];
  predictedLifespan: number;
  energyEfficiency: number;
}

export default function PackAnalysis() {
  // Keyed by the voltages this pack can actually produce. The previous list
  // included 6 V and omitted 12 V's unreachable neighbours; 6 V configurations
  // can never be supplied, so requiring them made this page unusable with the
  // application's own CSV export. See shared/battery-model.ts OUTPUT_VOLTAGES.
  const [configurations, setConfigurations] = useState<Record<number, PackConfiguration[]>>(
    Object.fromEntries(OUTPUT_VOLTAGES.map((v) => [v, [] as PackConfiguration[]])),
  );
  const [roadProfile, setRoadProfile] = useState('');
  const [analysisResult, setAnalysisResult] = useState<PackAnalysisResult | null>(null);
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedMetrics | null>(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [configStats, setConfigStats] = useState<Record<number, number>>(
    Object.fromEntries(OUTPUT_VOLTAGES.map((v) => [v, 0])),
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const data = await file.arrayBuffer();
    const workbook = read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json(worksheet) as any[];

    const newConfigs: Record<number, PackConfiguration[]> = { 4: [], 6: [], 8: [], 12: [], 16: [] };
    const stats: Record<number, number> = Object.fromEntries(OUTPUT_VOLTAGES.map((v) => [v, 0]));

    // Detect format: dashboard export format or original format
    const isDashboardFormat = jsonData[0] && 'Voltage' in jsonData[0];

    if (isDashboardFormat) {
      // Dashboard export format: Config ID, R1A-R4C, Voltage, Voltage Class, Combination Type, Active Cells
      const switchMapping: Record<string, string> = {
        'R1A': 'RA1', 'R1B': 'RB1', 'R1C': 'RC1',
        'R2A': 'RA2', 'R2B': 'RB2', 'R2C': 'RC2',
        'R3A': 'RA3', 'R3B': 'RB3', 'R3C': 'RC3',
        'R4A': 'RA4', 'R4B': 'RB4', 'R4C': 'RC4',
      };

      jsonData.forEach((row, index) => {
        const voltage = parseInt(row['Voltage']) as number;
        const combination = row['Combination Type'] as string;

        if ((OUTPUT_VOLTAGES as readonly number[]).includes(voltage)) {
          const switchValues: Record<string, number> = {};
          const closedSwitches: string[] = [];

          // Map R1A-R4C to RA1-RC4 format
          Object.entries(switchMapping).forEach(([dashboardKey, packKey]) => {
            const value = parseInt(row[dashboardKey]);
            switchValues[packKey] = value;
            if (value === 0) {
              closedSwitches.push(packKey);
            }
          });

          newConfigs[voltage].push({
            id: row['Config ID'] || `C${voltage}-${String(index + 1).padStart(3, '0')}`,
            voltage,
            combination: combination || 'Unknown',
            closedSwitches,
            switchValues,
          });

          stats[voltage]++;
        }
      });
    } else {
      // Original format: VOLTS, COMB, RA1-RC4
      jsonData.forEach((row, index) => {
        const voltage = row['VOLTS'] as number;
        const combination = row['COMB'] as string;

        if ((OUTPUT_VOLTAGES as readonly number[]).includes(voltage)) {
          const switchValues: Record<string, number> = {};
          ALL_SWITCHES.forEach(sw => {
            switchValues[sw] = row[sw];
          });

          const closedSwitches = ALL_SWITCHES.filter(sw => row[sw] === 0);

          newConfigs[voltage].push({
            id: `C${voltage}-${String(index + 1).padStart(3, '0')}`,
            voltage,
            combination,
            closedSwitches,
            switchValues,
          });

          stats[voltage]++;
        }
      });
    }

    setConfigurations(newConfigs);
    setConfigStats(stats);
    setError('');
  };

  const parseRoadProfile = (profile: string): Array<{ type: PackTerrainType; length: number }> => {
    const segments: Array<{ type: PackTerrainType; length: number }> = [];
    const regex = /(\d+)([A-Z])/g;
    let match;

    while ((match = regex.exec(profile)) !== null) {
      const length = parseInt(match[1]);
      const type = match[2] as PackTerrainType;

      if (packTerrainMetadata[type]) {
        segments.push({ type, length });
      }
    }

    return segments;
  };

  const getActivatedCells = (closedSwitches: string[]): number[] => {
    // Convert closedSwitches to boolean array for circuit solver
    // In pack-analysis, a switch with value 0 is "closed" (ON)
    // Map: RA1->R1A, RB1->R1B, RC1->R1C, etc.
    const switchOrder = ['RA1', 'RB1', 'RC1', 'RA2', 'RB2', 'RC2', 'RA3', 'RB3', 'RC3', 'RA4', 'RB4', 'RC4'];
    const switches = switchOrder.map(sw => closedSwitches.includes(sw));
    
    // Use circuit solver to get actual active cells
    const activeCellsSet = circuitSolver.getActiveCellsSet(switches);
    return Array.from(activeCellsSet).sort((a, b) => a - b);
  };

  const calculateAdvancedMetrics = (result: PackAnalysisResult): AdvancedMetrics => {
    // Calculate switching cost
    const switchingCost = result.switchCount * SWITCH_COST_PER_ACTIVATION;
    
    // Calculate degradation cost
    const degradationCost = result.totalCellActivations * CELL_COST_PER_ACTIVATION;
    
    // Total cost
    const totalCost = switchingCost + degradationCost;
    
    // Configuration balance (how evenly configurations are used)
    const configUsageValues = Object.values(result.configUsage);
    const avgUsage = configUsageValues.reduce((a, b) => a + b, 0) / configUsageValues.length;
    const variance = configUsageValues.reduce((sum, val) => sum + Math.pow(val - avgUsage, 2), 0) / configUsageValues.length;
    const configurationBalance = Math.max(0, 100 - Math.sqrt(variance) * 10);
    
    // Cell balance score (how evenly cells degrade)
    const cellHealthVariance = result.cellStates.reduce((sum, cell) => 
      sum + Math.pow(cell.health - 100 + (result.totalDistance * SOH_REDUCTION_PER_KM / 4), 2), 0
    ) / 4;
    const cellBalanceScore = Math.max(0, 100 - Math.sqrt(cellHealthVariance) * 2);
    
    // Energy efficiency (higher voltage = more efficient)
    const energyEfficiency = (result.averageVoltage / 16) * 100;
    
    // Efficiency score (composite)
    const efficiencyScore = (
      configurationBalance * 0.3 +
      cellBalanceScore * 0.3 +
      energyEfficiency * 0.2 +
      (100 - Math.min(totalCost * 10, 100)) * 0.2
    );
    
    // Predicted lifespan based on current degradation rate
    const avgHealthRemaining = result.cellStates.reduce((sum, cell) => sum + cell.health, 0) / 4;
    const degradationRate = (100 - avgHealthRemaining) / result.totalDistance;
    const predictedLifespan = avgHealthRemaining / Math.max(degradationRate, 0.01);
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (configurationBalance < 70) {
      recommendations.push('⚠️ Configuration usage is imbalanced. Consider rotating configurations more evenly to distribute wear.');
    }
    
    if (cellBalanceScore < 70) {
      recommendations.push('⚠️ Cell degradation is uneven. Optimize switch patterns to balance load across all cells.');
    }
    
    const mostUsedCell = result.cellStates.reduce((max, cell) => 
      cell.activations > max.activations ? cell : max
    );
    const leastUsedCell = result.cellStates.reduce((min, cell) => 
      cell.activations < min.activations ? cell : min
    );
    
    if (mostUsedCell.activations > leastUsedCell.activations * 1.5) {
      recommendations.push(`⚠️ Cell ${mostUsedCell.id} is overused (${mostUsedCell.activations} activations vs ${leastUsedCell.activations} for Cell ${leastUsedCell.id}). Rebalance configuration selection.`);
    }
    
    if (energyEfficiency < 60) {
      recommendations.push('💡 Low average voltage detected. Consider using higher voltage configurations when possible for better efficiency.');
    }
    
    if (totalCost > 5) {
      recommendations.push(`💰 High operational cost detected ($${totalCost.toFixed(2)}). Reduce switching frequency and cell activations.`);
    }
    
    if (predictedLifespan < 1000) {
      recommendations.push(`⚠️ Limited predicted lifespan (${predictedLifespan.toFixed(0)} km). Current configuration pattern accelerates degradation.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Excellent configuration! All metrics are within optimal ranges.');
    }
    
    return {
      efficiencyScore,
      switchingCost,
      degradationCost,
      totalCost,
      configurationBalance,
      cellBalanceScore,
      optimizationRecommendations: recommendations,
      predictedLifespan,
      energyEfficiency,
    };
  };

  const analyzeRoadProfile = () => {
    if (!roadProfile.trim()) {
      setError('Please enter a road profile');
      return;
    }

    const hasConfigs = Object.values(configurations).some(configs => configs.length > 0);
    if (!hasConfigs) {
      setError('Please upload a model file first');
      return;
    }

    setError('');

    const segments = parseRoadProfile(roadProfile);
    if (segments.length === 0) {
      setError('Invalid road profile format. Example: 55D78S12A5H');
      return;
    }

    // Validate that we have configurations for all required voltages
    const requiredVoltages = new Set<number>();
    segments.forEach(segment => {
      const metadata = packTerrainMetadata[segment.type];
      requiredVoltages.add(metadata.voltage);
    });

    const missingVoltages: number[] = [];
    requiredVoltages.forEach(voltage => {
      if (!configurations[voltage] || configurations[voltage].length === 0) {
        missingVoltages.push(voltage);
      }
    });

    if (missingVoltages.length > 0) {
      const availableVoltages = Object.entries(configStats)
        .filter(([_, count]) => count > 0)
        .map(([voltage]) => `${voltage}V`)
        .join(', ');
      
      setError(
        `Missing configurations for required voltages: ${missingVoltages.map(v => `${v}V`).join(', ')}. ` +
        `Available voltages in uploaded file: ${availableVoltages || 'None'}. ` +
        `Please upload a file that includes configurations for ${OUTPUT_VOLTAGES.map(v => `${v}V`).join(', ')}.`
      );
      return;
    }

    const cellStates: CellState[] = [
      { id: 1, activations: 0, health: 100, soc: 100 },
      { id: 2, activations: 0, health: 100, soc: 100 },
      { id: 3, activations: 0, health: 100, soc: 100 },
      { id: 4, activations: 0, health: 100, soc: 100 },
    ];

    const voltageDistribution: Record<number, number> = { 4: 0, 6: 0, 8: 0, 12: 0, 16: 0 };
    const switchUsage: Record<string, number> = {};
    const configUsage: Record<string, number> = {};
    const nextConfigIndex: Record<number, number> = { 4: 0, 6: 0, 8: 0, 12: 0, 16: 0 };

    ALL_SWITCHES.forEach(sw => { switchUsage[sw] = 0; });

    let totalDistance = 0;
    let totalVoltage = 0;
    let configCount = 0;
    let switchCount = 0;

    const analyzedSegments = segments.map(segment => {
      const metadata = packTerrainMetadata[segment.type];
      const requiredVoltage = metadata.voltage;

      const configs = configurations[requiredVoltage];
      if (!configs || configs.length === 0) {
        throw new Error(`No configurations found for voltage ${requiredVoltage}V`);
      }

      const configIndex = nextConfigIndex[requiredVoltage];
      const config = configs[configIndex];
      nextConfigIndex[requiredVoltage] = (configIndex + 1) % configs.length;

      voltageDistribution[requiredVoltage] += segment.length;
      configUsage[config.id] = (configUsage[config.id] || 0) + 1;

      config.closedSwitches.forEach(sw => {
        switchUsage[sw] = (switchUsage[sw] || 0) + 1;
        switchCount++;
      });

      configCount++;

      const activatedCells = getActivatedCells(config.closedSwitches);

      activatedCells.forEach(cellId => {
        const cell = cellStates[cellId - 1];
        cell.activations++;
        const socReduction = SOC_REDUCTION_PER_KM * segment.length;
        const healthReduction = SOH_REDUCTION_PER_KM * segment.length;
        cell.health = Math.max(0, cell.health - healthReduction);
        cell.soc = Math.max(0, cell.soc - socReduction);
      });

      totalDistance += segment.length;
      totalVoltage += requiredVoltage * segment.length;

      return {
        type: segment.type,
        description: metadata.description,
        length: segment.length,
        voltage: requiredVoltage,
        configId: config.id,
        configCombination: config.combination,
        closedSwitches: config.closedSwitches,
        activatedCells,
      };
    });

    const result: PackAnalysisResult = {
      segments: analyzedSegments,
      totalDistance,
      averageVoltage: totalVoltage / totalDistance,
      configCount,
      switchCount,
      totalCellActivations: cellStates.reduce((sum, cell) => sum + cell.activations, 0),
      cellStates,
      voltageDistribution,
      switchUsage,
      configUsage,
    };

    setAnalysisResult(result);
    setAdvancedMetrics(calculateAdvancedMetrics(result));
  };

  const voltageChartData = analysisResult
    ? Object.entries(analysisResult.voltageDistribution).map(([voltage, km]) => ({
        voltage: `${voltage}V`,
        distance: km,
      }))
    : [];

  const switchChartData = analysisResult
    ? Object.entries(analysisResult.switchUsage).map(([name, count]) => ({
        name,
        count,
      }))
    : [];

  const cellHealthData = analysisResult
    ? analysisResult.cellStates.map(cell => ({
        name: `Cell ${cell.id}`,
        health: cell.health,
        soc: cell.soc,
        activations: cell.activations,
      }))
    : [];

  const cellRadarData = analysisResult
    ? analysisResult.cellStates.map(cell => ({
        cell: `C${cell.id}`,
        health: cell.health,
        soc: cell.soc,
        activations: (cell.activations / Math.max(...analysisResult.cellStates.map(c => c.activations))) * 100,
      }))
    : [];

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-700';
    return 'text-red-600';
  };

  const getEfficiencyBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-600' };
    if (score >= 60) return { label: 'Good', color: 'bg-yellow-600' };
    return { label: 'Needs Optimization', color: 'bg-red-600' };
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 flex-1">
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent" data-testid="text-header">
            Battery Pack Analysis
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto" data-testid="text-subtitle">
            Advanced Reconfigurable Battery System with Intelligent Cell Activation Tracking, Health Monitoring, and Road Profile Analysis
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-primary flex items-center gap-2 text-xl">
              <Upload className="w-6 h-6" />
              Upload Battery Configuration Model
            </CardTitle>
            <CardDescription className="text-base">
              Upload Excel file exported from Dashboard or Simulation (supports all voltage configurations)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center flex-wrap">
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg transition-all shadow-md hover:shadow-lg font-semibold">
                  Choose Excel File
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="input-model-file"
                />
              </label>
              {fileName && (
                <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg border">
                  <Activity className="w-4 h-4 text-green-600" />
                  <span className="text-foreground font-medium" data-testid="text-filename">{fileName}</span>
                </div>
              )}
            </div>

            {Object.values(configStats).some(v => v > 0) && (
              <div className="mt-6 p-5 bg-muted rounded-lg border border-green-300">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-green-600" />
                  <h3 className="text-foreground font-semibold text-lg">Model Loaded Successfully</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  Deep learning model trained on {Object.values(configStats).reduce((a, b) => a + b, 0)} valid battery configurations
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {Object.entries(configStats).map(([voltage, count]) => (
                    <div key={voltage} className="bg-card px-4 py-3 rounded-lg text-center border border-border hover:border-primary transition-all shadow-sm">
                      <div className="text-3xl font-extrabold text-primary">{count}</div>
                      <div className="text-sm text-muted-foreground font-medium mt-1">{voltage}V Configs</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input Section */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-start flex-col sm:flex-row">
              <div className="flex-1 w-full">
                <Input
                  type="text"
                  value={roadProfile}
                  onChange={(e) => setRoadProfile(e.target.value)}
                  placeholder="Enter road profile (e.g., 55D78S12A5H)"
                  className="h-12 text-lg"
                  data-testid="input-road-profile"
                />
                <p className="text-sm text-muted-foreground mt-2 italic">
                  Example: 55D78S12A5H = 55km Inclined L3, 78km De-Cu L3, 12km Straight, 5km Declined L1
                </p>
              </div>
              <Button
                onClick={analyzeRoadProfile}
                className="gap-2 whitespace-nowrap h-12 px-8 shadow-md font-semibold text-base"
                data-testid="button-analyze"
              >
                <PlayCircle className="w-5 h-5" />
                Analyze with AI
              </Button>
            </div>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {analysisResult && advancedMetrics && (
          <div className="space-y-6">
            {/* Advanced Metrics Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Efficiency Score Card */}
              <Card className="border-blue-200 shadow-xl col-span-1 lg:col-span-1">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`text-7xl font-extrabold ${getEfficiencyColor(advancedMetrics.efficiencyScore)}`}>
                        {advancedMetrics.efficiencyScore.toFixed(0)}
                      </div>
                    </div>
                    <Badge className={`${getEfficiencyBadge(advancedMetrics.efficiencyScore).color} px-4 py-1 text-sm font-semibold mb-2 text-white`}>
                      {getEfficiencyBadge(advancedMetrics.efficiencyScore).label}
                    </Badge>
                    <div className="text-lg text-foreground font-semibold">Overall Efficiency Score</div>
                    <Separator className="my-4" />
                    <div className="space-y-2 text-left">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Config Balance:</span>
                        <span className="text-foreground font-semibold">{advancedMetrics.configurationBalance.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cell Balance:</span>
                        <span className="text-foreground font-semibold">{advancedMetrics.cellBalanceScore.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Energy Efficiency:</span>
                        <span className="text-foreground font-semibold">{advancedMetrics.energyEfficiency.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Analysis */}
              <Card className="border-purple-200 shadow-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                    <h3 className="text-xl font-bold text-purple-700">Cost Analysis</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg border border-purple-200">
                      <div className="text-3xl font-bold text-purple-600">
                        ${advancedMetrics.totalCost.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Operational Cost</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-muted rounded border">
                        <span className="text-muted-foreground text-sm">Switching Cost:</span>
                        <span className="text-foreground font-semibold">${advancedMetrics.switchingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded border">
                        <span className="text-muted-foreground text-sm">Degradation Cost:</span>
                        <span className="text-foreground font-semibold">${advancedMetrics.degradationCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lifecycle Prediction */}
              <Card className="border-teal-200 shadow-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-6 h-6 text-teal-600" />
                    <h3 className="text-xl font-bold text-teal-700">Lifecycle Prediction</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg border border-teal-200">
                      <div className="text-3xl font-bold text-teal-600">
                        {advancedMetrics.predictedLifespan.toFixed(0)} km
                      </div>
                      <div className="text-sm text-muted-foreground">Predicted Remaining Lifespan</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Distance:</span>
                        <span className="text-foreground font-semibold">{analysisResult.totalDistance} km</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg Health:</span>
                        <span className="text-foreground font-semibold">
                          {(analysisResult.cellStates.reduce((sum, c) => sum + c.health, 0) / 4).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Capacity Left:</span>
                        <span className="text-foreground font-semibold">
                          {(advancedMetrics.predictedLifespan + analysisResult.totalDistance).toFixed(0)} km
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Optimization Recommendations */}
            <Card className="border-amber-200 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-amber-700 flex items-center gap-2 text-xl">
                  <Lightbulb className="w-6 h-6" />
                  AI-Powered Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {advancedMetrics.optimizationRecommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-muted rounded-lg border border-amber-200">
                      {rec.includes('✅') ? (
                        <Award className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : rec.includes('💡') ? (
                        <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      )}
                      <p className="text-foreground text-sm leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card className="border-blue-200 hover:border-blue-400 transition-all shadow-lg">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-extrabold text-blue-600" data-testid="text-total-distance">
                    {analysisResult.totalDistance}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 font-medium">Total Distance (km)</div>
                </CardContent>
              </Card>
              <Card className="border-green-200 hover:border-green-400 transition-all shadow-lg">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-extrabold text-green-600" data-testid="text-avg-voltage">
                    {analysisResult.averageVoltage.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 font-medium">Avg Voltage (V)</div>
                </CardContent>
              </Card>
              <Card className="border-purple-200 hover:border-purple-400 transition-all shadow-lg">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-extrabold text-purple-600" data-testid="text-config-count">
                    {analysisResult.configCount}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 font-medium">Configs Used</div>
                </CardContent>
              </Card>
              <Card className="border-yellow-200 hover:border-yellow-400 transition-all shadow-lg">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-extrabold text-yellow-700" data-testid="text-switch-count">
                    {analysisResult.switchCount}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 font-medium">Switch Activations</div>
                </CardContent>
              </Card>
              <Card className="border-red-200 hover:border-red-400 transition-all shadow-lg">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-extrabold text-red-600" data-testid="text-cell-activations">
                    {analysisResult.totalCellActivations}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 font-medium">Cell Activations</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Analysis */}
            <Tabs defaultValue="charts" className="w-full">
              <TabsList className="bg-muted border p-1">
                <TabsTrigger value="charts" data-testid="tab-charts">
                  <Activity className="w-4 h-4 mr-2" />
                  Visualizations
                </TabsTrigger>
                <TabsTrigger value="advanced" data-testid="tab-advanced">
                  <LineChart className="w-4 h-4 mr-2" />
                  Advanced Analytics
                </TabsTrigger>
                <TabsTrigger value="segments" data-testid="tab-segments">
                  <TableIcon className="w-4 h-4 mr-2" />
                  Segment Details
                </TabsTrigger>
                <TabsTrigger value="cells" data-testid="tab-cells">
                  <Battery className="w-4 h-4 mr-2" />
                  Cell Health
                </TabsTrigger>
              </TabsList>

              <TabsContent value="charts" className="space-y-6 mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border-blue-200 shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-primary text-lg">Voltage Distribution by Distance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={voltageChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="voltage" stroke="#64748b" />
                          <YAxis stroke="#64748b" label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                            labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="distance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-green-600 text-lg">Switch Usage Frequency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={switchChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#64748b" />
                          <YAxis stroke="#64748b" label={{ value: 'Activations', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                            labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-purple-200 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-purple-600 text-lg">Cell Health & State of Charge</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {analysisResult.cellStates.map((cell) => (
                        <div key={cell.id} className="bg-muted p-5 rounded-xl border border-purple-200 hover:border-purple-400 transition-all">
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-purple-700 text-lg">Cell {cell.id}</span>
                            <Badge variant="outline" className="text-green-600 border-green-600 font-semibold">
                              {cell.activations}×
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground font-medium">Health (SoH)</span>
                                <span className="text-foreground font-bold">{cell.health.toFixed(1)}%</span>
                              </div>
                              <Progress value={cell.health} className="h-3" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground font-medium">Charge (SoC)</span>
                                <span className="text-orange-600 font-bold">{cell.soc.toFixed(1)}%</span>
                              </div>
                              <Progress value={cell.soc} className="h-3" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6 mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border-cyan-200 shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-cyan-600 text-lg">Cell Performance Radar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <RadarChart data={cellRadarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="cell" stroke="#64748b" />
                          <PolarRadiusAxis stroke="#64748b" />
                          <Radar name="Health" dataKey="health" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                          <Radar name="SoC" dataKey="soc" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                          <Radar name="Load" dataKey="activations" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                          <Legend />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-pink-200 shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-pink-600 text-lg">Configuration Usage Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={Object.entries(analysisResult.configUsage).map(([id, count]) => ({
                              name: id,
                              value: count,
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {Object.keys(analysisResult.configUsage).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Comparative Metrics */}
                <Card className="bg-card border-amber-200 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-amber-700 text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Performance Metrics Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-muted p-4 rounded-lg border border-amber-500/20">
                        <div className="text-sm text-muted-foreground mb-2">Configuration Balance</div>
                        <Progress value={advancedMetrics.configurationBalance} className="h-3 mb-2" />
                        <div className="text-2xl font-bold text-amber-600">{advancedMetrics.configurationBalance.toFixed(1)}%</div>
                      </div>
                      <div className="bg-muted p-4 rounded-lg border border-green-500/20">
                        <div className="text-sm text-muted-foreground mb-2">Cell Balance Score</div>
                        <Progress value={advancedMetrics.cellBalanceScore} className="h-3 mb-2" />
                        <div className="text-2xl font-bold text-green-600">{advancedMetrics.cellBalanceScore.toFixed(1)}%</div>
                      </div>
                      <div className="bg-muted p-4 rounded-lg border border-blue-500/20">
                        <div className="text-sm text-muted-foreground mb-2">Energy Efficiency</div>
                        <Progress value={advancedMetrics.energyEfficiency} className="h-3 mb-2" />
                        <div className="text-2xl font-bold text-blue-600">{advancedMetrics.energyEfficiency.toFixed(1)}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="segments" className="mt-6">
                <Card className="bg-card border-teal-200 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-teal-600 text-lg">Detailed Segment Analysis</CardTitle>
                    <CardDescription className="text-foreground/70">
                      Comprehensive breakdown of each road segment with configuration assignments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-teal-300">
                            <th className="text-left py-4 px-4 text-teal-600 font-semibold">Type</th>
                            <th className="text-left py-4 px-4 text-teal-600 font-semibold">Description</th>
                            <th className="text-left py-4 px-4 text-teal-600 font-semibold">Length</th>
                            <th className="text-left py-4 px-4 text-teal-600 font-semibold">Voltage</th>
                            <th className="text-left py-4 px-4 text-teal-600 font-semibold">Config ID</th>
                            <th className="text-left py-4 px-4 text-teal-600 font-semibold">Active Switches</th>
                            <th className="text-left py-4 px-4 text-teal-600 font-semibold">Cells Activated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysisResult.segments.map((segment, index) => (
                            <tr key={index} className="border-b border-slate-700/50 hover:bg-muted/30 transition-colors">
                              <td className="py-4 px-4">
                                <Badge className="bg-teal-600 font-mono">{segment.type}</Badge>
                              </td>
                              <td className="py-4 px-4 text-foreground">{segment.description}</td>
                              <td className="py-4 px-4 text-foreground font-semibold">{segment.length} km</td>
                              <td className="py-4 px-4">
                                <Badge className="bg-blue-600 text-white font-bold">{segment.voltage}V</Badge>
                              </td>
                              <td className="py-4 px-4">
                                <Badge variant="outline" className="text-cyan-600 border-cyan-400 font-mono">
                                  {segment.configId}
                                </Badge>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex gap-1 flex-wrap">
                                  {segment.closedSwitches.map(sw => (
                                    <Badge key={sw} className="bg-green-600 text-xs font-mono">
                                      {sw}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-foreground font-medium">
                                  {segment.activatedCells.length > 0
                                    ? segment.activatedCells.map(c => `C${c}`).join(', ')
                                    : <span className="text-gray-500">None</span>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cells" className="mt-6">
                <Card className="bg-card border-green-200 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-green-600 text-lg">Cell Usage and Health Monitoring</CardTitle>
                    <CardDescription className="text-muted-foreground/70">
                      Detailed analysis of individual cell performance and degradation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-green-300">
                            <th className="text-left py-4 px-4 text-green-600 font-semibold">Cell ID</th>
                            <th className="text-left py-4 px-4 text-green-600 font-semibold">Activation Count</th>
                            <th className="text-left py-4 px-4 text-green-600 font-semibold">State of Health</th>
                            <th className="text-left py-4 px-4 text-green-600 font-semibold">State of Charge</th>
                            <th className="text-left py-4 px-4 text-green-600 font-semibold">Health Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysisResult.cellStates.map((cell) => (
                            <tr key={cell.id} className="border-b border-slate-700/50 hover:bg-muted/30 transition-colors">
                              <td className="py-4 px-4">
                                <span className="font-bold text-green-600 text-lg">Cell {cell.id}</span>
                              </td>
                              <td className="py-4 px-4">
                                <Badge className="bg-green-600 font-bold">{cell.activations} times</Badge>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                                      style={{ width: `${cell.health}%` }}
                                    />
                                  </div>
                                  <span className="text-green-600 font-bold w-16">{cell.health.toFixed(1)}%</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all"
                                      style={{ width: `${cell.soc}%` }}
                                    />
                                  </div>
                                  <span className="text-orange-600 font-bold w-16">{cell.soc.toFixed(1)}%</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                {cell.health >= 80 ? (
                                  <Badge className="bg-green-600">Excellent</Badge>
                                ) : cell.health >= 60 ? (
                                  <Badge className="bg-yellow-600">Good</Badge>
                                ) : (
                                  <Badge className="bg-red-600">Degraded</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
