import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import type { Configuration } from "@shared/schema";

interface AdvancedFilterProps {
  configurations: Configuration[];
  onFilterChange: (filtered: Configuration[]) => void;
}

export default function AdvancedFilter({ configurations, onFilterChange }: AdvancedFilterProps) {
  const [voltageClass, setVoltageClass] = useState<string>("all");
  const [connectionType, setConnectionType] = useState<string>("all");

  const uniqueVoltageClasses = Array.from(
    new Set(configurations.map(c => c.voltageGroup))
  ).sort();

  const uniqueConnectionTypes = Array.from(
    new Set(configurations.map(c => c.connectionType))
  ).filter(Boolean).sort();

  const applyFilters = (voltage: string, connection: string) => {
    let filtered = configurations;

    if (voltage !== "all") {
      filtered = filtered.filter(c => c.voltageGroup === voltage);
    }

    if (connection !== "all") {
      filtered = filtered.filter(c => c.connectionType === connection);
    }

    onFilterChange(filtered);
  };

  const handleVoltageClassChange = (value: string) => {
    setVoltageClass(value);
    applyFilters(value, connectionType);
  };

  const handleConnectionTypeChange = (value: string) => {
    setConnectionType(value);
    applyFilters(voltageClass, value);
  };

  const resetFilters = () => {
    setVoltageClass("all");
    setConnectionType("all");
    onFilterChange(configurations);
  };

  const hasActiveFilters = voltageClass !== "all" || connectionType !== "all";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold text-foreground flex items-center">
            <Filter className="text-primary mr-2 w-4 h-4" />
            Advanced Filters
          </h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              data-testid="button-reset-filters"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Voltage Class
            </label>
            <Select value={voltageClass} onValueChange={handleVoltageClassChange}>
              <SelectTrigger className="w-full" data-testid="select-voltage-class">
                <SelectValue placeholder="All Voltage Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Voltage Classes</SelectItem>
                {uniqueVoltageClasses.map(vClass => (
                  <SelectItem key={vClass} value={vClass}>
                    {vClass}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Combination Type
            </label>
            <Select value={connectionType} onValueChange={handleConnectionTypeChange}>
              <SelectTrigger className="w-full" data-testid="select-connection-type">
                <SelectValue placeholder="All Connection Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Connection Types</SelectItem>
                {uniqueConnectionTypes.map(cType => (
                  <SelectItem key={cType} value={cType}>
                    {cType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {voltageClass !== "all" && (
                  <Badge variant="secondary" className="text-xs" data-testid="filter-badge-voltage">
                    {voltageClass}
                  </Badge>
                )}
                {connectionType !== "all" && (
                  <Badge variant="secondary" className="text-xs" data-testid="filter-badge-connection">
                    {connectionType}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
