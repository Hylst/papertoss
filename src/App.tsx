import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { PaperBall } from "./components/PaperBall";
import { TrashCan } from "./components/TrashCan";
import { WindIndicator } from "./components/WindIndicator";
import { ENVIRONMENT_COLORS, LEVELS } from "./game/levels";
import {
  buildShotResult,
  checkHit,
  computeLaunchPhysics,
  createTargetDistance,
  createWind,
  detectCrossTarget,
  initialPaper,
  mapWorldToScreen,
  scoreThrow,
  updatePhysics,
} from "./game/physics";
import { useAudio } from "./sounds/useAudio";
import { useFullscreen } from "./hooks/useFullscreen";
import type { CameraAngle, CameraTransform, GameState, Gesture, Level, PaperRender, PhysicsState, ShotResult } from "./types/game";
import { clamp, meters } from "./utils/math";

const CREDIT = "Créé par Hylst - Geoffroy avec l'aide d'une IA";

const CAMERA_PRESETS: Record<CameraAngle, CameraTransform> = {
  ready: { perspective: 900, rotateX: 18, rotateY: 0, scale: 1, translateY: 0, translateX: 0 },
  aiming: { perspective: 800, rotateX: 22, rotateY: 0, scale: 1.02, translateY: 10, translateX: 0 },
  throw: { perspective: 600, rotateX: 28, rotateY: -3, scale: 1.08, translateY: 30, translateX: 0 },
  follow: { perspective: 500, rotateX: 35, rotateY: 2, scale: 1.15, translateY: 60, translateX: 0 },
  nearCan: { perspective: 350, rotateX: 45, rotateY: -8, scale: 1.25, translateY: 80, translateX: 0 },
  result: { perspective: 700, rotateX: 15, rotateY: 0, scale: 1, translateY: 0, translateX: 0 },
};

function lerpCamera(from: CameraTransform, to: CameraTransform, t: number): CameraTransform {
  return {
    perspective: from.perspective + (to.perspective - from.perspective) * t,
    rotateX: from.rotateX + (to.rotateX - from.rotateX) * t,
    rotateY: from.rotateY + (to.rotateY - from.rotateY) * t,
    scale: from.scale + (to.scale - from.scale) * t,
    translateY: from.translateY + (to.translateY - from.translateY) * t,
    translateX: from.translateX + (to.translateX - from.translateX) * t,
  };
}

function EnvironmentBackground({ environment }: { environment: string }) {
  const colors = ENVIRONMENT_COLORS[environment as keyof typeof ENVIRONMENT_COLORS] || ENVIRONMENT_COLORS.office;

  return (
    <>
      <div className="env-wall" style={{ background: `linear-gradient(180deg, ${colors.wall} 0%, ${colors.wallAccent} 100%)` }} />
      <div className="env-floor" style={{ background: `linear-gradient(180deg, ${colors.floorAccent} 0%, ${colors.floor} 100%)` }} />

      {environment === "office" && (
        <>
          <div className="env-object env-desk" />
          <div className="env-object env-chair" />
          <div className="env-object env-window" />
          <div className="env-object env-plant" />
          <div className="env-object env-bookshelf" />
        </>
      )}
      {environment === "rooftop" && (
        <>
          <div className="env-object env-sky" style={{ background: `linear-gradient(180deg, #1e3a5f 0%, #3d6a9f 60%, #f59e0b 100%)` }} />
          <div className="env-object env-railing" />
          <div className="env-object env-clouds" />
          <div className="env-object env-building" />
        </>
      )}
      {environment === "hallway" && (
        <>
          <div className="env-object env-door-left" />
          <div className="env-object env-door-right" />
          <div className="env-object env-painting" />
          <div className="env-object env-lamp" />
        </>
      )}
      {environment === "garden" && (
        <>
          <div className="env-object env-tree-left" />
          <div className="env-object env-tree-right" />
          <div className="env-object env-flowerbed" />
          <div className="env-object env-bush" />
        </>
      )}
      {environment === "warehouse" && (
        <>
          <div className="env-object env-crate-left" />
          <div className="env-object env-crate-right" />
          <div className="env-object env-shelf" />
          <div className="env-object env-pipe" />
        </>
      )}

      <div className="env-grid" />
      <div className="env-light" />
    </>
  );
}

