import { Card, CardContent } from "@/components/ui/card";
import { Database, Layers, Zap, Battery } from "lucide-react";
import type { Statistics } from "@shared/schema";

interface StatsOverviewProps {
  statistics?: Statistics;
  loading?: boolean;
}

export default function StatsOverview({ statistics, loading }: StatsOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Configurations",
      value: statistics?.totalConfigurations?.toLocaleString() || "0",
      icon: Database,
      gradient: "bg-gradient-to-br from-blue-600 to-teal-500",
      iconBg: "bg-white/20"
    },
    {
      title: "Voltage Groups",
      value: Object.keys(statistics?.voltageGroups || {}).length.toString(),
      icon: Layers,
      bg: "bg-card border-border",
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary"
    },
    {
      title: "Max Voltage",
      value: "16V",
      icon: Zap,
      bg: "bg-card border-border",
      iconBg: "bg-accent/10",
      iconColor: "text-accent"
    },
    {
      title: "Battery Cells",
      value: "4",
      icon: Battery,
      bg: "bg-card border-border",
      iconBg: "bg-primary/10",
      iconColor: "text-primary"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card 
          key={stat.title}
          className={stat.gradient ? `${stat.gradient} text-white shadow-lg` : `${stat.bg} shadow-sm border`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  stat.gradient ? "text-white/80" : "text-muted-foreground"
                }`}>
                  {stat.title}
                </p>
                <p 
                  className={`text-3xl font-bold mt-2 ${
                    stat.gradient ? "text-white" : "text-foreground"
                  }`}
                  data-testid={`stat-${index}`}
                >
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                <stat.icon className={`text-2xl ${stat.gradient ? "text-white" : stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
