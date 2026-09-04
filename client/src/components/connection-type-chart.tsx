import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";
import type { Configuration } from "@shared/schema";
import { downloadChart } from "@/lib/export-utils";

interface ConnectionTypeChartProps {
  configurations: Configuration[];
}

const COLORS = {
  Series: '#3b82f6',
  Parallel: '#10b981',
  Mixed: '#f59e0b',
  Disconnected: '#6b7280'
};

export default function ConnectionTypeChart({ configurations }: ConnectionTypeChartProps) {
  if (!configurations || configurations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            Loading connection type data...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate connection type counts
  const connectionCounts = configurations.reduce((acc, config) => {
    const type = config.connectionType || 'Disconnected';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(connectionCounts).map(([type, count]) => ({
    name: type,
    value: count
  }));

  const handleDownload = () => {
    downloadChart('connection-type-chart', 'connection_types.png');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center">
            <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Connection Type Distribution
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            data-testid="button-download-connection-chart"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
        <div id="connection-type-chart" className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name as keyof typeof COLORS] || '#6b7280'} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
