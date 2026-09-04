import { type Configuration, type InsertConfiguration, type Session, type InsertSession, type Statistics, type RoadProfile, type CellStateDB, type InsertCellState, type AICellState } from "@shared/schema";
import { randomUUID } from "crypto";
import { generateAllAppConfigurations } from "../shared/battery-model";
import { parseRoadProfile } from "./road-profile-parser";
import { PREDEFINED_ROAD_PROFILES } from "./road-profiles-data";

export interface IStorage {
  // Configuration CRUD
  getAllConfigurations(): Promise<Configuration[]>;
  getConfigurationsByVoltage(voltage: number): Promise<Configuration[]>;
  createConfiguration(config: InsertConfiguration): Promise<Configuration>;
  bulkCreateConfigurations(configs: InsertConfiguration[]): Promise<Configuration[]>;
  
  // Session CRUD
  getSessionHistory(sessionId: string): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  clearSessionHistory(sessionId: string): Promise<void>;
  
  // Cell States CRUD
  getCellStates(sessionId: string): Promise<CellStateDB[]>;
  saveCellStates(sessionId: string, cellStates: AICellState[]): Promise<CellStateDB[]>;
  clearCellStates(sessionId: string): Promise<void>;
  
  // Statistics
  getStatistics(): Promise<Statistics>;
  
  // Road Profiles
  getAllRoadProfiles(): Promise<RoadProfile[]>;
  getRoadProfile(id: string): Promise<RoadProfile | null>;
  getConfigurationsForVoltage(voltage: number): Promise<Configuration[]>;
}

export class MemStorage implements IStorage {
  private configurations: Map<string, Configuration>;
  private sessions: Map<string, Session>;
  private cellStatesMap: Map<string, CellStateDB>;
  private roadProfiles: Map<string, RoadProfile>;

  constructor() {
    this.configurations = new Map();
    this.sessions = new Map();
    this.cellStatesMap = new Map();
    this.roadProfiles = new Map();
    this.initializeConfigurations();
    this.initializeRoadProfiles();
  }
  
  private initializeRoadProfiles() {
    PREDEFINED_ROAD_PROFILES.forEach((profile) => {
      try {
        const parsed = parseRoadProfile(profile.encoded, profile.name, profile.id, profile.sceneType);
        this.roadProfiles.set(profile.id, parsed);
      } catch (error) {
        console.error(`Failed to initialize road profile ${profile.id}:`, error);
      }
    });
  }

  private async initializeConfigurations() {
    // Generate all 4096 possible configurations
    const configs = this.generateAllConfigurations();
    for (const config of configs) {
      const id = randomUUID();
      const fullConfig: Configuration = { 
        ...config, 
        id, 
        createdAt: new Date() 
      };
      this.configurations.set(id, fullConfig);
    }
  }

  /**
   * All 4096 configurations, analysed by shared/battery-model.ts.
   *
   * The private calculateVoltage / getVoltageGroup / getConnectionType /
   * getActiveCells / formatSwitchStates helpers that used to sit here were a
   * third independent implementation of the circuit model. They labelled
   * unreachable 6 V, 10 V and 14 V groups, had no Parallel connection type,
   * and could not represent a short circuit. They are gone: derive everything
   * from the shared model.
   */
  private generateAllConfigurations(): InsertConfiguration[] {
    return generateAllAppConfigurations().map((c) => ({
      configId: c.configId,
      switchStates: c.switchStates,
      voltage: c.voltage,
      voltageGroup: c.voltageGroup,
      connectionType: c.connectionType,
      activeCells: c.activeCells,
    }));
  }

  async getAllConfigurations(): Promise<Configuration[]> {
    return Array.from(this.configurations.values());
  }

  async getConfigurationsByVoltage(voltage: number): Promise<Configuration[]> {
    return Array.from(this.configurations.values()).filter(
      config => config.voltage === voltage
    );
  }

