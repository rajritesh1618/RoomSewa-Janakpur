import React from 'react';

/**
 * Janki Mandir + Mithila Lotus Logo
 * Represents Janakpur's iconic architectural heritage (Janaki Temple)
 * combined with sacred Mithila lotus & warm saffron/vermilion palette.
 */
export const JanakiMandirLogo: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 44
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-label="RoomSewa Janakpur Mithila Emblem"
  >
    <defs>
      {/* Saffron to Vermilion Radiant Gradient */}
      <linearGradient id="mithilaSaffronRed" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="35%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>

      {/* Gold Sandstone Gradient */}
      <linearGradient id="mithilaGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>

      {/* Mithila Parrot Green Gradient */}
      <linearGradient id="mithilaGreen" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
    </defs>

    {/* Outer Sacred Rounded Shield with Madhubani double-ring border */}
    <rect x="3" y="3" width="94" height="94" rx="22" fill="url(#mithilaSaffronRed)" />
    <rect
      x="6.5"
      y="6.5"
      width="87"
      height="87"
      rx="19"
      stroke="#fef08a"
      strokeWidth="1.5"
      strokeDasharray="4 2"
      fill="none"
      opacity="0.8"
    />

    {/* Janaki Mandir Spires & Central Dome (Chhatri) */}
    {/* Central Shikhara / Dome */}
    <path
      d="M50 14 C48 18 43 23 43 28 L57 28 C57 23 52 18 50 14 Z"
      fill="#fffbeb"
    />
    <circle cx="50" cy="13" r="2.5" fill="url(#mithilaGold)" />
    <line x1="50" y1="9" x2="50" y2="13" stroke="#fde047" strokeWidth="1.5" strokeLinecap="round" />

    {/* Left Sub-Dome */}
    <path
      d="M29 23 C28 26 24 29 24 33 L34 33 C34 29 30 26 29 23 Z"
      fill="#fffbeb"
      opacity="0.9"
    />
    <circle cx="29" cy="22" r="1.8" fill="url(#mithilaGold)" />

    {/* Right Sub-Dome */}
    <path
      d="M71 23 C70 26 66 29 66 33 L76 33 C76 29 72 26 71 23 Z"
      fill="#fffbeb"
      opacity="0.9"
    />
    <circle cx="71" cy="22" r="1.8" fill="url(#mithilaGold)" />

    {/* Temple Upper Cornice / Chhajja */}
    <path d="M19 33 L81 33 L77 36 L23 36 Z" fill="#fef3c7" />

    {/* Iconic Janaki Mandir Multi-foil Scalloped Arches */}
    {/* Central Grand Archway */}
    <path
      d="M32 68 L32 46 C32 40 37 36 41 39 C44 37 47 36 50 36 C53 36 56 37 59 39 C63 36 68 40 68 46 L68 68 Z"
      fill="#fffbeb"
    />
    {/* Inner Arched Portal / Sanctum */}
    <path
      d="M38 68 L38 49 C38 44 42 42 45 44 C47 43 50 42 50 42 C50 42 53 43 55 44 C58 42 62 44 62 49 L62 68 Z"
      fill="#7f1d1d"
      opacity="0.95"
    />

    {/* Sacred Mithila Lotus (Kamal) Bloom at Temple Base */}
    {/* Center Lotus Petal */}
    <path
      d="M50 56 C47 62 48 68 50 71 C52 68 53 62 50 56 Z"
      fill="#fde047"
    />
    {/* Left Petals */}
    <path
      d="M50 71 C44 69 40 64 42 59 C45 63 48 68 50 71 Z"
      fill="#fed7aa"
    />
    <path
      d="M50 71 C38 69 33 66 32 62 C37 63 44 68 50 71 Z"
      fill="#fde047"
    />
    {/* Right Petals */}
    <path
      d="M50 71 C56 69 60 64 58 59 C55 63 52 68 50 71 Z"
      fill="#fed7aa"
    />
    <path
      d="M50 71 C62 69 67 66 68 62 C63 63 56 68 50 71 Z"
      fill="#fde047"
    />

    {/* Lotus Pond Water Wave Base / Madhubani Hatching */}
    <path
      d="M20 76 C28 73 34 78 42 75 C50 72 56 77 64 74 C72 71 80 76 80 76"
      stroke="#fef08a"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M23 82 C31 79 37 84 45 81 C53 78 59 83 67 80 C74 78 77 82 77 82"
      stroke="#fef08a"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.75"
    />

    {/* Small Auspicious Sun Rays at Top Center */}
    <circle cx="50" cy="8" r="1.5" fill="#fef08a" />
    <circle cx="43" cy="10" r="1" fill="#fef08a" />
    <circle cx="57" cy="10" r="1" fill="#fef08a" />
  </svg>
);

