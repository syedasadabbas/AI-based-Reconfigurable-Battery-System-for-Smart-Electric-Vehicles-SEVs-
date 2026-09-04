import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings,
  Play,
  SkipForward,
  RotateCcw,
  Save,
  Shuffle,
  History,
  Download,
  Trash2,
  Pause,
  StopCircle,
  FileSpreadsheet,
  FileText,
  FileDown
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import VoltageDisplay from "@/components/voltage-display";
import SwitchPanel from "@/components/switch-panel";
import CircuitDiagram from "@/components/circuit-diagram";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SwitchConfig, Session } from "@shared/schema";

export default function Simulation() {
  const { toast } = useToast();
  const [switches, setSwitches] = useState<boolean[]>(Array(12).fill(false));
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [currentConfig, setCurrentConfig] = useState({
    voltage: 0,
    voltageGroup: "Zero Output",
    connectionType: "Disconnected",
    activeCells: 0,
    activeCellsArray: [] as number[],
    configId: "#0000",
    switchStates: "000 000 000 000"
  });
  
  // Auto-run simulation state
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
  const [autoRunSpeed, setAutoRunSpeed] = useState(500); // ms between configs

  // Load session history
  const { data: sessionHistory = [], refetch: refetchHistory } = useQuery<Session[]>({
    queryKey: ["/api/sessions", sessionId],
  });

  // Calculate voltage mutation
  const calculateMutation = useMutation({
    mutationFn: async (switchConfig: SwitchConfig) => {
      const response = await apiRequest("POST", "/api/calculate", switchConfig);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentConfig(data);
    },
    onError: () => {
      toast({
        title: "Calculation Error",
        description: "Failed to calculate voltage for current configuration",
        variant: "destructive"
      });
    }
  });

  // Save session mutation
  const saveSessionMutation = useMutation({
    mutationFn: async () => {
      const sessionData = {
        configId: currentConfig.configId,
        switchStates: currentConfig.switchStates,
        voltage: currentConfig.voltage,
        sessionId
      };
      const response = await apiRequest("POST", "/api/sessions", sessionData);
      return response.json();
    },
    onSuccess: () => {
      refetchHistory();
      toast({
        title: "Configuration Saved",
        description: "Current configuration has been saved to session history"
      });
    }
  });

  // Clear history mutation
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/sessions/${sessionId}`);
      return response.json();
    },
    onSuccess: () => {
      refetchHistory();
      toast({
        title: "History Cleared",
        description: "Session history has been cleared"
      });
    }
  });

  // Calculate voltage when switches change
  useEffect(() => {
    calculateMutation.mutate({ switches });
  }, [switches]);

  const handleSwitchToggle = (index: number) => {
    const newSwitches = [...switches];
    newSwitches[index] = !newSwitches[index];
    setSwitches(newSwitches);
  };

  const handleRandomize = () => {
    const randomSwitches = Array(12).fill(false).map(() => Math.random() > 0.5);
    setSwitches(randomSwitches);
  };

  const handleReset = () => {
    setSwitches(Array(12).fill(false));
  };

  const handleSaveConfig = () => {
    saveSessionMutation.mutate();
  };

  const handleLoadConfig = (switchStates: string) => {
    const newSwitches = switchStates.replace(/\s/g, '').split('').map(s => s === '1');
    setSwitches(newSwitches);
  };

  // Auto-run simulation effect
  useEffect(() => {
    if (!isAutoRunning) return;
    
    const totalConfigs = 4096; // 2^12 possible configurations
    if (currentConfigIndex >= totalConfigs) {
      setIsAutoRunning(false);
      toast({
        title: "Auto-Run Complete",
        description: `All ${totalConfigs} configurations have been tested!`
      });
      return;
    }

    const timer = setTimeout(() => {
      // Convert index to binary switches
      const binary = currentConfigIndex.toString(2).padStart(12, '0');
      const newSwitches = binary.split('').map(b => b === '1');
      setSwitches(newSwitches);
      setCurrentConfigIndex(prev => prev + 1);
    }, autoRunSpeed);

    return () => clearTimeout(timer);
  }, [isAutoRunning, currentConfigIndex, autoRunSpeed]);

  const handleStartAutoRun = () => {
    setIsAutoRunning(true);
    setCurrentConfigIndex(0);
    toast({
      title: "Auto-Run Started",
      description: "Testing all 4,096 configurations sequentially"
    });
  };

  const handleStopAutoRun = () => {
    setIsAutoRunning(false);
    toast({
      title: "Auto-Run Stopped",
      description: "Simulation paused at current position. Click Step to continue manually."
    });
  };

  const handleResetProgress = () => {
    setIsAutoRunning(false);
    setCurrentConfigIndex(0);
    setSwitches(Array(12).fill(false));
    toast({
      title: "Progress Reset",
      description: "Auto-run progress has been reset to start"
    });
  };

  const handlePauseAutoRun = () => {
    setIsAutoRunning(false);
  };

  const handleStepNext = () => {
    const totalConfigs = 4096;
    if (currentConfigIndex < totalConfigs) {
      const binary = currentConfigIndex.toString(2).padStart(12, '0');
      const newSwitches = binary.split('').map(b => b === '1');
      setSwitches(newSwitches);
      setCurrentConfigIndex(prev => prev + 1);
    }
  };

  const activeSwitchCount = switches.filter(Boolean).length;
  const totalConfigs = 4096;
  const progressPercentage = (currentConfigIndex / totalConfigs) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Simulation Area */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Current Voltage Display */}
            <VoltageDisplay
              voltage={currentConfig.voltage}
              voltageGroup={currentConfig.voltageGroup}
              configId={currentConfig.configId}
              connectionType={currentConfig.connectionType}
            />

            {/* Circuit Diagram Visualization */}
            <CircuitDiagram 
              switches={switches} 
              currentConfig={currentConfig} 
              activeCellsSet={new Set(currentConfig.activeCellsArray)}
            />

            {/* Switch Control Panel */}
            <SwitchPanel
              switches={switches}
              onSwitchToggle={handleSwitchToggle}
              onRandomize={handleRandomize}
              onReset={handleReset}
              onSave={handleSaveConfig}
              switchStates={currentConfig.switchStates}
              isSaving={saveSessionMutation.isPending}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Simulation Controls */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-md font-semibold text-foreground mb-4 flex items-center">
                  <Settings className="text-primary mr-2" />
                  Simulation Controls
                </h3>
                
                {/* Progress Bar */}
                {currentConfigIndex > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{currentConfigIndex} / {totalConfigs}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {progressPercentage.toFixed(1)}% complete
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {!isAutoRunning ? (
                    <Button 
                      className="w-full justify-center"
                      onClick={handleStartAutoRun}
                      data-testid="button-auto-simulation"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {currentConfigIndex > 0 ? 'Resume Auto Run' : 'Start Auto Run'}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1"
                        onClick={handlePauseAutoRun}
                        variant="secondary"
                        data-testid="button-pause-simulation"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleStopAutoRun}
                        variant="destructive"
                        data-testid="button-stop-simulation"
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </div>
                  )}
                  
                  <Button 
                    variant="secondary" 
                    className="w-full justify-center"
                    onClick={handleStepNext}
                    disabled={isAutoRunning || currentConfigIndex >= totalConfigs}
                    data-testid="button-step-through"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Step Next Config
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-center"
                    onClick={handleReset}
                    data-testid="button-reset-default"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Default
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Configuration Info */}
            <Card className="bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950/30 dark:to-teal-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <h3 className="text-md font-semibold text-foreground dark:text-white mb-4">Current Configuration</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md">
                    <span className="text-sm text-muted-foreground dark:text-gray-400">Total Voltage</span>
                    <span className="font-bold text-lg text-primary dark:text-blue-400" data-testid="text-total-voltage">
                      {currentConfig.voltage.toFixed(1)}V
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md">
                    <span className="text-sm text-muted-foreground dark:text-gray-400">Active Cells</span>
                    <span className="font-semibold text-foreground dark:text-white" data-testid="text-active-cells">
                      {currentConfig.activeCells} of 4
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md">
                    <span className="text-sm text-muted-foreground dark:text-gray-400">Connection Type</span>
                    <span className="font-semibold text-foreground dark:text-white" data-testid="text-connection-type">
                      {currentConfig.connectionType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md">
                    <span className="text-sm text-muted-foreground dark:text-gray-400">Switches ON</span>
                    <span className="font-semibold text-foreground dark:text-white" data-testid="text-switches-on">
                      {activeSwitchCount} of 12
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session History */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold text-foreground flex items-center">
                    <History className="text-primary mr-2" />
                    Session History
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearHistoryMutation.mutate()}
                    disabled={sessionHistory.length === 0}
                    data-testid="button-clear-history"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {sessionHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No configurations saved yet
                    </div>
                  ) : (
                    sessionHistory.map((session, index) => (
                      <div 
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-md text-sm"
                        data-testid={`history-item-${index}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getVoltageBackground(session.voltage)}`}>
                            <span className={`font-mono font-semibold text-xs ${getVoltageText(session.voltage)}`}>
                              {session.voltage}V
                            </span>
                          </div>
                          <div>
                            <p className="font-mono text-xs text-muted-foreground">{session.switchStates}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:underline text-xs font-medium"
                          onClick={() => handleLoadConfig(session.switchStates)}
                          data-testid={`button-load-config-${index}`}
                        >
                          Load
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-md font-semibold text-foreground mb-4">Quick Statistics</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Configurations Tested</span>
                    <span className="font-semibold text-foreground" data-testid="text-configs-tested">
                      {sessionHistory.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Voltage</span>
                    <span className="font-semibold text-foreground" data-testid="text-avg-voltage">
                      {sessionHistory.length > 0 
                        ? (sessionHistory.reduce((sum, s) => sum + s.voltage, 0) / sessionHistory.length).toFixed(1)
                        : 0}V
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Current Config</span>
                    <span className="font-semibold text-foreground" data-testid="text-current-config">
                      {currentConfig.configId}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-muted-foreground">Session Duration</span>
                    <span className="font-semibold text-foreground">
                      {/* Session duration would be calculated here */}
                      Active
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
              <CardContent className="p-6">
                <h3 className="text-md font-semibold text-foreground dark:text-white mb-4 flex items-center">
                  <Download className="text-accent mr-2" />
                  Export Current Config
                </h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                    size="sm"
                    data-testid="button-export-excel"
                  >
                    <span>Save as Excel</span>
                    <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                    size="sm"
                    data-testid="button-export-csv"
                  >
                    <span>Save as CSV</span>
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                    size="sm"
                    data-testid="button-export-pdf"
                  >
                    <span>Generate PDF Report</span>
                    <FileDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </Button>
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

function getVoltageBackground(voltage: number): string {
  switch (voltage) {
    case 0: return "bg-gray-100 dark:bg-gray-800";
    case 4: return "bg-blue-100 dark:bg-blue-900/60";
    case 6: return "bg-cyan-100 dark:bg-cyan-900/60";
    case 8: return "bg-teal-100 dark:bg-teal-900/60";
    case 10: return "bg-emerald-100 dark:bg-emerald-900/60";
    case 12: return "bg-green-100 dark:bg-green-900/60";
    case 14: return "bg-lime-100 dark:bg-lime-900/60";
    case 16: return "bg-amber-100 dark:bg-amber-900/60";
    default: return "bg-purple-100 dark:bg-purple-900/60";
  }
}

function getVoltageText(voltage: number): string {
  switch (voltage) {
    case 0: return "text-gray-700 dark:text-gray-200";
    case 4: return "text-blue-700 dark:text-blue-200";
    case 6: return "text-cyan-700 dark:text-cyan-200";
    case 8: return "text-teal-700 dark:text-teal-200";
    case 10: return "text-emerald-700 dark:text-emerald-200";
    case 12: return "text-green-700 dark:text-green-200";
    case 14: return "text-lime-700 dark:text-lime-200";
    case 16: return "text-amber-700 dark:text-amber-200";
    default: return "text-purple-700 dark:text-purple-200";
  }
}
