import { TerrainType, terrainMetadata, RoadProfile, RoadSegment } from "@shared/schema";

export class RoadProfileParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoadProfileParseError';
  }
}

export function parseRoadProfile(encoded: string, name: string, id: string): RoadProfile {
  if (!encoded || encoded.trim().length === 0) {
    throw new RoadProfileParseError('Road profile cannot be empty');
  }

  const segments: RoadSegment[] = [];
  let currentIndex = 0;
  let totalDistance = 0;
  let totalVoltageWeighted = 0;

  while (currentIndex < encoded.length) {
    const distanceMatch = encoded.slice(currentIndex).match(/^(\d+)/);
    if (!distanceMatch) {
      throw new RoadProfileParseError(
        `Expected distance number at position ${currentIndex}, got '${encoded[currentIndex]}'`
      );
    }

    const distance = parseInt(distanceMatch[1], 10);
    currentIndex += distanceMatch[1].length;

    if (currentIndex >= encoded.length) {
      throw new RoadProfileParseError(
        `Expected terrain type after distance ${distance} at position ${currentIndex}`
      );
    }

    const terrainCode = encoded[currentIndex].toUpperCase();
    currentIndex++;

    if (!Object.values(TerrainType).includes(terrainCode as TerrainType)) {
      throw new RoadProfileParseError(
        `Invalid terrain type '${terrainCode}' at position ${currentIndex - 1}. Valid types: ${Object.values(TerrainType).join(', ')}`
      );
    }

    const terrainType = terrainCode as TerrainType;
    const metadata = terrainMetadata[terrainType];

    segments.push({
      distance,
      terrainType,
      requiredVoltage: metadata.requiredVoltage,
      terrainName: metadata.name,
      color: metadata.color,
      speedModifier: metadata.speedModifier,
    });

    totalDistance += distance;
    totalVoltageWeighted += distance * metadata.requiredVoltage;
  }

  if (segments.length === 0) {
    throw new RoadProfileParseError('No valid segments found in road profile');
  }

  const averageVoltage = totalVoltageWeighted / totalDistance;

  const difficulty = calculateDifficulty(segments, averageVoltage);

  return {
    id,
    name,
    encoded,
    segments,
    totalDistance,
    averageVoltage,
    difficulty,
  };
}

function calculateDifficulty(
  segments: RoadSegment[],
  averageVoltage: number
): 'Easy' | 'Medium' | 'Hard' | 'Extreme' {
  const maxVoltage = Math.max(...segments.map(s => s.requiredVoltage));
  const has16V = segments.some(s => s.requiredVoltage === 16);
  const has12VPlus = segments.some(s => s.requiredVoltage >= 12);

  if (has16V) {
    return 'Extreme';
  } else if (maxVoltage >= 12 && averageVoltage >= 10) {
    return 'Hard';
  } else if (maxVoltage >= 8 || averageVoltage >= 6) {
    return 'Medium';
  } else {
    return 'Easy';
  }
}

export function validateRoadProfile(encoded: string): { valid: boolean; error?: string } {
  try {
    parseRoadProfile(encoded, 'Test', 'test');
    return { valid: true };
  } catch (error) {
    if (error instanceof RoadProfileParseError) {
      return { valid: false, error: error.message };
    }
    return { valid: false, error: 'Unknown parsing error' };
  }
}

export const PREDEFINED_ROAD_PROFILES = [
  {
    id: 'city-commute',
    name: 'City Commute',
    encoded: '15P5T10P8T12P',
    description: 'Easy city driving with highway and turns',
  },
  {
    id: 'mountain-pass',
    name: 'Mountain Pass',
    encoded: '5P10D8H6E5D10P',
    description: 'Challenging mountain terrain with steep climbs',
  },
  {
    id: 'highway-cruise',
    name: 'Highway Cruise',
    encoded: '50P20A15P',
    description: 'Long highway journey with minimal stops',
  },
  {
    id: 'off-road-adventure',
    name: 'Off-Road Adventure',
    encoded: '8R5H10R6D4R',
    description: 'Rough terrain with hills and unpaved roads',
  },
  {
    id: 'extreme-challenge',
    name: 'Extreme Challenge',
    encoded: '5P8D10E6S8H5R10S',
    description: 'Maximum difficulty with steep inclines',
  },
  {
    id: 'mixed-terrain',
    name: 'Mixed Terrain',
    encoded: '12A3D4V7H8T5R20P6S',
    description: 'Varied terrain with all road types',
  },
  {
    id: 'gentle-hills',
    name: 'Gentle Hills',
    encoded: '10A5D10V8A6D8V',
    description: 'Rolling hills with moderate elevation changes',
  },
  {
    id: 'urban-delivery',
    name: 'Urban Delivery',
    encoded: '3A2T4A3T5A4T6A',
    description: 'Stop-and-go city delivery route',
  },
];
