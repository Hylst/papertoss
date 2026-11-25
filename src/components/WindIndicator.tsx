import { clamp } from "../utils/math";

const MAX_WIND = 5;

export function WindIndicator({ wind }: { wind: number }) {
  const strength = Math.abs(wind);
  const direction = wind >= 0 ? "droite" : "gauche";

  return (
    <div className="hud-panel min-w-[148px] px-3 py-2 text-slate-950 sm:min-w-[190px] sm:px-4 sm:py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-slate-500">Vent</p>
          <p className="text-sm font-black uppercase tracking-[0.16em]">{direction}</p>
        </div>
        <svg
          className="h-8 w-16 text-sky-700"
          viewBox="0 0 84 36"
          fill="none"
          style={{ transform: wind >= 0 ? "none" : "rotate(180deg)" }}
          aria-hidden="true"
        >
          <path d="M6 18h62" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="m58 7 18 11-18 11" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-900/10">
        <div
          className="h-full rounded-full bg-sky-600 transition-all duration-500"
          style={{ width: `${clamp((strength / MAX_WIND) * 100, 8, 100)}%` }}
        />
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500">{wind.toFixed(1)} m/s</p>
    </div>
  );
}