/**
 * Traditional Mithila Aripan / Madhubani Geometric Border Strip
 * Used as subtle dividing accents along navbars, headers, card tops, and footers.
 */
export const MithilaBorderStrip: React.FC<{
  className?: string;
  variant?: 'saffron' | 'cream' | 'terracotta';
}> = ({ className = '', variant = 'saffron' }) => {
  const isCream = variant === 'cream';
  const isTerracotta = variant === 'terracotta';

  const strokeColor = isCream
    ? 'rgba(254, 240, 138, 0.45)'
    : isTerracotta
    ? 'rgba(180, 83, 9, 0.35)'
    : 'rgba(234, 88, 12, 0.35)';

  const dotColor = isCream
    ? '#fde047'
    : isTerracotta
    ? '#c2410c'
    : '#ea580c';

  return (
    <div
      className={`w-full overflow-hidden flex items-center justify-center select-none pointer-events-none py-1 ${className}`}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="12"
        viewBox="0 0 1200 12"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <pattern
          id={`mithila-strip-${variant}`}
          width="40"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          {/* Top & bottom parallel boundary lines (Mithila double-line rule) */}
          <line x1="0" y1="1" x2="40" y2="1" stroke={strokeColor} strokeWidth="1" />
          <line x1="0" y1="11" x2="40" y2="11" stroke={strokeColor} strokeWidth="1" />

          {/* Traditional chevron / diamond geometry */}
          <path
            d="M0 6 L10 1 L20 6 L10 11 Z M20 6 L30 1 L40 6 L30 11 Z"
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.8"
          />
          {/* Auspicious center bindu (dots) */}
          <circle cx="10" cy="6" r="1.4" fill={dotColor} />
          <circle cx="30" cy="6" r="1.4" fill={dotColor} />
        </pattern>
        <rect width="100%" height="12" fill={`url(#mithila-strip-${variant})`} />
      </svg>
    </div>
  );
};

/**
 * Mithila Sacred Lotus Icon (Kamal Motif)
 */
export const MithilaLotusIcon: React.FC<{
  className?: string;
  size?: number;
  color?: string;
}> = ({ className = '', size = 20, color = '#ea580c' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Central Upright Petal */}
    <path
      d="M12 3 C10.5 7 11 12 12 15 C13 12 13.5 7 12 3 Z"
      fill={color}
    />
    {/* Left Petal */}
    <path
      d="M12 15 C8.5 13 6 9.5 7 6.5 C9 9 11 12 12 15 Z"
      fill={color}
      opacity="0.85"
    />
    {/* Right Petal */}
    <path
      d="M12 15 C15.5 13 18 9.5 17 6.5 C15 9 13 12 12 15 Z"
      fill={color}
      opacity="0.85"
    />
    {/* Wide Left Base Petal */}
    <path
      d="M12 16 C6.5 15.5 3 13 4 10 C6 12 9 14.5 12 16 Z"
      fill={color}
      opacity="0.65"
    />
    {/* Wide Right Base Petal */}
    <path
      d="M12 16 C17.5 15.5 21 13 20 10 C18 12 15 14.5 12 16 Z"
      fill={color}
      opacity="0.65"
    />
    {/* Water Base Arc */}
    <path
      d="M6 19 C9 17.5 15 17.5 18 19"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.9"
    />
    <path
      d="M8 21.5 C10 20.5 14 20.5 16 21.5"
      stroke={color}
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

/**
 * Mithila Peacock (Mayur) Feather / Crown Icon
 * Symbol of royalty, auspicious beginnings, and Maithil cultural artistry.
 */
export const MithilaPeacockIcon: React.FC<{
  className?: string;
  size?: number;
}> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Outer Eye Feather */}
    <path
      d="M12 2 C8 6 6 11 12 17 C18 11 16 6 12 2 Z"
      fill="#15803d"
      opacity="0.9"
    />
    {/* Mid Feather Ring */}
    <path
      d="M12 5 C9.5 8 8 11 12 14.5 C16 11 14.5 8 12 5 Z"
      fill="#d97706"
    />
    {/* Center Peacock Eye */}
    <circle cx="12" cy="9.5" r="2.5" fill="#1e3a8a" />
    <circle cx="12" cy="9.5" r="1.2" fill="#38bdf8" />
    {/* Feather Shaft */}
    <line x1="12" y1="17" x2="12" y2="23" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Janaki Mandir Architectural Silhouette Watermark / Banner
 * Subtle backdrop vector with temple chhatris, arches, and domes.
 */
