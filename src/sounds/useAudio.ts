import { useEffect, useRef, useCallback, useState } from "react";
import { Howl } from "howler";
import { ambientMusic, missSound, swishSound, throwSound } from "./audioData";

export function useAudio() {
  const [enabled, setEnabled] = useState(false);
  const musicRef = useRef<Howl | null>(null);
  const throwRef = useRef<Howl | null>(null);
  const swishRef = useRef<Howl | null>(null);
  const missRef = useRef<Howl | null>(null);

  useEffect(() => {
    musicRef.current = new Howl({
      src: [ambientMusic],
      html5: true,
      loop: true,
      volume: 0.16,
      preload: true,
    });

    throwRef.current = new Howl({
      src: [throwSound],
      volume: 0.55,
      preload: true,
    });

    swishRef.current = new Howl({
      src: [swishSound],
      volume: 0.7,
      preload: true,
    });

    missRef.current = new Howl({
      src: [missSound],
      volume: 0.45,
      preload: true,
    });

    return () => {
      musicRef.current?.unload();
      throwRef.current?.unload();
      swishRef.current?.unload();
      missRef.current?.unload();
    };
  }, []);

  const enable = useCallback(() => {
    setEnabled(true);
    if (Howler.ctx?.state === "suspended") {
      void Howler.ctx.resume();
    }
    if (!musicRef.current?.playing()) {
      musicRef.current?.play();
    }
  }, []);

  const disable = useCallback(() => {
    setEnabled(false);
    musicRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    if (enabled) {
      disable();
    } else {
      enable();
    }
  }, [enabled, disable, enable]);

  const playThrow = useCallback(() => {
    if (!enabled) return;
    throwRef.current?.rate(0.9 + Math.random() * 0.25);
    throwRef.current?.play();
  }, [enabled]);

  const playSwish = useCallback(() => {
    if (!enabled) return;
    swishRef.current?.play();
  }, [enabled]);

  const playMiss = useCallback(() => {
    if (!enabled) return;
    missRef.current?.play();
  }, [enabled]);

  return {
    enabled,
    enable,
    disable,
    toggle,
    playThrow,
    playSwish,
    playMiss,
  };
}
