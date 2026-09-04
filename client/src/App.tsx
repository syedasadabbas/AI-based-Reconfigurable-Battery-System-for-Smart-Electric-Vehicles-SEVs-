import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "@/pages/dashboard";
import Simulation from "@/pages/simulation";
import CarSimulation from "@/pages/car-simulation";
import PackAnalysis from "@/pages/pack-analysis";
import AIMonitoring from "@/pages/ai-monitoring";
import ResearchSummary from "@/pages/research-summary";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/simulation" component={Simulation} />
      <Route path="/car-simulation" component={CarSimulation} />
      <Route path="/pack-analysis" component={PackAnalysis} />
      <Route path="/ai-monitoring" component={AIMonitoring} />
      <Route path="/research-summary" component={ResearchSummary} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="battery-simulator-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
