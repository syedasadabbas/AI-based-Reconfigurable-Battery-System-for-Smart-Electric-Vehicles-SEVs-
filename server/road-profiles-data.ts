import { SceneType } from "@shared/schema";

export const PREDEFINED_ROAD_PROFILES = [
  {
    id: 'city-commute',
    name: 'City Commute',
    encoded: '15P5T10P8T12P',
    description: 'Easy city driving with highway and turns',
    sceneType: SceneType.CITY,
  },
  {
    id: 'mountain-pass',
    name: 'Mountain Pass',
    encoded: '5P10D8H6E5D10P',
    description: 'Challenging mountain terrain with steep climbs',
    sceneType: SceneType.MOUNTAIN,
  },
  {
    id: 'highway-cruise',
    name: 'Highway Cruise',
    encoded: '50P20A15P',
    description: 'Long highway journey with minimal stops',
    sceneType: SceneType.HIGHWAY,
  },
  {
    id: 'off-road-adventure',
    name: 'Off-Road Adventure',
    encoded: '8R5H10R6D4R',
    description: 'Rough terrain with hills and unpaved roads',
    sceneType: SceneType.RURAL,
  },
  {
    id: 'extreme-challenge',
    name: 'Extreme Challenge',
    encoded: '5P8D10E6S8H5R10S',
    description: 'Maximum difficulty with steep inclines',
    sceneType: SceneType.MOUNTAIN,
  },
  {
    id: 'mixed-terrain',
    name: 'Mixed Terrain',
    encoded: '12A3D4V7H8T5R20P6S',
    description: 'Varied terrain with all road types',
    sceneType: SceneType.RURAL,
  },
  {
    id: 'gentle-hills',
    name: 'Gentle Hills',
    encoded: '10A5D10V8A6D8V',
    description: 'Rolling hills with moderate elevation changes',
    sceneType: SceneType.RURAL,
  },
  {
    id: 'urban-delivery',
    name: 'Urban Delivery',
    encoded: '3A2T4A3T5A4T6A',
    description: 'Stop-and-go city delivery route',
    sceneType: SceneType.URBAN,
  },
];