export const JanakiMandirSkyline: React.FC<{ className?: string }> = ({
  className = ''
}) => (
  <svg
    viewBox="0 0 800 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full pointer-events-none select-none ${className}`}
    preserveAspectRatio="xMidYMax meet"
    aria-hidden="true"
  >
    {/* Base line */}
    <line x1="0" y1="178" x2="800" y2="178" stroke="currentColor" strokeWidth="2" opacity="0.25" />

    {/* Distant domes silhouette (layer 1) */}
    <g opacity="0.12" fill="currentColor">
      {/* Central Grand Chhatri */}
      <path d="M400 30 C394 45 378 60 378 78 L422 78 C422 60 406 45 400 30 Z" />
      <circle cx="400" cy="26" r="4" />
      <rect x="375" y="78" width="50" height="100" rx="3" />

      {/* Flanking Tiered Spires Left */}
      <path d="M330 50 C326 62 312 74 312 88 L348 88 C348 74 334 62 330 50 Z" />
      <circle cx="330" cy="46" r="3" />
      <rect x="310" y="88" width="40" height="90" />

      <path d="M260 70 C256 80 246 90 246 102 L274 102 C274 90 264 80 260 70 Z" />
      <circle cx="260" cy="67" r="2.5" />
      <rect x="244" y="102" width="32" height="76" />

      <path d="M190 85 C187 93 178 101 178 111 L202 111 C202 101 193 93 190 85 Z" />
      <rect x="176" y="111" width="28" height="67" />

      <path d="M120 100 C117 106 110 114 110 122 L130 122 C130 114 123 106 120 100 Z" />
      <rect x="108" y="122" width="24" height="56" />

      {/* Flanking Tiered Spires Right */}
      <path d="M470 50 C466 62 452 74 452 88 L488 88 C488 74 474 62 470 50 Z" />
      <circle cx="470" cy="46" r="3" />
      <rect x="450" y="88" width="40" height="90" />

      <path d="M540 70 C536 80 526 90 526 102 L554 102 C554 90 544 80 540 70 Z" />
      <circle cx="540" cy="67" r="2.5" />
      <rect x="524" y="102" width="32" height="76" />

      <path d="M610 85 C607 93 598 101 598 111 L622 111 C622 101 613 93 610 85 Z" />
      <rect x="596" y="111" width="28" height="67" />

      <path d="M680 100 C677 106 670 114 670 122 L690 122 C690 114 683 106 680 100 Z" />
      <rect x="668" y="122" width="24" height="56" />
    </g>

    {/* Arched Porticos & Scalloped Arcades (layer 2) */}
    <g opacity="0.2" stroke="currentColor" strokeWidth="1.5" fill="none">
      {/* Central Grand Arch */}
      <path d="M380 178 L380 125 C380 112 388 106 394 110 C397 107 403 107 406 110 C412 106 420 112 420 125 L420 178" />

      {/* Flanking Arches */}
      <path d="M320 178 L320 135 C320 126 325 120 330 124 C335 120 340 126 340 135 L340 178" />
      <path d="M460 178 L460 135 C460 126 465 120 470 124 C475 120 480 126 480 135 L480 178" />

      <path d="M250 178 L250 145 C250 138 255 134 260 137 C265 134 270 138 270 145 L270 178" />
      <path d="M530 178 L530 145 C530 138 535 134 540 137 C545 134 550 138 550 145 L550 178" />
    </g>

    {/* Cornices & balustrades across facade */}
    <line x1="80" y1="150" x2="720" y2="150" stroke="currentColor" strokeWidth="1" opacity="0.18" />
    <line x1="220" y1="120" x2="580" y2="120" stroke="currentColor" strokeWidth="1" opacity="0.18" />
  </svg>
);
