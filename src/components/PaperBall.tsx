export function PaperBall() {
  return (
    <svg className="h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="paperGlow" cx="34%" cy="24%" r="72%">
          <stop stopColor="#ffffff" />
          <stop offset="0.58" stopColor="#e8edf2" />
          <stop offset="1" stopColor="#9ba6b1" />
        </radialGradient>
        <filter id="paperTexture">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" result="noise" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.55 0 0 0 0 0.58 0 0 0 0 0.62 0 0 0 0.18 0" in="noise" result="coloredNoise" />
          <feComposite in="SourceGraphic" in2="coloredNoise" operator="over" />
        </filter>
      </defs>
      <path
        d="M49 5c12 2 23 7 33 18 8 9 11 23 8 35-2 13-12 26-24 32-12 7-31 5-44-3C10 80 3 66 6 50 8 34 17 21 29 13 36 8 43 4 49 5Z"
        fill="url(#paperGlow)"
        filter="url(#paperTexture)"
      />
      <path d="m28 14 10 19-21 6M38 33l17-24 9 28M64 37l19-12-5 25M21 55l25-5-10 24M46 50l20 15-9 24M66 65l22-7-10 20" fill="none" stroke="#7b8796" strokeOpacity="0.44" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 41c11 2 21 1 30-5M38 79c14-10 24-15 39-17M55 14c-2 16 1 29 10 38" fill="none" stroke="#ffffff" strokeOpacity="0.72" strokeWidth="5" strokeLinecap="round" />
      <path d="M17 66c7 12 20 20 35 22" fill="none" stroke="#64748b" strokeOpacity="0.38" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
