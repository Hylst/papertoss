export type GameState = "ready" | "aiming" | "flying" | "scored" | "missed";

export type StageSize = {
  width: number;
  height: number;
};

export type Point = {
  x: number;
  y: number;
  t: number;
};

export type Gesture = {
  start: Point;
  current: Point;
  points: Point[];
};

export type PaperRender = {
  x: number;
  y: number;
  z: number;
  rotation: number;
  time: number;
  maxZ: number;
};

export type PhysicsState = PaperRender & {
  vx: number;
  vy: number;
  vz: number;
  spin: number;
  crossedTarget: boolean;
  crossX: number;
  crossY: number;
  crossVy: number;
};

export type ShotResult = {
  distance: number;
  hit: boolean;
  note: string;
  lateral: number;
  height: number;
};

export type ScreenPoint = {
  x: number;
  y: number;
  scale: number;
  floorY: number;
};

export type Level = {
  id: number;
  name: string;
  distanceBase: number;
  distanceVar: number;
  windBase: number;
  windVar: number;
  scoreToUnlock: number;
  environment: EnvironmentType;
};

export type CameraAngle = "ready" | "aiming" | "throw" | "follow" | "nearCan" | "result";

export type CameraTransform = {
  perspective: number;
  rotateX: number;
  rotateY: number;
  scale: number;
  translateY: number;
  translateX: number;
};

export type EnvironmentType = "office" | "rooftop" | "hallway" | "garden" | "warehouse";

export type EnvironmentColors = {
  wall: string;
  wallAccent: string;
  floor: string;
  floorAccent: string;
  ambient: string;
  sky?: string;
};
