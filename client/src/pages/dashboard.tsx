import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Play,
  History,
  FileText,
  ChevronRight,
  Info
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import StatsOverview from "@/components/stats-overview";
import ExportSection from "@/components/export-section";
import ConfigurationTable from "@/components/configuration-table";
import VoltageRadarChart from "@/components/voltage-radar-chart";
import ConnectionTypeChart from "@/components/connection-type-chart";
import VoltageBarChart from "@/components/voltage-bar-chart";
import AdvancedFilter from "@/components/advanced-filter";
import { exportToPDF } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";
import type { Configuration, Statistics } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [filteredConfigurations, setFilteredConfigurations] = useState<Configuration[]>([]);

  const { data: configurations = [], isLoading: configsLoading } = useQuery<Configuration[]>({
    queryKey: ["/api/configurations"],
  });

  const { data: statistics, isLoading: statsLoading } = useQuery<Statistics>({
    queryKey: ["/api/statistics"],
  });

  // Initialize filtered configurations when data loads
  useEffect(() => {
    if (configurations.length > 0 && filteredConfigurations.length === 0) {
      setFilteredConfigurations(configurations);
    }
  }, [configurations]);

  const voltageGroups = [
    { voltage: "0V", label: "Zero Output", count: statistics?.voltageGroups["0"] || 0, badgeClass: "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200", cardClass: "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" },
    { voltage: "4V", label: "Single Cell", count: statistics?.voltageGroups["4"] || 0, badgeClass: "bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200", cardClass: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30" },
    { voltage: "6V", label: "Mixed Config", count: statistics?.voltageGroups["6"] || 0, badgeClass: "bg-cyan-200 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200", cardClass: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/30" },
    { voltage: "8V", label: "Two Series", count: statistics?.voltageGroups["8"] || 0, badgeClass: "bg-teal-200 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200", cardClass: "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/30" },
    { voltage: "10V", label: "Three Mixed", count: statistics?.voltageGroups["10"] || 0, badgeClass: "bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200", cardClass: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30" },
    { voltage: "12V", label: "Three Series", count: statistics?.voltageGroups["12"] || 0, badgeClass: "bg-green-200 dark:bg-green-900/60 text-green-800 dark:text-green-200", cardClass: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30" },
    { voltage: "14V", label: "Four Mixed", count: statistics?.voltageGroups["14"] || 0, badgeClass: "bg-lime-200 dark:bg-lime-900/60 text-lime-800 dark:text-lime-200", cardClass: "bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800 hover:bg-lime-100 dark:hover:bg-lime-900/30" },
    { voltage: "16V", label: "Full Series", count: statistics?.voltageGroups["16"] || 0, badgeClass: "bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200", cardClass: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30" },
  ];

  const handleGenerateReport = () => {
    if (!configurations.length || !statistics) {
      toast({
        title: "No Data Available",
        description: "Please wait for configuration data to load before generating a report",
        variant: "destructive"
      });
      return;
    }

    try {
      exportToPDF(configurations, statistics, 'battery_configurations_report.pdf');
      toast({
        title: "Report Generated",
        description: "Your comprehensive battery configuration report has been downloaded"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error generating the report",
        variant: "destructive"
      });
    }
  };

  const handleViewHistory = () => {
    setLocation("/simulation");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 flex-1">
        {/* Stats Overview */}
        <StatsOverview statistics={statistics} loading={statsLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Export & Import Section */}
            <ExportSection />

            {/* Voltage Distribution Chart */}
            <VoltageBarChart statistics={statistics} />

            {/* Radar and Pie Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VoltageRadarChart statistics={statistics} />
              <ConnectionTypeChart configurations={configurations} />
            </div>

            {/* Configuration Examples Table */}
            <ConfigurationTable configurations={filteredConfigurations} loading={configsLoading} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-md font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-between" 
                    onClick={() => setLocation("/simulation")}
                    data-testid="button-start-simulation"
                  >
                    <span className="font-medium">Start Simulation</span>
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full justify-between"
                    onClick={handleGenerateReport}
                    disabled={!configurations.length || !statistics}
                    data-testid="button-generate-report"
                  >
                    <span className="font-medium">Generate Report</span>
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full justify-between"
                    onClick={handleViewHistory}
                    data-testid="button-view-history"
                  >
                    <span className="font-medium">View History</span>
                    <History className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Filters */}
            <AdvancedFilter 
              configurations={configurations} 
              onFilterChange={setFilteredConfigurations} 
            />

            {/* Voltage Groups Summary */}
            <Card>
              <CardContent className="p-3 sm:p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center justify-between">
                  <span>Voltage Groups</span>
                  <span className="text-xs text-muted-foreground dark:text-gray-400 font-normal">Click to filter</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {voltageGroups.map((group) => {
                    const voltageNum = parseInt(group.voltage);
                    const isActive = filteredConfigurations.length > 0 && 
                      filteredConfigurations.every(c => c.voltage === voltageNum) &&
                      filteredConfigurations.length === configurations.filter(c => c.voltage === voltageNum).length;
                    
                    return (
                      <div 
                        key={group.voltage}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${group.cardClass} ${
                          isActive ? 'ring-2 ring-primary shadow-md' : ''
                        }`}
                        onClick={() => {
                          const filtered = configurations.filter(c => c.voltage === voltageNum);
                          setFilteredConfigurations(filtered);
                        }}
                        data-testid={`voltage-group-${group.voltage.toLowerCase()}`}
                      >
                        <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-1.5 ${group.badgeClass}`}>
                          <span className="font-mono font-bold text-sm">
                            {group.voltage}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-foreground dark:text-white text-center leading-tight">{group.label}</p>
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-0.5">{group.count.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card className="bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950/30 dark:to-teal-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-md font-semibold text-foreground dark:text-white mb-3 flex items-center">
                  <Info className="text-primary mr-2" />
                  System Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-400">Cells per Battery:</span>
                    <span className="font-semibold text-foreground dark:text-white">4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-400">Voltage per Cell:</span>
                    <span className="font-semibold text-foreground dark:text-white">4V</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-400">Switches per Cell:</span>
                    <span className="font-semibold text-foreground dark:text-white">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-400">Total Switches:</span>
                    <span className="font-semibold text-foreground dark:text-white">12</span>
                  </div>
                  <Separator className="my-2 bg-blue-200 dark:bg-blue-800" />
                  <div className="flex justify-between pt-2">
                    <span className="text-muted-foreground dark:text-gray-400">Possible Configs:</span>
                    <span className="font-semibold text-primary dark:text-blue-400">2¹² = 4,096</span>
                  </div>
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

function getVoltageColor(voltage: number): string {
  switch (voltage) {
    case 0: return "bg-gradient-to-r from-gray-400 to-gray-500";
    case 4: return "bg-gradient-to-r from-blue-400 to-blue-600";
    case 6: return "bg-gradient-to-r from-cyan-400 to-cyan-600";
    case 8: return "bg-gradient-to-r from-teal-400 to-teal-600";
    case 10: return "bg-gradient-to-r from-emerald-400 to-emerald-600";
    case 12: return "bg-gradient-to-r from-green-400 to-green-600";
    case 14: return "bg-gradient-to-r from-lime-400 to-lime-600";
    case 16: return "bg-gradient-to-r from-amber-400 to-amber-600";
    default: return "bg-gradient-to-r from-purple-400 to-purple-600";
  }
}
