/**
 * Battery Circuit Solver - User's Test Cases Logic
 * 
 * At cell-: Check if cell has RC exit
 * - If RC exists: go through cell
 * - If no RC but RA bypass exists: bypass via RA
 * - Otherwise: try going through cell anyway (may exit via RB or RA from cell+)
 */

export class CircuitSolver {
  private readonly CELL_VOLTAGE = 4;

  calculateVoltage(switches: boolean[]): number {
    const result = this.analyzeCircuit(switches);
    return result.voltage;
  }

  getActiveCellCount(switches: boolean[]): number {
    const activeCells = this.getActiveCellsSet(switches);
    return activeCells.size;
  }

  getActiveCellsSet(switches: boolean[]): Set<number> {
    const result = this.analyzeCircuit(switches);
    return result.activeCells;
  }

  private analyzeCircuit(switches: boolean[]): { voltage: number; activeCells: Set<number> } {
    const [R1A, R1B, R1C, R2A, R2B, R2C, R3A, R3B, R3C, R4A, R4B, R4C] = switches;
    const activeCells = new Set<number>();

    if (!R4C) return { voltage: 0, activeCells };

    const pathsFound: Set<number>[] = [];

    const traverse = (location: string, visited: Set<string>, cellsInPath: Set<number>): boolean => {
      if (location === 'ES-') {
        pathsFound.push(new Set(cellsInPath));
        return true;
      }

      if (location !== 'RA' && location !== 'RB' && location !== 'ES+' && location !== 'ES-') {
        if (visited.has(location)) return false;
        visited.add(location);
      }

      let foundPath = false;

      if (location === 'ES+') {
        foundPath = traverse('RA', new Set(visited), new Set(cellsInPath)) || foundPath;
      }
      else if (location === 'RA') {
        if (R1A) foundPath = traverse('C1-', new Set(visited), new Set(cellsInPath)) || foundPath;
        if (R2A) foundPath = traverse('C2-', new Set(visited), new Set(cellsInPath)) || foundPath;
        if (R3A) foundPath = traverse('C3-', new Set(visited), new Set(cellsInPath)) || foundPath;
        if (R4A) foundPath = traverse('C4-', new Set(visited), new Set(cellsInPath)) || foundPath;
      }
      // At cell -, check for RC exit to determine bypass
      else if (location === 'C1-') {
        if (R1C) {
          // Has RC exit, go through cell only if path succeeds
          const newCells = new Set(cellsInPath);
          newCells.add(1);
          if (traverse('C1+', new Set(visited), newCells)) {
            foundPath = true;
          }
        } else if (R1A && !R1B) {
          // No RC, has RA bypass, no RB exit - bypass
          foundPath = traverse('RA', new Set(visited), new Set(cellsInPath)) || foundPath;
        } else {
          // No RC but has RB or forced through - try cell
          const newCells = new Set(cellsInPath);
          newCells.add(1);
          if (traverse('C1+', new Set(visited), newCells)) {
            foundPath = true;
          }
        }
      }
      else if (location === 'C2-') {
        if (R2C) {
          const newCells = new Set(cellsInPath);
          newCells.add(2);
          if (traverse('C2+', new Set(visited), newCells)) {
            foundPath = true;
          }
        } else if (R2A && !R2B) {
          foundPath = traverse('RA', new Set(visited), new Set(cellsInPath)) || foundPath;
        } else {
          const newCells = new Set(cellsInPath);
          newCells.add(2);
          if (traverse('C2+', new Set(visited), newCells)) {
            foundPath = true;
          }
        }
      }
      else if (location === 'C3-') {
        if (R3C) {
          const newCells = new Set(cellsInPath);
          newCells.add(3);
          if (traverse('C3+', new Set(visited), newCells)) {
            foundPath = true;
          }
        } else if (R3A && !R3B) {
          // TC1: No RC (R3C OFF), has RA bypass (R3A ON), no RB (R3B OFF) - bypass!
          foundPath = traverse('RA', new Set(visited), new Set(cellsInPath)) || foundPath;
        } else {
          const newCells = new Set(cellsInPath);
          newCells.add(3);
          if (traverse('C3+', new Set(visited), newCells)) {
            foundPath = true;
          }
        }
      }
      else if (location === 'C4-') {
        if (R4C) {
          const newCells = new Set(cellsInPath);
          newCells.add(4);
          if (traverse('C4+', new Set(visited), newCells)) {
            foundPath = true;
          }
        } else if (R4A && !R4B) {
          foundPath = traverse('RA', new Set(visited), new Set(cellsInPath)) || foundPath;
        } else {
          const newCells = new Set(cellsInPath);
          newCells.add(4);
          if (traverse('C4+', new Set(visited), newCells)) {
            foundPath = true;
          }
        }
      }
      // At cell +, try all exits
      else if (location === 'C1+') {
        // Try RC path first (keeps cell in path)
        if (R1C) {
          if (traverse('C2-', new Set(visited), new Set(cellsInPath))) {
            foundPath = true;
          }
        }
        // Try RB path (keeps cell in path)
        if (R1B) {
          if (traverse('RB', new Set(visited), new Set(cellsInPath))) {
            foundPath = true;
          }
        }
        // RA path only if no successful RC path (removes cell)
        if (R1A && !foundPath) {
          const pathWithoutCell = new Set(cellsInPath);
          pathWithoutCell.delete(1);
          if (traverse('RA', new Set(visited), pathWithoutCell)) {
            foundPath = true;
          }
        }
      }
      else if (location === 'C2+') {
        if (R2C) {
          if (traverse('C3-', new Set(visited), new Set(cellsInPath))) {
            foundPath = true;
          }
        }
        if (R2B) {
          if (traverse('RB', new Set(visited), new Set(cellsInPath))) {
            foundPath = true;
          }
        }
        if (R2A && !foundPath) {
          const pathWithoutCell = new Set(cellsInPath);
          pathWithoutCell.delete(2);
          if (traverse('RA', new Set(visited), pathWithoutCell)) {
            foundPath = true;
          }
        }
      }
      else if (location === 'C3+') {
        if (R3C) {
          if (traverse('C4-', new Set(visited), new Set(cellsInPath))) {
            foundPath = true;
          }
        }
        if (R3B) {
          if (traverse('RB', new Set(visited), new Set(cellsInPath))) {
            foundPath = true;
          }
        }
        if (R3A && !foundPath) {
          const pathWithoutCell = new Set(cellsInPath);
          pathWithoutCell.delete(3);
          if (traverse('RA', new Set(visited), pathWithoutCell)) {
            foundPath = true;
          }
        }
      }
      else if (location === 'C4+') {
        if (R4C) {
          if (traverse('ES-', new Set(visited), new Set(cellsInPath))) {
            foundPath = true;
          }
        }
        if (R4B) {
          if (traverse('RB', new Set(visited), new Set(cellsInPath))) {
            foundPath = true;
          }
        }
        if (R4A && !foundPath) {
          const pathWithoutCell = new Set(cellsInPath);
          pathWithoutCell.delete(4);
          if (traverse('RA', new Set(visited), pathWithoutCell)) {
            foundPath = true;
          }
        }
      }
      else if (location === 'RB') {
        if (R1B) foundPath = traverse('C1+', new Set(visited), new Set(cellsInPath)) || foundPath;
        if (R2B) foundPath = traverse('C2+', new Set(visited), new Set(cellsInPath)) || foundPath;
        if (R3B) foundPath = traverse('C3+', new Set(visited), new Set(cellsInPath)) || foundPath;
        if (R4B) foundPath = traverse('C4+', new Set(visited), new Set(cellsInPath)) || foundPath;
      }

      return foundPath;
    };

    traverse('ES+', new Set(), new Set());

    for (const pathCells of pathsFound) {
      pathCells.forEach(cell => activeCells.add(cell));
    }

    const voltage = activeCells.size * this.CELL_VOLTAGE;
    return { voltage, activeCells };
  }
}

export const circuitSolver = new CircuitSolver();
