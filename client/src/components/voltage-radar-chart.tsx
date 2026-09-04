import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import type { Statistics } from "@shared/schema";
import { downloadChart } from "@/lib/export-utils";

interface VoltageRadarChartProps {
  statistics: Statistics | undefined;
}

export default function VoltageRadarChart({ statistics }: VoltageRadarChartProps) {
  if (!statistics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            Loading radar chart data...
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = statistics.distribution.map(item => ({
    voltage: `${item.voltage}V`,
    count: item.count,
    percentage: item.percentage,
  }));

  const handleDownload = () => {
    downloadChart('voltage-radar-chart', 'voltage_radar_chart.png');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center">
            <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Voltage Distribution Radar
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            data-testid="button-download-radar-chart"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
        <div id="voltage-radar-chart" className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis 
                dataKey="voltage" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 'dataMax']}
                tick={{ fill: '#6b7280', fontSize: 10 }}
              />
              <Radar
                name="Configuration Count"
                dataKey="count"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Radar
                name="Percentage"
                dataKey="percentage"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.4}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
