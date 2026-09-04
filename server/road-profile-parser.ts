import { TerrainType, terrainMetadata, RoadProfile, RoadSegment, SceneType } from "@shared/schema";

export class RoadProfileParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoadProfileParseError';
  }
}

export function parseRoadProfile(encoded: string, name: string, id: string, sceneType: SceneType = SceneType.HIGHWAY): RoadProfile {
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
      curveAngle: metadata.curveAngle,
      grade: metadata.grade,
      surface: metadata.surface,
      audioCue: metadata.audioCue,
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
    sceneType,
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
