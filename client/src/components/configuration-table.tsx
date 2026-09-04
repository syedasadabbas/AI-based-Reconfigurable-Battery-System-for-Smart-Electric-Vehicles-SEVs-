import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronRight, Download } from "lucide-react";
import type { Configuration } from "@shared/schema";
import { exportToExcel } from "@/lib/export-utils";

interface ConfigurationTableProps {
  configurations: Configuration[];
  loading?: boolean;
}

export default function ConfigurationTable({ configurations, loading }: ConfigurationTableProps) {
  const [voltageFilter, setVoltageFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredConfigs = configurations.filter(config => {
    if (voltageFilter === "all") return true;
    return config.voltage.toString() === voltageFilter;
  });

  const paginatedConfigs = filteredConfigs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredConfigs.length / itemsPerPage);
  const uniqueVoltages = Array.from(new Set(configurations.map(c => c.voltage))).sort((a, b) => a - b);

  // Only the five achievable voltage groups; 6 V, 10 V and 14 V cannot occur.
  const getVoltageColor = (voltage: number): string => {
    switch (voltage) {
      case 0: return "bg-gray-100 text-gray-800";
      case 4: return "bg-blue-100 text-blue-800";
      case 8: return "bg-teal-100 text-teal-800";
      case 12: return "bg-green-100 text-green-800";
      case 16: return "bg-amber-100 text-amber-800";
      default: return "bg-purple-100 text-purple-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center">
            <Table className="text-primary mr-2 w-5 h-5" />
            Sample Configurations
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={voltageFilter} onValueChange={setVoltageFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-voltage-filter">
                <SelectValue placeholder="All Voltages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Voltages</SelectItem>
                {uniqueVoltages.map(voltage => (
                  <SelectItem key={voltage} value={voltage.toString()}>
                    {voltage}V
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToExcel(filteredConfigs, `configurations_${voltageFilter}.csv`)}
              data-testid="button-download-table"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left font-semibold text-muted-foreground">Config ID</TableHead>
                <TableHead className="text-left font-semibold text-muted-foreground">Switch States</TableHead>
                <TableHead className="text-left font-semibold text-muted-foreground">Voltage</TableHead>
                <TableHead className="text-left font-semibold text-muted-foreground">Group</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedConfigs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No configurations found for selected filter
                  </TableCell>
                </TableRow>
              ) : (
                paginatedConfigs.map((config) => (
                  <TableRow 
                    key={config.id}
                    className="hover:bg-muted/50 transition-colors"
                    data-testid={`config-row-${config.configId}`}
                  >
                    <TableCell className="font-mono text-foreground">
                      {config.configId}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {config.switchStates}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={getVoltageColor(config.voltage)}
                      >
                        {config.voltage}V
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {config.voltageGroup}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-muted-foreground">
          <span data-testid="table-info" className="text-xs sm:text-sm">
            Showing {Math.min(filteredConfigs.length, itemsPerPage)} of {filteredConfigs.length} configurations
            {voltageFilter !== "all" && ` (filtered by ${voltageFilter}V)`}
          </span>
          
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-3 w-full sm:w-auto">
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <span className="px-2 text-xs sm:text-sm whitespace-nowrap">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              className="text-primary hover:underline font-medium text-xs sm:text-sm"
              data-testid="button-view-all"
            >
              View All Configurations
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
