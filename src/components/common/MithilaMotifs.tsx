import React from 'react';

export const JanakiMandirLogo: React.FC<{ className?: string; size?: number }> = ({ className = "w-10 h-10", size }) => {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id="navBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="40%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="navGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      <rect x="16" y="16" width="480" height="480" rx="100" fill="url(#navBgGrad)" />
      <rect x="36" y="36" width="440" height="440" rx="84" stroke="#fef08a" strokeWidth="6" strokeDasharray="16 10" fill="none" opacity="0.85" />

      {/* Janaki Mandir Top Kalash & Spire */}
      <line x1="256" y1="52" x2="256" y2="76" stroke="#fef08a" strokeWidth="8" strokeLinecap="round" />
      <circle cx="256" cy="76" r="14" fill="url(#navGoldGrad)" />
      <path d="M256 82 C246 102 220 128 220 154 L292 154 C292 128 266 102 256 82 Z" fill="#fffdfa" />

      {/* Domes */}
      <circle cx="150" cy="122" r="10" fill="url(#navGoldGrad)" />
      <path d="M150 128 C144 144 124 160 124 182 L176 182 C176 160 156 144 150 128 Z" fill="#fffdfa" opacity="0.95" />
      <circle cx="362" cy="122" r="10" fill="url(#navGoldGrad)" />
      <path d="M362 128 C356 144 336 160 336 182 L388 182 C388 160 368 144 362 128 Z" fill="#fffdfa" opacity="0.95" />

      <path d="M96 182 L416 182 L396 200 L116 200 Z" fill="#fef3c7" />

      {/* Main Arch */}
      <path d="M164 350 L164 246 C164 218 190 198 210 214 C226 204 242 198 256 198 C270 198 286 204 302 214 C322 198 348 218 348 246 L348 350 Z" fill="#fffdfa" />
      <path d="M196 350 L196 260 C196 235 216 226 230 236 C240 231 256 226 256 226 C256 226 272 231 282 236 C296 226 316 235 316 260 L316 350 Z" fill="#7f1d1d" opacity="0.95" />

      {/* Center Lotus */}
      <path d="M256 288 C240 318 246 348 256 364 C266 348 272 318 256 288 Z" fill="#fde047" />
      <path d="M256 364 C226 354 206 328 216 304 C231 324 246 348 256 364 Z" fill="#fed7aa" />
      <path d="M256 364 C196 354 170 338 166 320 C190 324 226 350 256 364 Z" fill="#fde047" />
      <path d="M256 364 C286 354 306 328 296 304 C281 324 266 348 256 364 Z" fill="#fed7aa" />
      <path d="M256 364 C316 354 342 338 346 320 C322 324 286 350 256 364 Z" fill="#fde047" />

      {/* Waves */}
      <path d="M102 390 C144 374 174 400 216 384 C256 368 286 394 326 378 C366 364 410 390 410 390" stroke="#fef08a" strokeWidth="10" strokeLinecap="round" fill="none" />
    </svg>
  );
};

export const MithilaBorderStrip: React.FC<{ className?: string }> = ({ className = "h-1.5 w-full" }) => {
  return (
    <div className={`w-full overflow-hidden flex bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 ${className}`}>
      <div className="w-full opacity-40 bg-[radial-gradient(#fde047_1px,transparent_1px)] [background-size:8px_8px]" />
    </div>
  );
};

export const MithilaLotusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 text-amber-500" }) => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3c-1.5 3-2 6-2 9s.5 6 2 9c1.5-3 2-6 2-9s-.5-6-2-9z" />
      <path d="M12 12c-3-2-6-2-9-1 2 2 5 4 9 4 4 0 7-2 9-4-3-1-6-1-9 1z" opacity="0.75" />
    </svg>
  );
};