  async createConfiguration(config: InsertConfiguration): Promise<Configuration> {
    const id = randomUUID();
    const fullConfig: Configuration = { 
      ...config, 
      id, 
      createdAt: new Date() 
    };
    this.configurations.set(id, fullConfig);
    return fullConfig;
  }

  async bulkCreateConfigurations(configs: InsertConfiguration[]): Promise<Configuration[]> {
    const results: Configuration[] = [];
    for (const config of configs) {
      const result = await this.createConfiguration(config);
      results.push(result);
    }
    return results;
  }

  async getSessionHistory(sessionId: string): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.sessionId === sessionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createSession(session: InsertSession): Promise<Session> {
    const id = randomUUID();
    const fullSession: Session = { 
      ...session, 
      id, 
      createdAt: new Date() 
    };
    this.sessions.set(id, fullSession);
    return fullSession;
  }

  async clearSessionHistory(sessionId: string): Promise<void> {
    const sessionsToRemove = Array.from(this.sessions.entries())
      .filter(([_, session]) => session.sessionId === sessionId)
      .map(([id]) => id);
    
    sessionsToRemove.forEach(id => this.sessions.delete(id));
  }

  async getStatistics(): Promise<Statistics> {
    const configs = Array.from(this.configurations.values());
    const voltageGroups: Record<string, number> = {};
    
    configs.forEach(config => {
      const voltage = config.voltage.toString();
      voltageGroups[voltage] = (voltageGroups[voltage] || 0) + 1;
    });

    const distribution = Object.entries(voltageGroups).map(([voltage, count]) => ({
      voltage: parseFloat(voltage),
      count,
      percentage: Math.round((count / configs.length) * 100 * 10) / 10,
    })).sort((a, b) => a.voltage - b.voltage);

    return {
      totalConfigurations: configs.length,
      voltageGroups,
      distribution,
    };
  }

  async getAllRoadProfiles(): Promise<RoadProfile[]> {
    return Array.from(this.roadProfiles.values());
  }

  async getRoadProfile(id: string): Promise<RoadProfile | null> {
    return this.roadProfiles.get(id) || null;
  }

  async getConfigurationsForVoltage(voltage: number): Promise<Configuration[]> {
    return Array.from(this.configurations.values())
      .filter(config => config.voltage === voltage)
      .sort((a, b) => a.activeCells - b.activeCells);
  }

  async getCellStates(sessionId: string): Promise<CellStateDB[]> {
    return Array.from(this.cellStatesMap.values())
      .filter(state => state.sessionId === sessionId)
      .sort((a, b) => a.cellId - b.cellId);
  }

  async saveCellStates(sessionId: string, cellStates: AICellState[]): Promise<CellStateDB[]> {
    // Clear existing states for this session
    await this.clearCellStates(sessionId);
    
    // Save new states
    const results: CellStateDB[] = [];
    for (const cellState of cellStates) {
      const id = randomUUID();
      const now = new Date();
      const dbCellState: CellStateDB = {
        id,
        sessionId,
        cellId: cellState.id,
        health: cellState.health,
        soc: cellState.soc,
        activations: cellState.activations,
        restingTime: cellState.restingTime,
        totalUsageTime: cellState.totalUsageTime,
        degradationRate: cellState.degradationRate,
        useCount: cellState.useCount,
        lastUsedDistance: cellState.lastUsedDistance,
        isResting: cellState.isResting,
        createdAt: now,
        updatedAt: now,
      };
      this.cellStatesMap.set(id, dbCellState);
      results.push(dbCellState);
    }
    return results;
  }

  async clearCellStates(sessionId: string): Promise<void> {
    const statesToRemove = Array.from(this.cellStatesMap.entries())
      .filter(([_, state]) => state.sessionId === sessionId)
      .map(([id]) => id);
    
    statesToRemove.forEach(id => this.cellStatesMap.delete(id));
  }
}

export const storage = new MemStorage();
