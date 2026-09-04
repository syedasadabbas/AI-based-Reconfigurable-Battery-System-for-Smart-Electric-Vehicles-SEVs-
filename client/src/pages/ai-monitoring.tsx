import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Battery, 
  Zap,
  Car,
  Play,
  Pause,
  Square,
  RotateCcw,
  Brain,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CircuitDiagram from "@/components/circuit-diagram";
import AIModelDiagram from "@/components/ai-model-diagram";
import type { 
  Configuration, 
  RoadProfile, 
  AICellState, 
  AIMonitoringSegment,
  AIModelType,
  CellStateDB,
  AIConfigRecommendation
} from "@shared/schema";
import { ThreeJSScene } from "@/components/ThreeJSScene";
import { AIBatteryMonitor } from "@/lib/ai-battery-model";
import { circuitSolver } from "@/lib/circuit-solver";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b'];

// Helper function to get activated cells from configuration using circuit solver
const getActivatedCellsFromConfig = (config: Configuration | null): number[] => {
  if (!config) return [];
  
  // Parse switch states to boolean array
  const switches = config.switchStates.split(' ').flatMap(group => 
    group.split('').map(bit => bit === '1')
  );
  
  // Use circuit solver to get actual active cells
  const activeCellsSet = circuitSolver.getActiveCellsSet(switches);
  return Array.from(activeCellsSet).sort((a, b) => a - b);
};

// Get or create persistent session ID
const getSessionId = () => {
  const stored = localStorage.getItem('ai_monitor_session_id');
  if (stored) return stored;
  const newId = `ai_monitor_${Date.now()}`;
  localStorage.setItem('ai_monitor_session_id', newId);
  return newId;
};

