import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { calculateConfiguration } from "../shared/battery-model";
import { switchConfigSchema, exportRequestSchema, aiCellStateSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all configurations
  app.get("/api/configurations", async (_req, res) => {
    try {
      const configurations = await storage.getAllConfigurations();
      res.json(configurations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch configurations" });
    }
  });

  // Get configurations by voltage
  app.get("/api/configurations/voltage/:voltage", async (req, res) => {
    try {
      const voltage = parseFloat(req.params.voltage);
      if (isNaN(voltage)) {
        return res.status(400).json({ message: "Invalid voltage parameter" });
      }
      
      const configurations = await storage.getConfigurationsByVoltage(voltage);
      res.json(configurations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch configurations by voltage" });
    }
  });

  // Calculate voltage from switch configuration.
  //
  // This used to look the configuration up by its formatted switch string and
  // then recompute the active-cell set from a second solver, so the response
  // could mix two models. It now comes from shared/battery-model.ts alone.
  app.post("/api/calculate", async (req, res) => {
    try {
      const result = switchConfigSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid switch configuration", errors: result.error.errors });
      }

      res.json(calculateConfiguration(result.data.switches));
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate voltage" });
    }
  });

  app.get("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const history = await storage.getSessionHistory(sessionId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session history" });
    }
  });

  // Save session configuration
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = req.body;
      const session = await storage.createSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to save session" });
    }
  });

  // Clear session history
  app.delete("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.clearSessionHistory(sessionId);
      res.json({ message: "Session history cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear session history" });
    }
  });

  // Get cell states for a session
  app.get("/api/cell-states/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const cellStates = await storage.getCellStates(sessionId);
      res.json(cellStates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cell states" });
    }
  });

  // Save cell states for a session
  app.post("/api/cell-states/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Validate cell states array
      const cellStatesArraySchema = z.array(aiCellStateSchema);
      const result = cellStatesArraySchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid cell states data", 
          errors: result.error.errors 
        });
      }
      
      const cellStates = result.data;
      const savedStates = await storage.saveCellStates(sessionId, cellStates);
      res.json(savedStates);
    } catch (error) {
      res.status(500).json({ message: "Failed to save cell states" });
    }
  });

  // Clear cell states for a session
  app.delete("/api/cell-states/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.clearCellStates(sessionId);
      res.json({ message: "Cell states cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cell states" });
    }
  });

  // Get statistics
  app.get("/api/statistics", async (_req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Get all road profiles
  app.get("/api/road-profiles", async (_req, res) => {
    try {
      const profiles = await storage.getAllRoadProfiles();
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch road profiles" });
    }
  });

  // Get specific road profile
  app.get("/api/road-profiles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const profile = await storage.getRoadProfile(id);
      if (!profile) {
        return res.status(404).json({ message: "Road profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch road profile" });
    }
  });

  // Get configurations for specific voltage (sorted by active cells)
  app.get("/api/configurations-by-voltage/:voltage", async (req, res) => {
    try {
      const voltage = parseFloat(req.params.voltage);
      if (isNaN(voltage)) {
        return res.status(400).json({ message: "Invalid voltage parameter" });
      }
      
      const configurations = await storage.getConfigurationsForVoltage(voltage);
      res.json(configurations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch configurations for voltage" });
    }
  });

  // Export configurations
  app.post("/api/export", async (req, res) => {
    try {
      const result = exportRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid export request", errors: result.error.errors });
      }

      const { format, voltageFilter } = result.data;
      
      let configurations = await storage.getAllConfigurations();
      
      // Apply voltage filter if provided
      if (voltageFilter && voltageFilter !== "all") {
        const voltage = parseFloat(voltageFilter);
        if (!isNaN(voltage)) {
          configurations = configurations.filter(config => config.voltage === voltage);
        }
      }

      // Generate export data based on format
      if (format === "csv") {
        const csvData = generateCSV(configurations);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="battery_configurations.csv"');
        res.send(csvData);
      } else if (format === "xlsx") {
        // For Excel export, we'll return the data as JSON and handle Excel generation on frontend
        // This is because ExcelJS works better on the client side in this context
        res.json({ 
          format: 'xlsx',
          data: configurations,
          filename: 'battery_configurations.xlsx'
        });
      } else if (format === "pdf") {
        // Return data for PDF generation on frontend
        const stats = await storage.getStatistics();
        res.json({ 
          format: 'pdf',
          configurations,
          statistics: stats,
          filename: 'battery_configurations_report.pdf'
        });
      } else {
        res.status(400).json({ message: "Unsupported export format" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function parseSwitchStates(switchStates: string): boolean[] {
  return switchStates.replace(/\s/g, '').split('').map(s => s === '1');
}

function generateCSV(configurations: any[]): string {
  const headers = [
    'Config ID',
    'R1A', 'R1B', 'R1C',
    'R2A', 'R2B', 'R2C',
    'R3A', 'R3B', 'R3C',
    'R4A', 'R4B', 'R4C',
    'Voltage',
    'Voltage Class',
    'Combination Type',
    'Active Cells'
  ];
  
  const rows = configurations.map(config => {
    const switchArray = parseSwitchStates(config.switchStates);
    
    return [
      config.configId,
      ...switchArray.map(s => s ? '1' : '0'),
      config.voltage,
      config.voltageGroup,
      config.connectionType,
      config.activeCells
    ];
  });
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