function FloatingParticles({ gameState, wind }: { gameState: GameState; wind: number }) {
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 4,
      duration: 4 + Math.random() * 6,
    }));
  }, []);

  if (gameState === "ready") {
    return (
      <div className="env-particles" aria-hidden="true">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              animationDirection: wind >= 0 ? "normal" : "reverse",
            }}
          />
        ))}
      </div>
    );
  }
  return null;
}

function AimIndicator({ aimPreview, paperScreen }: { aimPreview: { endX: number; endY: number; power: number }; paperScreen: { x: number; y: number } }) {
  const points = useMemo(() => {
    const startX = paperScreen.x;
    const startY = paperScreen.y;
    const endX = aimPreview.endX;
    const endY = aimPreview.endY;
    const midX = (startX + endX) / 2;
    const midY = Math.min(startY, endY) - 40 - aimPreview.power * 0.8;
    return { startX, startY, endX, endY, midX, midY };
  }, [aimPreview, paperScreen]);

  return (
    <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="aimGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
        </linearGradient>
        <marker id="aimArrow" markerHeight="10" markerWidth="10" orient="auto" refX="8" refY="5">
          <path d="M0,0 L10,5 L0,10 Z" fill="#0ea5e9" />
        </marker>
        <filter id="aimGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <path
        d={`M ${points.startX} ${points.startY} Q ${points.midX} ${points.midY} ${points.endX} ${points.endY}`}
        fill="none"
        stroke="url(#aimGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="8 4"
        opacity="0.85"
        filter="url(#aimGlow)"
      />

      <circle cx={points.endX} cy={points.endY} r="6" fill="#0ea5e9" opacity="0.9">
        <animate attributeName="r" values="4;8;4" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1s" repeatCount="indefinite" />
      </circle>

      <circle cx={points.startX} cy={points.startY} r={12 + aimPreview.power * 0.2} fill="none" stroke="#bae6fd" strokeWidth="2" opacity="0.7">
        <animate attributeName="r" values={`${10 + aimPreview.power * 0.2};${16 + aimPreview.power * 0.2};${10 + aimPreview.power * 0.2}`} dur="0.8s" repeatCount="indefinite" />
      </circle>

      <text x={points.midX} y={points.midY - 12} textAnchor="middle" fill="#0ea5e9" fontSize="14" fontWeight="bold">
        {aimPreview.power}%
      </text>
    </svg>
  );
}

function ScorePopup({ score, x, y }: { score: number; x: number; y: number }) {
  return (
    <div className="score-popup" style={{ left: x, top: y }}>
      +{score}
    </div>
  );
}

