type TrashCanState = "ready" | "aiming" | "flying" | "scored" | "missed";

export function TrashCan({ state }: { state: TrashCanState }) {
  const isScored = state === "scored";

  return (
    <svg className={isScored ? "trash-can trash-can-hit" : "trash-can"} viewBox="0 0 160 190" aria-hidden="true">
      <defs>
        <linearGradient id="canBody" x1="22" x2="136" y1="48" y2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f4f8fc" />
          <stop offset="0.45" stopColor="#9bb0c4" />
          <stop offset="1" stopColor="#4f6276" />
        </linearGradient>
        <linearGradient id="canInside" x1="28" x2="132" y1="18" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0b1220" />
          <stop offset="1" stopColor="#2d3d50" />
        </linearGradient>
        <linearGradient id="rimMetal" x1="30" x2="130" y1="36" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="canReflection" x1="36" x2="60" y1="48" y2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.36" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <filter id="canGlow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <ellipse cx="80" cy="46" rx="58" ry="24" fill="url(#canInside)" />
      <path d="M32 48h96l-13 119c-1 10-9 17-19 17H64c-10 0-18-7-19-17L32 48Z" fill="url(#canBody)" />
      <path d="M42 52h76l-10 102c-1 8-7 14-15 14H67c-8 0-14-6-15-14L42 52Z" fill="url(#canReflection)" />
      <ellipse cx="80" cy="48" rx="61" ry="25" fill="none" stroke="url(#rimMetal)" strokeWidth="7" />
      <ellipse cx="80" cy="49" rx="48" ry="16" fill="#172033" opacity="0.72" />

      <path d="M52 68h56M48 95h64M45 124h70M42 152h76" stroke="#eef6ff" strokeOpacity="0.3" strokeWidth="4" />
      <path d="M58 56v113M82 57v119M106 56v113" stroke="#1f2d3f" strokeOpacity="0.38" strokeWidth="4" />

      <path d="M38 43c12-15 72-19 91-1" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 44c-2-10 8-18 18-20M132 44c2-10-8-18-18-20" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
