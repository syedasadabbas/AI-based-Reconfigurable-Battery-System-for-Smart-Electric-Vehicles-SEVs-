export interface CircuitConfig {
  switches: boolean[];
  voltage: number;
  activeCells: number;
  connectionType: string;
  voltageGroup: string;
}

export class CircuitCalculator {
  static calculateVoltage(switches: boolean[]): number {
    // Simplified circuit analysis logic
    const cellVoltages = this.getCellVoltages(switches);
    const totalVoltage = this.calculateTotalVoltage(switches, cellVoltages);
    return Math.round(totalVoltage * 10) / 10;
  }

  static getCellVoltages(switches: boolean[]): number[] {
    const cellVoltages: number[] = [];
    
    for (let cell = 0; cell < 4; cell++) {
      const cellSwitches = switches.slice(cell * 3, (cell + 1) * 3);
      
      // If any switch in the cell is ON, cell is active with 4V
      if (cellSwitches.some(s => s)) {
        cellVoltages.push(4);
      } else {
        cellVoltages.push(0);
      }
    }
    
    return cellVoltages;
  }

  static calculateTotalVoltage(switches: boolean[], cellVoltages: number[]): number {
    const activeCells = cellVoltages.filter(v => v > 0);
    
    if (activeCells.length === 0) return 0;
    
    // Analyze switch patterns to determine series vs parallel configuration
    const connectionPattern = this.analyzeConnectionPattern(switches);
    
    switch (connectionPattern.type) {
      case 'series':
        return activeCells.length * 4;
      case 'parallel':
        return 4; // Parallel cells maintain 4V
      case 'series-parallel':
        return this.calculateMixedVoltage(switches, activeCells.length);
      default:
        return 0;
    }
  }

  static analyzeConnectionPattern(switches: boolean[]): { type: string; groups: number } {
    const activeCellCount = this.getActiveCellCount(switches);
    
    if (activeCellCount <= 1) {
      return { type: 'single', groups: activeCellCount };
    }
    
    // Simplified analysis - in reality this would be much more complex
    const consecutiveGroups = this.findConsecutiveActiveGroups(switches);
    
    if (consecutiveGroups.length === 1 && consecutiveGroups[0] === activeCellCount) {
      return { type: 'series', groups: 1 };
    } else if (activeCellCount > 1) {
      return { type: 'series-parallel', groups: consecutiveGroups.length };
    }
    
    return { type: 'disconnected', groups: 0 };
  }

  static calculateMixedVoltage(switches: boolean[], activeCells: number): number {
    // Simplified mixed configuration calculation
    // Real circuit analysis would use Kirchhoff's laws
    
    const maxSeriesVoltage = Math.min(activeCells * 4, 16);
    const switchDensity = switches.filter(Boolean).length / 12;
    
    // Apply reduction factor for complex configurations
    const complexityFactor = switchDensity > 0.5 ? 0.8 : 1;
    
    return Math.min(maxSeriesVoltage * complexityFactor, 16);
  }

  static findConsecutiveActiveGroups(switches: boolean[]): number[] {
    const groups: number[] = [];
    let currentGroup = 0;
    
    for (let cell = 0; cell < 4; cell++) {
      const cellSwitches = switches.slice(cell * 3, (cell + 1) * 3);
      const isActive = cellSwitches.some(s => s);
      
      if (isActive) {
        currentGroup++;
      } else if (currentGroup > 0) {
        groups.push(currentGroup);
        currentGroup = 0;
      }
    }
    
    if (currentGroup > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  }

  static getActiveCellCount(switches: boolean[]): number {
    let count = 0;
    for (let cell = 0; cell < 4; cell++) {
      const cellSwitches = switches.slice(cell * 3, (cell + 1) * 3);
      if (cellSwitches.some(s => s)) {
        count++;
      }
    }
    return count;
  }

  static getConnectionType(switches: boolean[], voltage: number): string {
    const activeCells = this.getActiveCellCount(switches);
    
    if (activeCells === 0) return "Disconnected";
    if (activeCells === 1) return "Single Cell";
    if (voltage === activeCells * 4) return "Series";
    if (voltage === 4 && activeCells > 1) return "Parallel";
    return "Mixed";
  }

  static getVoltageGroup(voltage: number): string {
    if (voltage === 0) return "Zero Output";
    if (voltage === 4) return "Single Cell";
    if (voltage === 8) return "Series/Parallel";
    if (voltage === 12) return "Triple Series";
    if (voltage === 16) return "Full Series";
    return `${voltage}V Configuration`;
  }

  static formatSwitchStates(switches: boolean[]): string {
    const groups = [];
    for (let i = 0; i < 4; i++) {
      const cellSwitches = switches.slice(i * 3, (i + 1) * 3);
      groups.push(cellSwitches.map(s => s ? '1' : '0').join(''));
    }
    return groups.join(' ');
  }

  static generateAllConfigurations(): CircuitConfig[] {
    const configs: CircuitConfig[] = [];
    
    // Generate all 2^12 = 4096 combinations
    for (let i = 0; i < 4096; i++) {
      const switches: boolean[] = [];
      for (let bit = 0; bit < 12; bit++) {
        switches.push((i & (1 << bit)) !== 0);
      }
      
      const voltage = this.calculateVoltage(switches);
      const activeCells = this.getActiveCellCount(switches);
      const connectionType = this.getConnectionType(switches, voltage);
      const voltageGroup = this.getVoltageGroup(voltage);
      
      configs.push({
        switches,
        voltage,
        activeCells,
        connectionType,
        voltageGroup
      });
    }
    
    return configs;
  }
}
