// Subtle line-art animal motif SVGs for hero and empty states

export function CowMotif({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={`opacity-10 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Cow body */}
      <ellipse cx="60" cy="52" rx="30" ry="18" />
      {/* Head */}
      <ellipse cx="90" cy="38" rx="14" ry="12" />
      {/* Ears */}
      <path d="M82 30 L78 22 L86 26" />
      <path d="M98 30 L102 22 L94 26" />
      {/* Horns */}
      <path d="M82 28 Q76 18 72 20" />
      <path d="M98 28 Q104 18 108 20" />
      {/* Nose */}
      <ellipse cx="100" cy="44" rx="5" ry="3" />
      <circle cx="98" cy="44" r="0.8" fill="currentColor" />
      <circle cx="102" cy="44" r="0.8" fill="currentColor" />
      {/* Eye */}
      <circle cx="88" cy="36" r="2" />
      {/* Legs */}
      <line x1="40" y1="68" x2="40" y2="78" />
      <line x1="52" y1="70" x2="52" y2="79" />
      <line x1="66" y1="70" x2="66" y2="79" />
      <line x1="78" y1="68" x2="78" y2="78" />
      {/* Tail */}
      <path d="M30 52 Q18 46 20 38 Q22 32 28 36" />
      {/* Udder */}
      <path d="M48 68 Q56 74 66 70" />
      {/* Spots */}
      <ellipse cx="55" cy="48" rx="8" ry="5" strokeDasharray="2 2" />
    </svg>
  )
}

export function GoatMotif({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 80"
      className={`opacity-10 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Body */}
      <ellipse cx="50" cy="50" rx="24" ry="16" />
      {/* Head */}
      <ellipse cx="76" cy="36" rx="12" ry="10" />
      {/* Beard */}
      <path d="M74 46 Q72 52 70 54" />
      {/* Horns */}
      <path d="M70 28 Q66 18 68 14" />
      <path d="M82 28 Q86 18 84 14" />
      {/* Ear */}
      <path d="M68 32 L62 26 L70 28" />
      {/* Eye */}
      <circle cx="74" cy="34" r="1.5" />
      {/* Nose */}
      <ellipse cx="84" cy="40" rx="4" ry="2.5" />
      {/* Legs */}
      <line x1="34" y1="64" x2="34" y2="76" />
      <line x1="44" y1="65" x2="44" y2="76" />
      <line x1="56" y1="65" x2="56" y2="76" />
      <line x1="66" y1="64" x2="66" y2="76" />
      {/* Tail */}
      <path d="M26 48 Q16 44 18 36" />
    </svg>
  )
}

export function HenMotif({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={`opacity-10 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Body */}
      <ellipse cx="44" cy="52" rx="22" ry="18" />
      {/* Head */}
      <circle cx="66" cy="32" r="10" />
      {/* Comb */}
      <path d="M60 24 Q62 16 66 20 Q68 14 70 20 Q74 16 72 24" />
      {/* Wattle */}
      <path d="M64 40 Q60 46 62 50" />
      {/* Beak */}
      <path d="M74 32 L82 30 L74 35" />
      {/* Eye */}
      <circle cx="66" cy="30" r="2" />
      {/* Wing */}
      <path d="M28 44 Q36 36 52 42" />
      {/* Tail feathers */}
      <path d="M22 48 Q12 40 16 32" />
      <path d="M22 52 Q10 50 12 42" />
      {/* Legs */}
      <line x1="38" y1="68" x2="34" y2="78" />
      <line x1="38" y1="68" x2="38" y2="78" />
      <line x1="50" y1="68" x2="46" y2="78" />
      <line x1="50" y1="68" x2="50" y2="78" />
    </svg>
  )
}
