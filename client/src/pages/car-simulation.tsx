import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Battery, 
  Zap,
  Car,
  Play,
  Pause,
  Square,
  RotateCcw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import type { Configuration, RoadProfile, CarSimulationState } from "@shared/schema";
import { ThreeJSScene } from "@/components/ThreeJSScene";
import { useToast } from "@/hooks/use-toast";

export default function CarSimulation() {
  const { toast } = useToast();
  const [selectedProfileId, setSelectedProfileId] = useState<string>("city-commute");
  const [roadProfile, setRoadProfile] = useState<RoadProfile | null>(null);
  const [simulationState, setSimulationState] = useState<CarSimulationState>({
    currentSegmentIndex: 0,
    distanceInSegment: 0,
    totalDistanceTraveled: 0,
    currentVoltage: 0,
    currentConfiguration: undefined,
    speed: 0,
    isPlaying: false,
    playbackSpeed: 1,
  });
  const [segmentConfigurations, setSegmentConfigurations] = useState<Map<number, Configuration>>(new Map());
  const [currentConfigObject, setCurrentConfigObject] = useState<Configuration | null>(null);

  const { data: allConfigurations = [], isLoading: configurationsLoading } = useQuery<Configuration[]>({
    queryKey: ["/api/configurations"],
  });


  const { data: roadProfiles = [] } = useQuery<RoadProfile[]>({
    queryKey: ["/api/road-profiles"],
  });

  useEffect(() => {
    if (!configurationsLoading && allConfigurations.length > 0 && roadProfiles.length > 0) {
      const profile = roadProfiles.find(p => p.id === selectedProfileId);
      if (profile) {
        setRoadProfile(profile);
        const configMap = assignConfigurationsToSegments(profile);
        resetSimulationWithConfigMap(profile, configMap);
      }
    }
  }, [selectedProfileId, allConfigurations, configurationsLoading, roadProfiles]);

  const assignConfigurationsToSegments = (profile: RoadProfile): Map<number, Configuration> => {
    const configMap = new Map<number, Configuration>();
    
    // Segments requiring 0 V need no configuration. For any other required
    // voltage a configuration must exist - every terrain voltage is drawn from
    // the producible set (see shared/battery-model.ts OUTPUT_VOLTAGES and
    // tests/app-data-integrity.e2e.ts). If one is ever missing that is a real
    // data fault, so surface it instead of silently leaving the segment
    // unconfigured, which previously left the car running on a stale pack.
    const unsatisfied: number[] = [];

    profile.segments.forEach((segment, index) => {
      if (segment.requiredVoltage === 0) return;

      // Prefer the configuration that uses the fewest cells to reach the
      // required voltage, so unused cells stay in reserve.
      const matchingConfigs = allConfigurations
        .filter(config => config.voltage === segment.requiredVoltage)
        .sort((a, b) => a.activeCells - b.activeCells);

      if (matchingConfigs.length > 0) {
        configMap.set(index, matchingConfigs[0]);
      } else if (!unsatisfied.includes(segment.requiredVoltage)) {
        unsatisfied.push(segment.requiredVoltage);
      }
    });

    if (unsatisfied.length > 0) {
      toast({
        title: "Unsupported route voltage",
        description:
          `This pack cannot produce ${unsatisfied.map(v => `${v} V`).join(", ")}. ` +
          `Those segments have no configuration and will be skipped.`,
        variant: "destructive",
      });
    }

    setSegmentConfigurations(configMap);
    return configMap;
  };

  const resetSimulationWithConfigMap = (profile: RoadProfile, configMap: Map<number, Configuration>) => {
    const firstConfig = configMap.get(0);
    setCurrentConfigObject(firstConfig || null);
    setSimulationState({
      currentSegmentIndex: 0,
      distanceInSegment: 0,
      totalDistanceTraveled: 0,
      currentVoltage: 0, // Start at 0V when at initial position
      currentConfiguration: firstConfig?.configId,
      speed: 0,
      isPlaying: false,
      playbackSpeed: 1,
    });
  };
  
  const resetSimulation = () => {
    if (!roadProfile) return;
    resetSimulationWithConfigMap(roadProfile, segmentConfigurations);
  };

  const togglePlayPause = () => {
    setSimulationState(prev => {
      // When starting from initial position, set the voltage to first segment's config
      if (!prev.isPlaying && prev.totalDistanceTraveled === 0) {
        const firstConfig = segmentConfigurations.get(0);
        return { 
          ...prev, 
          isPlaying: true,
          currentVoltage: firstConfig?.voltage || 0
        };
      }
      return { ...prev, isPlaying: !prev.isPlaying };
    });
  };

  const stopSimulation = () => {
    setSimulationState(prev => ({ ...prev, isPlaying: false, speed: 0 }));
  };

  const currentSegment = roadProfile?.segments[simulationState.currentSegmentIndex];

  useEffect(() => {
    if (!simulationState.isPlaying || !roadProfile) return;

    const stepForward = () => {
      setSimulationState(prev => {
        const currentSegment = roadProfile.segments[prev.currentSegmentIndex];
        const baseSpeed = 1.5 + prev.playbackSpeed * 0.5; // Slower, more reasonable speed
        const speedModified = baseSpeed * currentSegment.speedModifier;
        const increment = speedModified * 0.5; // Scaled for 500ms intervals
        const newDistanceInSegment = prev.distanceInSegment + increment;
        
        if (newDistanceInSegment >= currentSegment.distance) {
          const nextIndex = prev.currentSegmentIndex + 1;
          if (nextIndex >= roadProfile.segments.length) {
            // End of route - stop and reset voltage to 0V
            return { 
              ...prev, 
              isPlaying: false, 
              speed: 0,
              currentVoltage: 0, // Reset to 0V when simulation ends
              totalDistanceTraveled: roadProfile.totalDistance,
              distanceInSegment: roadProfile.segments[prev.currentSegmentIndex].distance
            };
          }
          
          const nextConfig = segmentConfigurations.get(nextIndex);
          setCurrentConfigObject(nextConfig || null);
          
          // Move to next segment - only add the remaining distance to current segment
          const remainingInSegment = currentSegment.distance - prev.distanceInSegment;
          
          return {
            ...prev,
            currentSegmentIndex: nextIndex,
            distanceInSegment: 0,
            totalDistanceTraveled: Math.min(
              prev.totalDistanceTraveled + remainingInSegment,
              roadProfile.totalDistance
            ),
            currentVoltage: nextConfig?.voltage || 0,
            currentConfiguration: nextConfig?.configId,
            speed: speedModified,
          };
        }
        
        return {
          ...prev,
          distanceInSegment: newDistanceInSegment,
          totalDistanceTraveled: Math.min(
            prev.totalDistanceTraveled + increment,
            roadProfile.totalDistance
          ),
          speed: speedModified,
        };
      });
    };

    const interval = setInterval(stepForward, 500 / simulationState.playbackSpeed);
    return () => clearInterval(interval);
  }, [simulationState.isPlaying, simulationState.playbackSpeed, roadProfile, segmentConfigurations]);

  const progressPercent = roadProfile 
    ? (simulationState.totalDistanceTraveled / roadProfile.totalDistance) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Panel: Simulation Canvas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Road Profile Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                    <SelectTrigger className="flex-1" data-testid="select-road-profile">
                      <SelectValue placeholder="Select a road profile" />
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
                {roadProfile && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      Total: {roadProfile.totalDistance} km
                    </Badge>
                    <Badge variant="outline">
                      Avg Voltage: {roadProfile.averageVoltage.toFixed(1)}V
                    </Badge>
                    <Badge variant={
                      roadProfile.difficulty === 'Easy' ? 'default' :
                      roadProfile.difficulty === 'Medium' ? 'secondary' :
                      roadProfile.difficulty === 'Hard' ? 'destructive' :
                      'destructive'
                    }>
                      {roadProfile.difficulty}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* FPS Simulation Canvas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  3D Car Simulation - {roadProfile?.sceneType.toUpperCase()} Scene
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] bg-black rounded-lg overflow-hidden border-2 border-border shadow-2xl">
                  {roadProfile && (
                    <ThreeJSScene
                      roadProfile={roadProfile}
                      currentSegmentIndex={simulationState.currentSegmentIndex}
                      distanceInSegment={simulationState.distanceInSegment}
                      speed={simulationState.speed}
                      voltage={simulationState.currentVoltage}
                      activeCells={currentConfigObject?.activeCells || 0}
                      configId={simulationState.currentConfiguration}
                    />
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4 space-y-2">
                  <Progress value={progressPercent} className="h-2" data-testid="progress-bar" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span data-testid="text-total-distance">{simulationState.totalDistanceTraveled.toFixed(1)} km</span>
                    <span>{roadProfile?.totalDistance.toFixed(1)} km</span>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <Button
                    onClick={togglePlayPause}
                    variant="default"
                    size="lg"
                    data-testid="button-play-pause"
                  >
                    {simulationState.isPlaying ? (
                      <><Pause className="w-5 h-5 mr-2" /> Pause</>
                    ) : (
                      <><Play className="w-5 h-5 mr-2" /> Play</>
                    )}
                  </Button>
                  <Button
                    onClick={stopSimulation}
                    variant="destructive"
                    size="lg"
                    data-testid="button-stop"
                  >
                    <Square className="w-5 h-5 mr-2" /> Stop
                  </Button>
                  <Button
                    onClick={resetSimulation}
                    variant="outline"
                    size="lg"
                    data-testid="button-reset"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" /> Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Data Display */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentSegment && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Terrain</p>
                      <p className="text-lg font-bold" data-testid="text-terrain-name">{currentSegment.terrainName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Required Voltage</p>
                      <p className="text-2xl font-bold text-primary" data-testid="text-required-voltage">
                        {currentSegment.requiredVoltage}V
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Segment Progress</p>
                      <p className="text-lg font-semibold" data-testid="text-segment-progress">
                        {simulationState.distanceInSegment.toFixed(1)} / {currentSegment.distance} km
                      </p>
                    </div>
                    {currentConfigObject && (
                      <div>
                        <p className="text-sm text-muted-foreground">Active Configuration</p>
                        <Badge variant="secondary" className="text-base" data-testid="badge-config-id">
                          {currentConfigObject.configId}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {currentConfigObject.connectionType} - {currentConfigObject.voltage}V - {currentConfigObject.activeCells} cells
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Road Segments List */}
            <Card>
              <CardHeader>
                <CardTitle>Road Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {roadProfile?.segments.map((segment, idx) => {
                    const config = segmentConfigurations.get(idx);
                    const isActive = idx === simulationState.currentSegmentIndex;
                    
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          isActive ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                        data-testid={`segment-${idx}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{segment.terrainName}</p>
                            <p className="text-xs text-muted-foreground">{segment.distance} km</p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant="outline" 
                              style={{ backgroundColor: segment.color + '20', borderColor: segment.color }}
                            >
                              {segment.requiredVoltage}V
                            </Badge>
                            {config && (
                              <p className="text-xs text-muted-foreground mt-1">{config.configId}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
