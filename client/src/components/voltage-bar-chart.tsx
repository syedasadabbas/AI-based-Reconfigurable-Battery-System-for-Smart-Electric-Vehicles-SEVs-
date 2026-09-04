import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import type { Statistics } from "@shared/schema";
import { downloadChart } from "@/lib/export-utils";

interface VoltageBarChartProps {
  statistics: Statistics | undefined;
}

const VOLTAGE_COLORS: Record<number, string> = {
  0: '#9ca3af',
  4: '#3b82f6',
  6: '#06b6d4',
  8: '#14b8a6',
  10: '#10b981',
  12: '#22c55e',
  14: '#84cc16',
  16: '#f59e0b'
};

export default function VoltageBarChart({ statistics }: VoltageBarChartProps) {
  if (!statistics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            Loading distribution data...
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = statistics.distribution.map(item => ({
    voltage: `${item.voltage}V`,
    count: item.count,
    percentage: item.percentage,
    voltageNum: item.voltage
  }));

  const handleDownload = () => {
    downloadChart('voltage-bar-chart', 'voltage_distribution.png');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center">
            <BarChart3 className="text-primary mr-2" />
            Configuration Distribution by Voltage
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            data-testid="button-download-bar-chart"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
        <div id="voltage-bar-chart" className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="voltage" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'count') return [`${value} configs`, 'Count'];
                  return [value, name];
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={VOLTAGE_COLORS[entry.voltageNum] || '#6b7280'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