export default function AIMonitoring() {
  const [selectedProfileId, setSelectedProfileId] = useState<string>("city-commute");
  const [selectedModelType, setSelectedModelType] = useState<AIModelType>("LSTM" as AIModelType);
  const [roadProfile, setRoadProfile] = useState<RoadProfile | null>(null);
  const [aiMonitor, setAiMonitor] = useState<AIBatteryMonitor | null>(null);
  const [sessionId] = useState<string>(() => typeof window !== 'undefined' ? getSessionId() : '');
  const [hasSavedStates, setHasSavedStates] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const [cellStates, setCellStates] = useState<AICellState[]>([
    { id: 1, activations: 0, health: 100, soc: 100, restingTime: 0, totalUsageTime: 0, degradationRate: 0, predictedSOH: 100, predictedSOC: 100, isResting: false, useCount: 0, lastUsedDistance: 0 },
    { id: 2, activations: 0, health: 100, soc: 100, restingTime: 0, totalUsageTime: 0, degradationRate: 0, predictedSOH: 100, predictedSOC: 100, isResting: false, useCount: 0, lastUsedDistance: 0 },
    { id: 3, activations: 0, health: 100, soc: 100, restingTime: 0, totalUsageTime: 0, degradationRate: 0, predictedSOH: 100, predictedSOC: 100, isResting: false, useCount: 0, lastUsedDistance: 0 },
    { id: 4, activations: 0, health: 100, soc: 100, restingTime: 0, totalUsageTime: 0, degradationRate: 0, predictedSOH: 100, predictedSOC: 100, isResting: false, useCount: 0, lastUsedDistance: 0 },
  ]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [distanceInSegment, setDistanceInSegment] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const [monitoringSegments, setMonitoringSegments] = useState<AIMonitoringSegment[]>([]);
  const [currentConfig, setCurrentConfig] = useState<Configuration | null>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<AIConfigRecommendation | null>(null);
  const [previousConfigIds, setPreviousConfigIds] = useState<string[]>([]);

  const { data: allConfigurations = [], isLoading: configurationsLoading } = useQuery<Configuration[]>({
    queryKey: ["/api/configurations"],
  });

  const { data: roadProfiles = [] } = useQuery<RoadProfile[]>({
    queryKey: ["/api/road-profiles"],
  });

  // Load saved cell states from database
  const { data: savedCellStates } = useQuery<CellStateDB[]>({
    queryKey: [`/api/cell-states/${sessionId}`],
    enabled: !!sessionId && typeof window !== 'undefined',
  });

  // Mutation to save cell states
  const saveCellStatesMutation = useMutation({
    mutationFn: async (states: AICellState[]) => {
      if (!sessionId) throw new Error('Session ID not available');
      const response = await apiRequest("POST", `/api/cell-states/${sessionId}`, states);
      return await response.json();
    },
    onSuccess: () => {
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: [`/api/cell-states/${sessionId}`] });
      }
    },
  });

  // Initialize AI monitor when model type changes
  useEffect(() => {
    setAiMonitor(new AIBatteryMonitor(selectedModelType));
  }, [selectedModelType]);

  // Load saved cell states from database on mount
  useEffect(() => {
    if (savedCellStates && savedCellStates.length > 0) {
      setIsRestoring(true);
      const loadedStates: AICellState[] = savedCellStates.map(dbState => ({
        id: dbState.cellId,
        activations: dbState.activations,
        health: dbState.health,
        soc: dbState.soc,
        restingTime: dbState.restingTime,
        totalUsageTime: dbState.totalUsageTime,
        degradationRate: dbState.degradationRate,
        predictedSOH: dbState.health,
        predictedSOC: dbState.soc,
        isResting: dbState.isResting,
        useCount: dbState.useCount,
        lastUsedDistance: dbState.lastUsedDistance,
      }));
      setCellStates(loadedStates);
      setHasSavedStates(true);
      // Allow time for state to update before enabling saves
      setTimeout(() => setIsRestoring(false), 100);
    }
  }, [savedCellStates]);

  // Reset simulation progress when road profile changes
  useEffect(() => {
    // Stop simulation and reset progress when road profile changes
    setIsPlaying(false);
    setCurrentSegmentIndex(0);
    setDistanceInSegment(0);
    setTotalDistance(0);
    setSpeed(0);
    setMonitoringSegments([]);
    setPreviousConfigIds([]);
  }, [selectedProfileId]);

  // Load road profile and initialize first segment
  useEffect(() => {
    if (!configurationsLoading && allConfigurations.length > 0 && roadProfiles.length > 0 && aiMonitor) {
      const profile = roadProfiles.find(p => p.id === selectedProfileId);
      if (profile) {
        setRoadProfile(profile);
        
        // Always initialize first segment configuration (don't wait for recharge)
        const firstSegment = profile.segments[0];
        const availableConfigs = allConfigurations.filter(
          c => c.voltage === firstSegment.requiredVoltage
        );
        
        if (availableConfigs.length > 0) {
          const recommendation = aiMonitor.selectConfiguration(
            firstSegment.requiredVoltage,
            availableConfigs,
            cellStates,
            0,
            []
          );
          
          const selectedConfig = availableConfigs.find(c => c.configId === recommendation.recommendedConfigId);
          if (selectedConfig) {
            setCurrentConfig(selectedConfig);
            setCurrentRecommendation(recommendation); // Store the recommendation for later use
            setPreviousConfigIds([selectedConfig.configId]);
            
            // Update cell resting states based on initial configuration
            const activatedCells = getActivatedCellsFromConfig(selectedConfig);
            const updatedCellStates = cellStates.map(cell => ({
              ...cell,
              isResting: !activatedCells.includes(cell.id)
            }));
            setCellStates(updatedCellStates);
          }
        }
        
        // Only reset simulation state if no saved states exist
        if (!hasSavedStates) {
          setIsPlaying(false);
          setCurrentSegmentIndex(0);
          setDistanceInSegment(0);
          setTotalDistance(0);
          setSpeed(0);
          setMonitoringSegments([]);
        }
      }
    }
  }, [selectedProfileId, allConfigurations, configurationsLoading, roadProfiles, aiMonitor]);

  const resetSimulation = () => {
    setIsPlaying(false);
    setCurrentSegmentIndex(0);
    setDistanceInSegment(0);
    setTotalDistance(0);
    setSpeed(0);
    setMonitoringSegments([]);
    setPreviousConfigIds([]);
    
    // Reset AI monitor's cell usage history for fresh rotation
    if (aiMonitor) {
      aiMonitor.resetHistory();
    }
    
    // Use saved cell states if available, otherwise reset to defaults
    const statesToUse = hasSavedStates ? cellStates : [
      { id: 1, activations: 0, health: 100, soc: 100, restingTime: 0, totalUsageTime: 0, degradationRate: 0, predictedSOH: 100, predictedSOC: 100, isResting: false, useCount: 0, lastUsedDistance: 0 },
      { id: 2, activations: 0, health: 100, soc: 100, restingTime: 0, totalUsageTime: 0, degradationRate: 0, predictedSOH: 100, predictedSOC: 100, isResting: false, useCount: 0, lastUsedDistance: 0 },
      { id: 3, activations: 0, health: 100, soc: 100, restingTime: 0, totalUsageTime: 0, degradationRate: 0, predictedSOH: 100, predictedSOC: 100, isResting: false, useCount: 0, lastUsedDistance: 0 },
      { id: 4, activations: 0, health: 100, soc: 100, restingTime: 0, totalUsageTime: 0, degradationRate: 0, predictedSOH: 100, predictedSOC: 100, isResting: false, useCount: 0, lastUsedDistance: 0 },
    ];
    
    // Only set cell states if we're resetting to defaults
    if (!hasSavedStates) {
      setCellStates(statesToUse);
    }
    
    // Reinitialize first segment configuration if road profile exists
    if (roadProfile && allConfigurations.length > 0 && aiMonitor) {
      const firstSegment = roadProfile.segments[0];
      const availableConfigs = allConfigurations.filter(
        c => c.voltage === firstSegment.requiredVoltage
      );
      
      if (availableConfigs.length > 0) {
        const recommendation = aiMonitor.selectConfiguration(
          firstSegment.requiredVoltage,
          availableConfigs,
          statesToUse,
          0,
          []
        );
        
        const selectedConfig = availableConfigs.find(c => c.configId === recommendation.recommendedConfigId);
        if (selectedConfig) {
          setCurrentConfig(selectedConfig);
          setCurrentRecommendation(recommendation); // Store the recommendation
          setPreviousConfigIds([selectedConfig.configId]);
          
          // Update cell resting states based on the reset configuration
          const activatedCells = getActivatedCellsFromConfig(selectedConfig);
          const updatedCellStates = statesToUse.map(cell => ({
            ...cell,
            isResting: !activatedCells.includes(cell.id)
          }));
          setCellStates(updatedCellStates);
        }
      }
    } else {
      setCurrentConfig(null);
    }
  };

  const hardReset = () => {
    // Clear saved states flag and reset to 100%
    setHasSavedStates(false);
    
    // Reset AI monitor's cell usage history
    if (aiMonitor) {
      aiMonitor.resetHistory();
    }
    
    const initialCellStates: AICellState[] = [
      { id: 1, activations: 0, health: 100, soc: 100, restingTime: 0, totalUsageTime: 0, degradationRate: 0, predictedSOH: 100, predictedSOC: 100, isResting: false, useCount: 0, lastUsedDistance: 0 },
      { id: 2, activations: 0, health: 100, soc: 100, restingTime: 0, totalUsageTime: 0, degradationRate: 0, predictedSOH: 100, predictedSOC: 100, isResting: false, useCount: 0, lastUsedDistance: 0 },
      { id: 3, activations: 0, health: 100, soc: 100, restingTime: 0, totalUsageTime: 0, degradationRate: 0, predictedSOH: 100, predictedSOC: 100, isResting: false, useCount: 0, lastUsedDistance: 0 },
      { id: 4, activations: 0, health: 100, soc: 100, restingTime: 0, totalUsageTime: 0, degradationRate: 0, predictedSOH: 100, predictedSOC: 100, isResting: false, useCount: 0, lastUsedDistance: 0 },
    ];
    
    setCellStates(initialCellStates);
    
    // Clear from database and save new fresh states
    if (sessionId) {
      saveCellStatesMutation.mutate(initialCellStates);
    }
    
    // Reset simulation state
    resetSimulation();
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const stopSimulation = () => {
    setIsPlaying(false);
    setSpeed(0);
  };

  const rechargeCells = () => {
    const rechargedStates = cellStates.map(cell => {
      // Recharge amount based on health (healthier cells recharge more efficiently)
      const rechargeEfficiency = cell.health / 100;
      const rechargeAmount = 50 * rechargeEfficiency; // Up to 50% recharge
      const newSoc = Math.min(100, cell.soc + rechargeAmount);
      
      // Small health degradation from charging cycle (0.1-0.3% depending on current health)
      const chargingDegradation = 0.3 * (1 - rechargeEfficiency);
      const newHealth = Math.max(0, cell.health - chargingDegradation);
      
      return {
        ...cell,
        soc: newSoc,
        health: newHealth,
        predictedSOC: newSoc,
        predictedSOH: newHealth,
        isResting: true,
        restingTime: cell.restingTime + 1,
      };
    });
    
    setCellStates(rechargedStates);
    setHasSavedStates(true);
    saveCellStatesMutation.mutate(rechargedStates);
  };

  // Simulation loop
  useEffect(() => {
    if (!isPlaying || !roadProfile || !aiMonitor) return;

    const stepForward = () => {
      const currentSegment = roadProfile.segments[currentSegmentIndex];
      
      // Safety check: if segment doesn't exist or is invalid, stop simulation
      if (!currentSegment || typeof currentSegment.speedModifier !== 'number') {
        setIsPlaying(false);
        setSpeed(0);
        return;
      }
      
      const baseSpeed = 1.5 + playbackSpeed * 0.5;
      const speedModified = baseSpeed * currentSegment.speedModifier;
      const increment = speedModified * 0.5;
      const newDistanceInSegment = distanceInSegment + increment;

      if (newDistanceInSegment >= currentSegment.distance) {
        // Segment completed - update cell states for the COMPLETED segment
        if (currentConfig) {
          // Determine which cells were activated in the completed segment
          const activatedCells = getActivatedCellsFromConfig(currentConfig);
          
          // Get closed switches for display
          const switches = currentConfig.switchStates.split(' ');
          const switchNames = ['A', 'B', 'C'];
          const closedSwitches: string[] = [];
          
          switches.forEach((group, cellIndex) => {
            group.split('').forEach((bit, switchIndex) => {
              if (bit === '1') {
                closedSwitches.push(`R${switchNames[switchIndex]}${cellIndex + 1}`);
              }
            });
          });

          // Get predictions for the completed segment
          const predictions = aiMonitor.predictCellStates(cellStates, currentSegment.distance);

          // Update cell states based on actual activation
          const newCellStates = cellStates.map(cell => {
            const wasActivated = activatedCells.includes(cell.id);
            const prediction = predictions.find(p => p.cellId === cell.id)!;
            return aiMonitor.updateCellState(cell, wasActivated, currentSegment.distance, prediction);
          });

          // Record monitoring segment for the COMPLETED segment
          const restingCells = [1, 2, 3, 4].filter(id => !activatedCells.includes(id));
          
          const monitoringSegment: AIMonitoringSegment = {
            distance: currentSegment.distance,
            terrainType: currentSegment.terrainType,
            requiredVoltage: currentSegment.requiredVoltage,
            selectedConfigId: currentConfig.configId,
            selectedConfigCombination: currentConfig.connectionType,
            activatedCells,
            restedCells: restingCells,
            // Use the stored recommendation from when this config was selected (includes cell rotation reasoning)
            aiRecommendation: currentRecommendation || {
              voltage: currentSegment.requiredVoltage,
              recommendedConfigId: currentConfig.configId,
              alternativeConfigIds: [],
              cellsToActivate: activatedCells,
              cellsToRest: restingCells,
              confidence: 90,
              reason: `Completed segment using ${currentConfig.configId}`,
            },
            cellStatesAfter: newCellStates,
            switchesUsed: closedSwitches,
          };

          setMonitoringSegments(prev => [...prev, monitoringSegment]);

          // Now move to next segment
          const nextIndex = currentSegmentIndex + 1;
          if (nextIndex >= roadProfile.segments.length) {
            setCellStates(newCellStates);
            setIsPlaying(false);
            setSpeed(0);
            setTotalDistance(roadProfile.totalDistance);
            setDistanceInSegment(currentSegment.distance);
            return;
          }

          const nextSegment = roadProfile.segments[nextIndex];
          const remainingDistance = currentSegment.distance - distanceInSegment;
          
          // Select configuration for next segment using UPDATED cell states
          const availableConfigs = allConfigurations.filter(
            c => c.voltage === nextSegment.requiredVoltage
          );

          const recommendation = aiMonitor.selectConfiguration(
            nextSegment.requiredVoltage,
            availableConfigs,
            newCellStates,  // Use updated cell states, not old ones
            totalDistance + remainingDistance,
            previousConfigIds
          );

          const selectedConfig = availableConfigs.find(c => c.configId === recommendation.recommendedConfigId);
          if (selectedConfig) {
            setCurrentConfig(selectedConfig);
            setCurrentRecommendation(recommendation); // Store recommendation with cell rotation reasoning
            setPreviousConfigIds(prev => [...prev.slice(-4), selectedConfig.configId]);
            
            // Update isResting flag for cells based on new configuration
            const nextActivatedCells = getActivatedCellsFromConfig(selectedConfig);
            const cellStatesWithRestingUpdated = newCellStates.map(cell => ({
              ...cell,
              isResting: !nextActivatedCells.includes(cell.id)
            }));
            setCellStates(cellStatesWithRestingUpdated);
            
            // Save updated cell states to database
            if (!isRestoring && sessionId) {
              saveCellStatesMutation.mutate(cellStatesWithRestingUpdated);
            }
          } else {
            // No config found, just update cell states without resting flag change
            setCellStates(newCellStates);
            
            // Save cell states to database only if not restoring
            if (!isRestoring && sessionId) {
              saveCellStatesMutation.mutate(newCellStates);
            }
          }

          setCurrentSegmentIndex(nextIndex);
          setDistanceInSegment(0);
          setTotalDistance(prev => Math.min(prev + remainingDistance, roadProfile.totalDistance));
          setSpeed(speedModified);
        }
      } else {
        setDistanceInSegment(newDistanceInSegment);
        setTotalDistance(prev => Math.min(prev + increment, roadProfile.totalDistance));
        setSpeed(speedModified);
      }
    };

    const interval = setInterval(stepForward, 500 / playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, roadProfile, aiMonitor, currentSegmentIndex, distanceInSegment, cellStates, allConfigurations, previousConfigIds, totalDistance]);

  const progressPercent = roadProfile 
    ? (totalDistance / roadProfile.totalDistance) * 100 
    : 0;

  const currentSegment = roadProfile?.segments[currentSegmentIndex];

  const avgSOH = cellStates.reduce((sum, c) => sum + c.health, 0) / 4;
  const avgSOC = cellStates.reduce((sum, c) => sum + c.soc, 0) / 4;

  const cellChartData = cellStates.map(cell => ({
    name: `Cell ${cell.id}`,
    SOH: cell.health.toFixed(1),
    SOC: cell.soc.toFixed(1),
    'Rest Time': cell.restingTime.toFixed(1),
    'Usage Time': cell.totalUsageTime.toFixed(1),
  }));

  const configUsageData = monitoringSegments.reduce((acc, seg) => {
    const key = seg.selectedConfigId;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const configChartData = Object.entries(configUsageData).map(([config, count]) => ({
    config,
    count,
  }));

  const restingCells = cellStates.filter(c => c.isResting);
  const activeCells = cellStates.filter(c => !c.isResting);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent" data-testid="text-header">
            AI-Monitored Battery Pack Reconfiguration
          </h2>
          <p className="text-muted-foreground text-lg max-w-4xl mx-auto" data-testid="text-subtitle">
            Intelligent battery management system using {selectedModelType} AI model to optimize cell usage, extend lifespan, and maximize efficiency through dynamic configuration selection and cell resting strategies
          </p>
        </div>

        {/* AI Model Diagram - Full Width */}
        <div className="mb-6">
          <AIModelDiagram modelType={selectedModelType} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Panel: Simulation */}
          <div className="xl:col-span-2 space-y-6">
            {/* Configuration Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI Model & Road Profile Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">AI Model Type</label>
                    <Select value={selectedModelType} onValueChange={(v) => setSelectedModelType(v as AIModelType)}>
                      <SelectTrigger data-testid="select-ai-model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LSTM">LSTM (Long Short-Term Memory)</SelectItem>
                        <SelectItem value="LINEAR_REGRESSION">Linear Regression</SelectItem>
                        <SelectItem value="ENSEMBLE">Ensemble (LSTM + LR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Road Profile</label>
                    <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                      <SelectTrigger data-testid="select-road-profile">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roadProfiles.map(profile => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {roadProfile && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Total: {roadProfile.totalDistance} km</Badge>
                    <Badge variant="outline">Avg Voltage: {roadProfile.averageVoltage.toFixed(1)}V</Badge>
                    <Badge variant={
                      roadProfile.difficulty === 'Easy' ? 'default' :
                      roadProfile.difficulty === 'Medium' ? 'secondary' :
                      'destructive'
                    }>
                      {roadProfile.difficulty}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3D Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  3D Car Simulation with AI Configuration Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[450px] bg-black rounded-lg overflow-hidden border-2 border-border shadow-2xl">
                  {roadProfile && (
                    <ThreeJSScene
                      roadProfile={roadProfile}
                      currentSegmentIndex={currentSegmentIndex}
                      distanceInSegment={distanceInSegment}
                      speed={speed}
                      voltage={currentSegment?.requiredVoltage || 0}
                      activeCells={getActivatedCellsFromConfig(currentConfig).length}
                      configId={currentConfig?.configId}
                    />
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <Progress value={progressPercent} className="h-2" data-testid="progress-bar" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span data-testid="text-total-distance">{totalDistance.toFixed(1)} km</span>
                    <span>{roadProfile?.totalDistance.toFixed(1)} km</span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <Button onClick={togglePlayPause} variant="default" size="lg" data-testid="button-play-pause">
                    {isPlaying ? <><Pause className="w-5 h-5 mr-2" /> Pause</> : <><Play className="w-5 h-5 mr-2" /> Play</>}
                  </Button>
                  <Button onClick={stopSimulation} variant="destructive" size="lg" data-testid="button-stop">
                    <Square className="w-5 h-5 mr-2" /> Stop
                  </Button>
                  <Button onClick={resetSimulation} variant="outline" size="lg" data-testid="button-reset">
                    <RotateCcw className="w-5 h-5 mr-2" /> Reset
                  </Button>
                  <Button 
                    onClick={rechargeCells} 
                    variant="secondary" 
                    size="lg" 
                    disabled={isPlaying}
                    data-testid="button-recharge"
                  >
                    <Zap className="w-5 h-5 mr-2" /> Recharge Cells
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Battery Circuit Visualization */}
            <CircuitDiagram
              switches={totalDistance > 0 && currentConfig 
                ? currentConfig.switchStates.split(' ').flatMap(group => 
                    group.split('').map(bit => bit === '1')
                  )
                : Array(12).fill(false) // All switches off when simulation hasn't started
              }
              currentConfig={totalDistance > 0 && currentConfig 
                ? {
                    voltage: currentConfig.voltage,
                    activeCells: getActivatedCellsFromConfig(currentConfig).length
                  }
                : {
                    voltage: 0,
                    activeCells: 0
                  }
              }
              activeCellsSet={new Set(
                totalDistance > 0 ? getActivatedCellsFromConfig(currentConfig) : []
              )}
            />

            {/* Charts */}
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="cells">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="cells">Cell Health</TabsTrigger>
                    <TabsTrigger value="configs">Configuration Usage</TabsTrigger>
                  </TabsList>
                  <TabsContent value="cells" className="pt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={cellChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="SOH" fill="#3b82f6" />
                        <Bar dataKey="SOC" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  <TabsContent value="configs" className="pt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={configChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="config" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#a855f7" />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Cell States & AI Insights */}
          <div className="space-y-6">
            {/* Overall Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Battery Pack Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Average State of Health</p>
                  <div className="flex items-center gap-2">
                    <Progress value={avgSOH} className="flex-1 h-2" />
                    <span className="text-lg font-bold text-primary">{avgSOH.toFixed(1)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average State of Charge</p>
                  <div className="flex items-center gap-2">
                    <Progress value={avgSOC} className="flex-1 h-2" />
                    <span className="text-lg font-bold text-green-600">{avgSOC.toFixed(1)}%</span>
                  </div>
                </div>
                {currentConfig && (
                  <div>
                    <p className="text-sm text-muted-foreground">Current Configuration</p>
                    <Badge variant="secondary" className="text-base" data-testid="badge-config-id">
                      {currentConfig.configId}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentConfig.connectionType} - {currentConfig.voltage}V
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cell States */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="w-5 h-5 text-green-600" />
                  Individual Cell States
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cellStates.map((cell) => (
                  <div key={cell.id} className={`p-3 rounded-lg border-2 ${cell.isResting ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">Cell {cell.id}</span>
                      <Badge variant={cell.isResting ? "default" : "secondary"} className="gap-1">
                        {cell.isResting ? <><Clock className="w-3 h-3" /> Resting</> : <><Zap className="w-3 h-3" /> Active</>}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">SOH:</span>
                        <span className="font-semibold ml-1">{cell.health.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">SOC:</span>
                        <span className="font-semibold ml-1">{cell.soc.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Uses:</span>
                        <span className="font-semibold ml-1">{cell.useCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rest:</span>
                        <span className="font-semibold ml-1">{cell.restingTime.toFixed(0)}km</span>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <Progress value={cell.health} className="h-1" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Predicted SOH: {cell.predictedSOH.toFixed(1)}%</span>
                        <span>Predicted SOC: {cell.predictedSOC.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Current Terrain */}
            {currentSegment && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Terrain</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Terrain Type</p>
                    <p className="text-lg font-bold">{currentSegment.terrainName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Required Voltage</p>
                    <p className="text-2xl font-bold text-primary">{currentSegment.requiredVoltage}V</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Segment Progress</p>
                    <p className="text-lg font-semibold">
                      {distanceInSegment.toFixed(1)} / {currentSegment.distance} km
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Insights */}
            {monitoringSegments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Latest AI Recommendation Reason */}
                  {monitoringSegments[monitoringSegments.length - 1]?.aiRecommendation?.reason && (
                    <Alert className="bg-purple-50 border-purple-200" data-testid="ai-recommendation-reason">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <AlertDescription className="text-sm font-medium text-purple-900">
                        {monitoringSegments[monitoringSegments.length - 1].aiRecommendation.reason}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Unique configurations used: {Object.keys(configUsageData).length}
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-sm">
                      Cells currently resting: {restingCells.length} / {activeCells.length} active
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm">
                      Total config switches: {monitoringSegments.length}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
