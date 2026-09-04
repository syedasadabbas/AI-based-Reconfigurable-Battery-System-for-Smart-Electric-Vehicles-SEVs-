import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, RotateCcw } from "lucide-react";

interface VoltageDisplayProps {
  voltage: number;
  voltageGroup: string;
  configId: string;
  connectionType: string;
}

export default function VoltageDisplay({ 
  voltage, 
  voltageGroup, 
  configId, 
  connectionType 
}: VoltageDisplayProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-xl">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Zap className="mr-2" />
            Current Configuration Output
          </h2>
          <Button 
            variant="secondary" 
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/20"
            data-testid="button-reset-all"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset All
          </Button>
        </div>
        
        <div className="text-center py-6">
          <div 
            className="text-6xl font-bold font-mono mb-2 animate-pulse"
            style={{ 
              textShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
              filter: voltage > 0 ? "drop-shadow(0 0 10px rgba(255, 255, 255, 0.4))" : "none"
            }}
            data-testid="display-current-voltage"
          >
            {voltage.toFixed(1)}V
          </div>
          
          <p className="text-white/80 mt-2 text-sm mb-4" data-testid="text-voltage-group">
            {voltageGroup}
          </p>
          
          <div className="flex items-center justify-center space-x-4 text-sm">
            <Badge variant="secondary" className="bg-white/20 text-white" data-testid="badge-config-id">
              {configId}
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white" data-testid="badge-connection-type">
              {connectionType}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
