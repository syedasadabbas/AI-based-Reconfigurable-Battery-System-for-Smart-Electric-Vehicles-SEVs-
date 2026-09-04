import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Battery, Save, Shuffle, RotateCcw } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SwitchPanelProps {
  switches: boolean[];
  onSwitchToggle: (index: number) => void;
  onRandomize: () => void;
  onReset: () => void;
  onSave: () => void;
  switchStates: string;
  isSaving?: boolean;
}

const CELL_COLORS = [
  { bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30", border: "border-blue-300 dark:border-blue-700", accent: "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200" },
  { bg: "bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/40 dark:to-teal-900/30", border: "border-teal-300 dark:border-teal-700", accent: "bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-200" },
  { bg: "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/40 dark:to-gray-800/30", border: "border-gray-300 dark:border-gray-700", accent: "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200" },
  { bg: "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/40 dark:to-gray-800/30", border: "border-gray-300 dark:border-gray-700", accent: "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200" },
];

const SWITCH_LABELS = ['a', 'b', 'c'];

export default function SwitchPanel({
  switches,
  onSwitchToggle,
  onRandomize,
  onReset,
  onSave,
  switchStates,
  isSaving = false
}: SwitchPanelProps) {
  
  const getCellSwitches = (cellIndex: number) => {
    return switches.slice(cellIndex * 3, (cellIndex + 1) * 3);
  };

  const getCellState = (cellIndex: number) => {
    const cellSwitches = getCellSwitches(cellIndex);
    return cellSwitches.map(s => s ? '1' : '0').join(' ');
  };

  const isCellActive = (cellIndex: number) => {
    return getCellSwitches(cellIndex).some(Boolean);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center">
          <Battery className="text-primary mr-2" />
          Switch Configuration Controls
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }, (_, cellIndex) => {
            const cellColor = CELL_COLORS[cellIndex];
            const isActive = isCellActive(cellIndex);
            
            return (
              <div
                key={cellIndex}
                className={`rounded-lg p-5 border-2 ${cellColor.bg} ${cellColor.border} ${
                  isActive ? 'ring-2 ring-primary/20' : ''
                }`}
                data-testid={`cell-${cellIndex + 1}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    <Battery className={`mr-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    Battery Cell {cellIndex + 1}
                  </h3>
                  <span className={`text-xs font-mono px-2 py-1 rounded ${cellColor.accent}`}>
                    4V
                  </span>
                </div>
                
                <div className="space-y-3">
                  {SWITCH_LABELS.map((label, switchIndex) => {
                    const globalIndex = cellIndex * 3 + switchIndex;
                    const isOn = switches[globalIndex];
                    
                    return (
                      <div key={switchIndex} className="flex items-center justify-between">
                        <label 
                          className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                          htmlFor={`switch-${cellIndex + 1}${label}`}
                        >
                          Switch {cellIndex + 1}{label} (R₁{label})
                        </label>
                        <Switch
                          id={`switch-${cellIndex + 1}${label}`}
                          checked={isOn}
                          onCheckedChange={() => onSwitchToggle(globalIndex)}
                          data-testid={`switch-${cellIndex + 1}${label}`}
                        />
                      </div>
                    );
                  })}
                </div>
                
                <div className={`mt-3 pt-3 border-t ${cellColor.border}`}>
                  <p className="text-xs text-muted-foreground">
                    State: <span className="font-mono font-semibold" data-testid={`cell-state-${cellIndex + 1}`}>
                      {getCellState(cellIndex)}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm w-full sm:w-auto">
            <p className="text-muted-foreground">Complete Configuration:</p>
            <p className="font-mono font-semibold text-foreground mt-1 text-xs sm:text-sm break-all" data-testid="text-complete-config">
              {switchStates}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="flex-1 sm:flex-none"
              data-testid="button-reset-switches"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onRandomize}
              className="flex-1 sm:flex-none"
              data-testid="button-randomize-switches"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Randomize
            </Button>
            <Button
              onClick={onSave}
              size="sm"
              disabled={isSaving}
              className="flex-1 sm:flex-none min-w-[110px]"
              data-testid="button-save-config"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Config"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
