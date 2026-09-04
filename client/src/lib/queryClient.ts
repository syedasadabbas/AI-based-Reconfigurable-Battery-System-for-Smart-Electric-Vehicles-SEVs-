/**
 * Fully client-side query client — no HTTP requests, no backend.
 * All data is either computed in-memory or persisted to localStorage.
 */

import { QueryClient, QueryFunction } from "@tanstack/react-query";
import {
  getAllConfigurations,
  getStatistics,
  getRoadProfiles,
  getSessionHistory,
  createSession,
  clearSessionHistory,
  getCellStates,
  saveCellStates,
  clearCellStates,
  calculateConfig,
  generateCSV,
} from "./local-store";
import { exportToExcel, exportToPDF } from "./export-utils";
import type { AICellState, Configuration } from "@shared/schema";

// ─── Default query function (handles all useQuery calls) ──────────────────────

const localQueryFn: QueryFunction = async ({ queryKey }) => {
  // React Query keys may be arrays; join them to reconstruct the URL
  const url = (queryKey as string[]).join("/");

  if (url === "/api/configurations") return getAllConfigurations();
  if (url === "/api/statistics") return getStatistics();
  if (url === "/api/road-profiles") return getRoadProfiles();

  if (url.startsWith("/api/sessions/")) {
    return getSessionHistory(url.slice("/api/sessions/".length));
  }
  if (url.startsWith("/api/cell-states/")) {
    return getCellStates(url.slice("/api/cell-states/".length));
  }

  console.warn(`[queryClient] Unhandled query key: ${url}`);
  return null;
};

// ─── apiRequest (handles all useMutation / manual fetch calls) ────────────────

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const respond = (body: unknown, contentType = "application/json") =>
    new Response(
      contentType === "application/json" ? JSON.stringify(body) : (body as string),
      { status: 200, headers: { "Content-Type": contentType } },
    );

  // POST /api/calculate
  if (method === "POST" && url === "/api/calculate") {
    const { switches } = data as { switches: boolean[] };
    return respond(calculateConfig(switches));
  }

  // POST /api/sessions
  if (method === "POST" && url === "/api/sessions") {
    return respond(createSession(data as Parameters<typeof createSession>[0]));
  }

  // DELETE /api/sessions/:id
  if (method === "DELETE" && url.startsWith("/api/sessions/")) {
    clearSessionHistory(url.slice("/api/sessions/".length));
    return respond({ message: "Session history cleared" });
  }

  // POST /api/cell-states/:id
  if (method === "POST" && url.startsWith("/api/cell-states/")) {
    const sessionId = url.slice("/api/cell-states/".length);
    return respond(saveCellStates(sessionId, data as AICellState[]));
  }

  // DELETE /api/cell-states/:id
  if (method === "DELETE" && url.startsWith("/api/cell-states/")) {
    clearCellStates(url.slice("/api/cell-states/".length));
    return respond({ message: "Cell states cleared" });
  }

  // POST /api/export
  if (method === "POST" && url === "/api/export") {
    const { format, voltageFilter } = data as { format: string; voltageFilter?: string };
    let configs: Configuration[] = getAllConfigurations();

    if (voltageFilter && voltageFilter !== "all") {
      const v = parseFloat(voltageFilter);
      if (!isNaN(v)) configs = configs.filter(c => c.voltage === v);
    }

    if (format === "csv") {
      // Directly trigger the download and return a dummy CSV response so the
      // export-section handler can still call response.text() without error.
      const csv = generateCSV(configs);
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "battery_configurations.csv";
      a.click();
      URL.revokeObjectURL(a.href);
      return new Response(csv, { status: 200, headers: { "Content-Type": "text/csv" } });
    }

    if (format === "xlsx") {
      exportToExcel(configs, "battery_configurations.xlsx");
      return respond({ format: "xlsx", data: configs, filename: "battery_configurations.xlsx" });
    }

    if (format === "pdf") {
      const stats = getStatistics();
      exportToPDF(configs, stats, "battery_configurations_report.pdf");
      return respond({ format: "pdf", configurations: configs, statistics: stats, filename: "battery_configurations_report.pdf" });
    }
  }

  console.warn(`[queryClient] Unhandled request: ${method} ${url}`);
  return respond({});
}

// ─── QueryClient instance ─────────────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: localQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