export default function App() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const streakRef = useRef(0);
  const physicsRef = useRef<PhysicsState | null>(null);
  const cameraRef = useRef<CameraTransform>(CAMERA_PRESETS.ready);
  const cameraAnimRef = useRef<number | null>(null);

  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [gameState, setGameState] = useState<GameState>("ready");
  const [paper, setPaper] = useState<PaperRender>(initialPaper);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [trail, setTrail] = useState<PaperRender[]>([]);
  const [currentLevel, setCurrentLevel] = useState<Level>(LEVELS[0]);
  const [wind, setWind] = useState(() => createWind(LEVELS[0]));
  const [targetDistance, setTargetDistance] = useState(() => createTargetDistance(LEVELS[0], 0));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => {
    try {
      const value = Number(window.localStorage.getItem("papertoss-hylst-record"));
      return Number.isFinite(value) && value > 0 ? value : 0;
    } catch {
      return 0;
    }
  });
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("Glissez vers le haut pour lancer. Contrez le vent.");
  const [lastShot, setLastShot] = useState<ShotResult | null>(null);
  const [showLevelPanel, setShowLevelPanel] = useState(false);
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>("ready");
  const [currentCamera, setCurrentCamera] = useState<CameraTransform>(CAMERA_PRESETS.ready);
  const [scorePopup, setScorePopup] = useState<{ score: number; x: number; y: number } | null>(null);
  const [showSlowMotion, setShowSlowMotion] = useState(false);

  const audio = useAudio();
  const fullscreen = useFullscreen();

  const paperScreen = useMemo(() => mapWorldToScreen(paper, stageSize, targetDistance), [paper, stageSize, targetDistance]);
  const targetScreen = useMemo(() => mapWorldToScreen({ x: 0, y: 0.08, z: targetDistance }, stageSize, targetDistance), [stageSize, targetDistance]);

  const canWidth = Math.round(180 * targetScreen.scale);
  const paperSize = Math.round(64 * paperScreen.scale);
  const isActiveThrow = gameState === "flying";
  const liveDistance = isActiveThrow ? paper.z : lastShot?.distance ?? 0;
  const nextUnlockLevel = LEVELS.find((level) => level.scoreToUnlock > score);
  const progressToNext = nextUnlockLevel
    ? clamp(((score - (LEVELS[nextUnlockLevel.id - 2]?.scoreToUnlock ?? 0)) / (nextUnlockLevel.scoreToUnlock - (LEVELS[nextUnlockLevel.id - 2]?.scoreToUnlock ?? 0))) * 100, 0, 100)
    : 100;

  const animateCamera = (target: CameraAngle, duration = 600) => {
    if (cameraAnimRef.current !== null) cancelAnimationFrame(cameraAnimRef.current);

    const from = { ...cameraRef.current };
    const to = CAMERA_PRESETS[target];
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const interpolated = lerpCamera(from, to, eased);
      cameraRef.current = interpolated;
      setCurrentCamera(interpolated);

      if (progress < 1) {
        cameraAnimRef.current = requestAnimationFrame(animate);
      } else {
        cameraAnimRef.current = null;
        setCameraAngle(target);
      }
    };

    cameraAnimRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return undefined;

    const updateSize = () => setStageSize({ width: element.clientWidth, height: element.clientHeight });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
      if (cameraAnimRef.current !== null) cancelAnimationFrame(cameraAnimRef.current);
    };
  }, []);

  useEffect(() => {
    animateCamera(gameState === "ready" ? "ready" : cameraAngle, 800);
  }, [gameState === "ready"]);

  const stopAnimation = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const prepareNextRound = (level: Level, nextStreak: number) => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    stopAnimation();
    physicsRef.current = null;
    setGesture(null);
    setTrail([]);
    setPaper(initialPaper);
    setWind(createWind(level));
    setTargetDistance(createTargetDistance(level, nextStreak));
    setGameState("ready");
    setScorePopup(null);
    setShowSlowMotion(false);
    animateCamera("ready", 700);
    setMessage("Glissez vers le haut pour lancer. Contrez le vent.");
  };

  const scheduleNextRound = (level: Level, nextStreak: number) => {
    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => prepareNextRound(level, nextStreak), 2000);
  };

  const finishThrow = (result: ShotResult, finalPaper: PaperRender) => {
    stopAnimation();
    physicsRef.current = null;
    setPaper(finalPaper);
    setLastShot(result);

    animateCamera("result", 800);

    if (result.hit) {
      const earned = scoreThrow(streakRef.current + 1, result.lateral, result.height);
      const nextStreak = streakRef.current + 1;
      streakRef.current = nextStreak;
      setStreak(nextStreak);
      setBestStreak((current) => Math.max(current, nextStreak));
      setScore((current) => current + earned);
      setGameState("scored");
      setScorePopup({ score: earned, x: targetScreen.x, y: targetScreen.floorY - 100 });
      setMessage(`${result.note}. Série de ${nextStreak}. +${earned} pts`);
      audio.playSwish();
      scheduleNextRound(currentLevel, nextStreak);
      return;
    }

    streakRef.current = 0;
    setStreak(0);
    setGameState("missed");
    setShowSlowMotion(true);
    setMessage(`Raté : ${result.note}.`);
    audio.playMiss();
    scheduleNextRound(currentLevel, 0);
  };

  const animateThrow = (shotTargetDistance: number, shotWind: number) => {
    const frame = (now: number) => {
      const physics = physicsRef.current;
      if (!physics) return;

      const dt = clamp((now - lastFrameRef.current) / 1000, 0.008, 0.034);
      lastFrameRef.current = now;
      const previous = { ...physics };

      updatePhysics(physics, dt, shotWind);

      // Dynamic camera based on paper progress
      const progress = physics.z / shotTargetDistance;
      if (progress > 0.7 && cameraAngle !== "follow") {
        animateCamera("follow", 400);
      }

      const crossData = detectCrossTarget(physics, previous, shotTargetDistance);
      if (crossData) {
        physics.crossedTarget = true;
        physics.crossX = crossData.crossX;
        physics.crossY = crossData.crossY;
        physics.crossVy = crossData.crossVy;

        if (checkHit(physics.crossX, physics.crossY, physics.crossVy)) {
          animateCamera("nearCan", 300);
          const note = Math.abs(physics.crossX) < 0.22 ? "Panier net !" : "Sur le rebord !";
          finishThrow(
            { distance: shotTargetDistance, hit: true, note, lateral: physics.crossX, height: physics.crossY },
            {
              x: physics.crossX * 0.2,
              y: 0.45,
              z: shotTargetDistance,
              rotation: physics.rotation,
              time: physics.time,
              maxZ: physics.maxZ,
            },
          );
          return;
        }
      }

      const renderPaper = {
        x: physics.x,
        y: Math.max(physics.y, 0.08),
        z: physics.z,
        rotation: physics.rotation,
        time: physics.time,
        maxZ: physics.maxZ,
      };

      setPaper(renderPaper);
      setTrail((currentTrail) => [...currentTrail.slice(-11), renderPaper]);

      if (physics.y <= 0 || physics.time > 4.4 || physics.z > shotTargetDistance + 10) {
        finishThrow(buildShotResult(physics, shotTargetDistance), { ...renderPaper, y: 0.08 });
        return;
      }

      animationRef.current = requestAnimationFrame(frame);
    };

    lastFrameRef.current = performance.now();
    animationRef.current = requestAnimationFrame(frame);
  };

  const launchThrow = (finishedGesture: Gesture) => {
    const physics = computeLaunchPhysics(finishedGesture, stageSize.height);
    if (!physics) {
      setGameState("ready");
      setGesture(null);
      setMessage("Glissez plus haut pour lancer.");
      return;
    }

    physicsRef.current = physics;
    setAttempts((current) => current + 1);
    setTrail([]);
    setGameState("flying");
    setGesture(null);
    animateCamera("throw", 500);
    setMessage("Distance et dérive calculées en temps réel...");
    audio.playThrow();
    animateThrow(targetDistance, wind);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (gameState !== "ready") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top, t: performance.now() };
    setGesture({ start: point, current: point, points: [point] });
    setGameState("aiming");
    animateCamera("aiming", 300);
    setMessage("Relâchez pour lancer. Glissez latéralement pour compenser le vent.");
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (gameState !== "aiming") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top, t: performance.now() };
    setGesture((currentGesture) => (currentGesture ? { ...currentGesture, current: point, points: [...currentGesture.points.slice(-9), point] } : currentGesture));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (gameState !== "aiming" || !gesture) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top, t: performance.now() };
    launchThrow({ ...gesture, current: point, points: [...gesture.points, point] });
  };

  const handlePointerCancel = () => {
    if (gameState === "aiming") {
      setGameState("ready");
      setGesture(null);
      animateCamera("ready", 300);
      setMessage("Glissez vers le haut pour lancer. Contrez le vent.");
    }
  };

  useEffect(() => {
    try {
      window.localStorage.setItem("papertoss-hylst-record", String(bestStreak));
    } catch {
      // stockage plein ou bloque : le record reste en memoire
    }
  }, [bestStreak]);

  const resetGame = () => {
    streakRef.current = 0;
    setScore(0);
    setStreak(0);
    // le record local survit a la remise a zero de la partie
    setAttempts(0);
    setLastShot(null);
    setCurrentLevel(LEVELS[0]);
    prepareNextRound(LEVELS[0], 0);
  };

  const selectLevel = (level: Level) => {
    if (level.scoreToUnlock > score && level.id !== 1) return;
    setCurrentLevel(level);
    setShowLevelPanel(false);
    prepareNextRound(level, 0);
  };

  const aimPreview = useMemo(() => {
    if (!gesture) return null;
    const dragX = gesture.current.x - gesture.start.x;
    const upward = gesture.start.y - gesture.current.y;
    const length = clamp(Math.hypot(dragX, upward), 0, 260);
    const scale = length === 0 ? 0 : clamp(length / 260, 0.12, 1);
    return {
      endX: paperScreen.x + dragX * 0.58,
      endY: paperScreen.y - upward * 0.58,
      power: Math.round(scale * 100),
    };
  }, [gesture, paperScreen.x, paperScreen.y]);

  const cameraStyle: React.CSSProperties = {
    perspective: currentCamera.perspective,
    transformStyle: "preserve-3d",
  };

  const worldStyle: React.CSSProperties = {
    transform: `
      scale(${currentCamera.scale})
      rotateX(${currentCamera.rotateX}deg)
      rotateY(${currentCamera.rotateY}deg)
      translateY(${currentCamera.translateY}px)
      translateX(${currentCamera.translateX}px)
    `,
    transformStyle: "preserve-3d",
    transition: "transform 0.1s linear",
  };

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-slate-950">
      <section
        ref={stageRef}
        className={`game-stage relative min-h-screen cursor-grab overflow-hidden select-none ${gameState === "aiming" ? "cursor-grabbing" : ""}`}
        style={cameraStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        role="application"
        aria-label="Jeu Boule de Papier. Glissez vers le haut pour lancer la boule de papier dans la corbeille."
      >
        <div className="game-world" style={worldStyle}>
          <EnvironmentBackground environment={currentLevel.environment} />
          <FloatingParticles gameState={gameState} wind={wind} />

          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="wind-ribbon"
              style={{
                top: `${20 + item * 7}%`,
                left: `${6 + item * 16}%`,
                animationDuration: `${5.2 + item * 0.8}s`,
                animationDirection: wind >= 0 ? "normal" : "reverse",
                opacity: 0.15 + Math.abs(wind) * 0.03,
              }}
            />
          ))}
        </div>

        <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-2 p-3 sm:gap-3 sm:p-4 lg:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[62%] rounded-2xl bg-slate-950/55 px-3 py-2 text-white ring-1 ring-white/10 backdrop-blur-[2px] drop-shadow-lg sm:max-w-md sm:px-4 sm:py-3">
            <div className="flex items-center gap-3">
              <div className="level-badge">{currentLevel.id}</div>
              <div>
                <p className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-sky-200 sm:text-sm sm:tracking-[0.36em]">Boule de Papier</p>
                <h1 className="mt-0.5 text-2xl font-black tracking-[-0.06em] sm:text-5xl">{currentLevel.name}</h1>
              </div>
            </div>
            <p className="mt-2 hidden text-sm font-medium text-white/80 sm:block sm:text-base">{message}</p>
            {showSlowMotion && (
              <p className="mt-1 text-xs text-amber-300 animate-pulse">Slow motion...</p>
            )}
          </div>

          <div className="pointer-events-auto flex flex-wrap items-center gap-2 sm:items-start sm:gap-3 lg:justify-end">
            <WindIndicator wind={wind} />
            <div className="hud-panel hidden px-4 py-3 sm:block">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.24em] text-slate-500">Cible</p>
              <p className="text-2xl font-black tracking-tight">{meters(targetDistance)}</p>
            </div>
            <div className="hud-panel grid grid-cols-3 gap-2 px-2 py-2 text-center sm:gap-4 sm:px-4 sm:py-3">
              <div>
                <p className="text-[0.55rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:text-[0.65rem] sm:tracking-[0.2em]">Score</p>
                <p className="text-base font-black sm:text-xl">{score}</p>
              </div>
              <div>
                <p className="text-[0.55rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:text-[0.65rem] sm:tracking-[0.2em]">Série</p>
                <p className="text-base font-black sm:text-xl">{streak}</p>
              </div>
              <div>
                <p className="text-[0.55rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:text-[0.65rem] sm:tracking-[0.2em]">Record</p>
                <p className="text-base font-black sm:text-xl">{bestStreak}</p>
              </div>
            </div>
            <div className="flex flex-row flex-wrap gap-2 lg:flex-col">
              <button className="hud-button !px-2 !py-1 text-[0.65rem] sm:!px-3 sm:!py-2 sm:text-sm" type="button" onClick={() => setShowLevelPanel((show) => !show)}>
                Niveaux
              </button>
              <button className="hud-button !px-2 !py-1 text-[0.65rem] sm:!px-3 sm:!py-2 sm:text-sm" type="button" onClick={fullscreen.toggle}>
                {fullscreen.isFullscreen ? "Réduire" : "Plein écran"}
              </button>
            </div>
            <button className="hud-button !px-2 !py-1 text-[0.65rem] sm:!px-3 sm:!py-2 sm:text-sm" type="button" onClick={audio.toggle}>
              {audio.enabled ? "🔊" : "🔇"}
            </button>
            <button className="hud-button !px-2 !py-1 text-[0.65rem] sm:!px-3 sm:!py-2 sm:text-sm" type="button" onClick={resetGame}>
              Réinit.
            </button>
          </div>
        </header>

        {showLevelPanel && (
          <div className="level-panel">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-[0.2em]">Niveaux</h2>
              <button className="hud-button !px-3 !py-1" type="button" onClick={() => setShowLevelPanel(false)}>
                Fermer
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {LEVELS.map((level) => {
                const locked = level.scoreToUnlock > score && level.id !== 1;
                const active = level.id === currentLevel.id;
                return (
                  <button
                    key={level.id}
                    disabled={locked}
                    className={`level-button ${active ? "level-button-active" : ""} ${locked ? "level-button-locked" : ""}`}
                    type="button"
                    onClick={() => selectLevel(level)}
                  >
                    <span className="font-black">{level.name}</span>
                    <span className="text-xs opacity-80">{locked ? `Débloque à ${level.scoreToUnlock} pts` : `${meters(level.distanceBase)} - ${meters(level.distanceBase + level.distanceVar)}`}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span>Progression</span>
                <span>{Math.round(progressToNext)}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-900/10">
                <div className="h-full rounded-full bg-sky-600 transition-all duration-500" style={{ width: `${progressToNext}%` }} />
              </div>
            </div>
          </div>
        )}

        <div
          className="target-wrap"
          style={{
            width: canWidth,
            left: targetScreen.x,
            top: targetScreen.floorY - canWidth * 1.05,
          }}
        >
          <TrashCan state={gameState} />
          <div className="target-distance">{meters(targetDistance)}</div>
        </div>

        <div className="absolute inset-x-0 bottom-5 z-30 flex justify-center px-4">
          <div className="distance-readout">
            <span>Distance</span>
            <strong>{meters(liveDistance)}</strong>
            <span>Tentatives {attempts}</span>
            {lastShot ? <span className={lastShot.hit ? "text-green-400" : "text-red-400"}>{lastShot.note}</span> : null}
          </div>
        </div>

        {aimPreview && <AimIndicator aimPreview={aimPreview} paperScreen={paperScreen} />}

        {trail.map((trailPaper, index) => {
          const trailPoint = mapWorldToScreen(trailPaper, stageSize, targetDistance);
          const opacity = ((index + 1) / trail.length) * 0.4;
          return (
            <span
              key={`${trailPaper.time}-${index}`}
              className="paper-trail"
              style={{
                left: trailPoint.x,
                top: trailPoint.y,
                width: 14 * trailPoint.scale,
                height: 14 * trailPoint.scale,
                opacity,
              }}
            />
          );
        })}

        <div
          className={`paper-shadow ${gameState === "scored" ? "paper-shadow-score" : ""}`}
          style={{
            left: paperScreen.x,
            top: paperScreen.floorY + 4,
            width: paperSize * 1.15,
            height: paperSize * 0.3,
            opacity: clamp(0.45 - paper.y * 0.1, 0.05, 0.45),
          }}
        />

        <div
          className={`paper-ball-wrap ${gameState === "ready" ? "paper-idle" : ""} ${gameState === "missed" ? "paper-missed" : ""} ${gameState === "scored" ? "paper-scored" : ""}`}
          style={{
            left: paperScreen.x,
            top: paperScreen.y,
            width: paperSize,
            height: paperSize,
            transform: `translate(-50%, -50%) rotate(${paper.rotation + (isActiveThrow ? Math.sin(paper.time * 14) * 6 : 0)}deg) scale(${isActiveThrow ? 0.85 + paperScreen.scale * 0.15 : 1})`,
          }}
        >
          <PaperBall />
        </div>

        {scorePopup && (
          <ScorePopup score={scorePopup.score} x={scorePopup.x} y={scorePopup.y} />
        )}

        <div className="pointer-events-none absolute bottom-24 left-1/2 z-10 hidden -translate-x-1/2 text-center text-sm font-bold uppercase tracking-[0.22em] text-slate-500/70 sm:block">
          Glissez vers le haut. Compensez latéralement le vent.
        </div>

        <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 text-center text-[0.6rem] font-semibold uppercase tracking-widest text-slate-500/50">
          {CREDIT}
        </div>
      </section>
    </main>
  );
}
