import type { Level, PaperRender, PhysicsState, ScreenPoint, ShotResult } from "../types/game";
import { clamp, meters } from "../utils/math";

const GRAVITY = 9.8;
const WIND_ACCELERATION = 0.36;
const AIR_RESISTANCE = 0.12;
const CAN_RADIUS = 0.78;
const CAN_MIN_HEIGHT = 0.28;
const CAN_MAX_HEIGHT = 2.25;
const SPIN_DRIFT = 0.08;

export const initialPaper: PaperRender = {
  x: 0,
  y: 0.45,
  z: 0,
  rotation: -10,
  time: 0,
  maxZ: 0,
};

export const createWind = (level: Level) => {
  const raw = level.windBase + (Math.random() * 2 - 1) * level.windVar;
  const rounded = Number(raw.toFixed(1));
  if (Math.abs(rounded) >= 0.3) return rounded;
  return rounded < 0 ? -0.4 : 0.4;
};

export const createTargetDistance = (level: Level, streak: number) => {
  const streakBonus = Math.min(streak, 8) * 0.25;
  return Number((level.distanceBase + Math.random() * level.distanceVar + streakBonus).toFixed(1));
};

export const mapWorldToScreen = (
  paper: Pick<PaperRender, "x" | "y" | "z">,
  size: { width: number; height: number },
  targetDistance: number,
): ScreenPoint => {
  const width = size.width || 1000;
  const height = size.height || 700;
  const isMobile = width < 640;
  const floorStart = height - (isMobile ? 86 : 106);
  const floorTarget = Math.max(118, height * (isMobile ? 0.34 : 0.3));
  const progress = clamp(paper.z / (targetDistance + 1.2), 0, 1.18);
  const floorY = floorStart + (floorTarget - floorStart) * progress;
  const scale = clamp(1 - progress * 0.55, 0.36, 1);

  return {
    x: width / 2 + paper.x * 72 * scale,
    y: floorY - paper.y * 70 * scale,
    scale,
    floorY,
  };
};

export const buildShotResult = (physics: PhysicsState, targetDistance: number): ShotResult => {
  const distance = Math.max(0, physics.z);

  if (!physics.crossedTarget) {
    return { distance, hit: false, note: `${meters(targetDistance - physics.maxZ)} avant`, lateral: physics.x, height: physics.y };
  }

  if (physics.crossY > CAN_MAX_HEIGHT) {
    return { distance, hit: false, note: "trop haut au-dessus de la corbeille", lateral: physics.crossX, height: physics.crossY };
  }

  if (physics.crossY < CAN_MIN_HEIGHT) {
    return { distance, hit: false, note: "trop bas dans la corbeille", lateral: physics.crossX, height: physics.crossY };
  }

  const side = physics.crossX > 0 ? "droite" : "gauche";
  return { distance, hit: false, note: `${meters(Math.abs(physics.crossX))} à ${side}`, lateral: physics.crossX, height: physics.crossY };
};

export const checkHit = (crossX: number, crossY: number, crossVy: number) => {
  const insideRim = Math.abs(crossX) <= CAN_RADIUS;
  const goodHeight = crossY >= CAN_MIN_HEIGHT && crossY <= CAN_MAX_HEIGHT;
  const softEnough = crossVy < 2.8;
  return insideRim && goodHeight && softEnough;
};

export const scoreThrow = (streak: number, lateral: number, height: number) => {
  const centerBonus = Math.max(0, 42 - Math.round(Math.abs(lateral) * 38));
  const heightBonus = Math.max(0, 28 - Math.round(Math.abs(height - 1.05) * 24));
  return 100 + streak * 25 + centerBonus + heightBonus;
};

export const computeLaunchPhysics = (gesture: {
  start: { x: number; y: number };
  points: { x: number; y: number; t: number }[];
  current: { x: number; y: number };
}, stageHeight: number): PhysicsState | null => {
  const points = gesture.points;
  const latest = points[points.length - 1];
  const recent = [...points].reverse().find((point) => latest.t - point.t > 45) ?? { x: gesture.start.x, y: gesture.start.y, t: latest.t - 50 };
  const timeDelta = Math.max(latest.t - recent.t, 16);
  const dragX = latest.x - gesture.start.x;
  const upward = gesture.start.y - latest.y;

  if (upward < 34) return null;

  const flickX = (latest.x - recent.x) / timeDelta;
  const flickUp = (recent.y - latest.y) / timeDelta;
  const distancePower = upward / Math.max(150, stageHeight * 0.24);
  const speedPower = Math.max(0, flickUp) * 0.32;
  const power = clamp(distancePower + speedPower, 0.26, 1.35);
  const lateralVelocity = clamp(dragX / 110 + flickX * 0.75, -4.5, 4.5);

  return {
    ...initialPaper,
    vx: lateralVelocity,
    vy: 3.8 + power * 2.08,
    vz: 8.35 + power * 5.55,
    spin: clamp(420 + Math.abs(lateralVelocity) * 140 + power * 360, 440, 1120) * (dragX >= 0 ? 1 : -1),
    crossedTarget: false,
    crossX: 0,
    crossY: 0,
    crossVy: 0,
  };
};

export const updatePhysics = (physics: PhysicsState, dt: number, wind: number) => {
  physics.time += dt;

  // Air resistance (proportional to velocity squared)
  const speed = Math.sqrt(physics.vx ** 2 + physics.vy ** 2 + physics.vz ** 2);
  const dragX = -physics.vx * AIR_RESISTANCE * speed * dt;
  const dragY = -physics.vy * AIR_RESISTANCE * speed * 0.5 * dt;
  const dragZ = -physics.vz * AIR_RESISTANCE * speed * 0.3 * dt;

  // Wind effect
  physics.vx += wind * WIND_ACCELERATION * dt;

  // Spin causes slight drift (Magnus-like effect)
  physics.vx += (physics.spin > 0 ? 1 : -1) * SPIN_DRIFT * Math.abs(physics.spin) * 0.001 * dt;

  // Apply drag
  physics.vx += dragX;
  physics.vy += dragY;
  physics.vz += dragZ;

  // Gravity
  physics.vy -= GRAVITY * dt;

  // Update positions
  physics.x += physics.vx * dt;
  physics.y += physics.vy * dt;
  physics.z += physics.vz * dt;

  // Spin decay
  physics.spin *= (1 - 0.02 * dt);

  physics.rotation += physics.spin * dt;
  physics.maxZ = Math.max(physics.maxZ, physics.z);
  return physics;
};

export const detectCrossTarget = (physics: PhysicsState, previous: PhysicsState, targetDistance: number): { crossed: boolean; crossX: number; crossY: number; crossVy: number } | null => {
  if (previous.z < targetDistance && physics.z >= targetDistance) {
    const crossAmount = (targetDistance - previous.z) / Math.max(physics.z - previous.z, 0.001);
    return {
      crossed: true,
      crossX: previous.x + (physics.x - previous.x) * crossAmount,
      crossY: previous.y + (physics.y - previous.y) * crossAmount,
      crossVy: previous.vy + (physics.vy - previous.vy) * crossAmount,
    };
  }
  return null;
};
