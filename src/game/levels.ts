import type { EnvironmentType, Level } from "../types/game";

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Stage stagiaire",
    distanceBase: 6,
    distanceVar: 3,
    windBase: 0.2,
    windVar: 1.0,
    scoreToUnlock: 0,
    environment: "office" as EnvironmentType,
  },
  {
    id: 2,
    name: "Open space",
    distanceBase: 9,
    distanceVar: 3.5,
    windBase: 0.6,
    windVar: 1.6,
    scoreToUnlock: 800,
    environment: "hallway" as EnvironmentType,
  },
  {
    id: 3,
    name: "Bureau exécutif",
    distanceBase: 12,
    distanceVar: 4,
    windBase: 1.0,
    windVar: 2.0,
    scoreToUnlock: 2000,
    environment: "garden" as EnvironmentType,
  },
  {
    id: 4,
    name: "Toit de l'immeuble",
    distanceBase: 15,
    distanceVar: 4.5,
    windBase: 1.6,
    windVar: 2.8,
    scoreToUnlock: 4000,
    environment: "rooftop" as EnvironmentType,
  },
  {
    id: 5,
    name: "Tour du patron",
    distanceBase: 19,
    distanceVar: 5,
    windBase: 2.2,
    windVar: 3.8,
    scoreToUnlock: 7000,
    environment: "warehouse" as EnvironmentType,
  },
];

export const ENVIRONMENT_COLORS: Record<EnvironmentType, { wall: string; wallAccent: string; floor: string; floorAccent: string; ambient: string; sky: string }> = {
  office: {
    wall: "#647b96",
    wallAccent: "#9fb0c2",
    floor: "#9b6841",
    floorAccent: "#e3caa1",
    ambient: "rgba(186, 230, 253, 0.2)",
    sky: "#647b96",
  },
  hallway: {
    wall: "#7c8594",
    wallAccent: "#b8bfc8",
    floor: "#8a7560",
    floorAccent: "#d4c4b0",
    ambient: "rgba(203, 213, 225, 0.25)",
    sky: "#94a3b8",
  },
  garden: {
    wall: "#5a7a5a",
    wallAccent: "#8aa88a",
    floor: "#6b8a4a",
    floorAccent: "#a8c888",
    ambient: "rgba(134, 239, 172, 0.15)",
    sky: "#87ceeb",
  },
  rooftop: {
    wall: "#5a6a7a",
    wallAccent: "#8a9aaa",
    floor: "#7a7a7a",
    floorAccent: "#b0b0b0",
    ambient: "rgba(147, 197, 253, 0.2)",
    sky: "#1e3a5f",
  },
  warehouse: {
    wall: "#6a5a4a",
    wallAccent: "#9a8a7a",
    floor: "#5a5048",
    floorAccent: "#8a8078",
    ambient: "rgba(217, 119, 6, 0.12)",
    sky: "#4a5568",
  },
};

export const getUnlockedLevels = (totalScore: number) =>
  LEVELS.filter((level) => level.scoreToUnlock <= totalScore);

export const getHighestUnlockedLevel = (totalScore: number) => {
  const unlocked = getUnlockedLevels(totalScore);
  return unlocked[unlocked.length - 1]?.id ?? 1;
};
