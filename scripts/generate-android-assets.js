import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resDir = path.resolve(__dirname, '../android/app/src/main/res');

// Square/rounded icon SVG
const baseSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#f59e0b" />
      <stop offset="35%" stopColor="#ea580c" />
      <stop offset="100%" stopColor="#b91c1c" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fef08a" />
      <stop offset="50%" stopColor="#facc15" />
      <stop offset="100%" stopColor="#b45309" />
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect x="24" y="24" width="464" height="464" rx="92" stroke="#fef08a" stroke-width="6" stroke-dasharray="16 10" fill="none" opacity="0.85" />

  <!-- Janaki Mandir Grand Spire & Central Dome -->
  <line x1="256" y1="52" x2="256" y2="76" stroke="#fef08a" stroke-width="8" stroke-linecap="round" />
  <circle cx="256" cy="76" r="14" fill="url(#goldGrad)" />
  <path d="M256 82 C246 102 220 128 220 154 L292 154 C292 128 266 102 256 82 Z" fill="#fffdfa" />

  <!-- Left Sub-Dome -->
  <circle cx="150" cy="122" r="10" fill="url(#goldGrad)" />
  <path d="M150 128 C144 144 124 160 124 182 L176 182 C176 160 156 144 150 128 Z" fill="#fffdfa" opacity="0.95" />

  <!-- Right Sub-Dome -->
  <circle cx="362" cy="122" r="10" fill="url(#goldGrad)" />
  <path d="M362 128 C356 144 336 160 336 182 L388 182 C388 160 368 144 362 128 Z" fill="#fffdfa" opacity="0.95" />

  <!-- Temple Upper Cornice -->
  <path d="M96 182 L416 182 L396 200 L116 200 Z" fill="#fef3c7" />

  <!-- Grand Iconic Archway -->
  <path d="M164 350 L164 246 C164 218 190 198 210 214 C226 204 242 198 256 198 C270 198 286 204 302 214 C322 198 348 218 348 246 L348 350 Z" fill="#fffdfa" />

  <!-- Inner Sanctuary Portal -->
  <path d="M196 350 L196 260 C196 235 216 226 230 236 C240 231 256 226 256 226 C256 226 272 231 282 236 C296 226 316 235 316 260 L316 350 Z" fill="#7f1d1d" opacity="0.95" />

  <!-- Sacred Mithila Lotus (Kamal) -->
  <path d="M256 288 C240 318 246 348 256 364 C266 348 272 318 256 288 Z" fill="#fde047" />
  <path d="M256 364 C226 354 206 328 216 304 C231 324 246 348 256 364 Z" fill="#fed7aa" />
  <path d="M256 364 C196 354 170 338 166 320 C190 324 226 350 256 364 Z" fill="#fde047" />
  <path d="M256 364 C286 354 306 328 296 304 C281 324 266 348 256 364 Z" fill="#fed7aa" />
  <path d="M256 364 C316 354 342 338 346 320 C322 324 286 350 256 364 Z" fill="#fde047" />

  <!-- Traditional Madhubani Waves -->
  <path d="M102 390 C144 374 174 400 216 384 C256 368 286 394 326 378 C366 364 410 390 410 390" stroke="#fef08a" stroke-width="10" stroke-linecap="round" fill="none" />
  <path d="M118 420 C160 404 190 430 230 414 C270 398 300 424 340 408 C376 398 394 420 394 420" stroke="#fef08a" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.75" />
</svg>`;

// Round icon SVG
const roundSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradR" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#f59e0b" />
      <stop offset="35%" stopColor="#ea580c" />
      <stop offset="100%" stopColor="#b91c1c" />
    </linearGradient>
    <linearGradient id="goldGradR" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fef08a" />
      <stop offset="50%" stopColor="#facc15" />
      <stop offset="100%" stopColor="#b45309" />
    </linearGradient>
  </defs>

  <!-- Circular background -->
  <circle cx="256" cy="256" r="256" fill="url(#bgGradR)" />
  <circle cx="256" cy="256" r="236" stroke="#fef08a" stroke-width="6" stroke-dasharray="16 10" fill="none" opacity="0.85" />

  <g transform="translate(32, 28) scale(0.88)">
    <line x1="256" y1="52" x2="256" y2="76" stroke="#fef08a" stroke-width="8" stroke-linecap="round" />
    <circle cx="256" cy="76" r="14" fill="url(#goldGradR)" />
    <path d="M256 82 C246 102 220 128 220 154 L292 154 C292 128 266 102 256 82 Z" fill="#fffdfa" />

    <circle cx="150" cy="122" r="10" fill="url(#goldGradR)" />
    <path d="M150 128 C144 144 124 160 124 182 L176 182 C176 160 156 144 150 128 Z" fill="#fffdfa" opacity="0.95" />

    <circle cx="362" cy="122" r="10" fill="url(#goldGradR)" />
    <path d="M362 128 C356 144 336 160 336 182 L388 182 C388 160 368 144 362 128 Z" fill="#fffdfa" opacity="0.95" />

    <path d="M96 182 L416 182 L396 200 L116 200 Z" fill="#fef3c7" />

    <path d="M164 350 L164 246 C164 218 190 198 210 214 C226 204 242 198 256 198 C270 198 286 204 302 214 C322 198 348 218 348 246 L348 350 Z" fill="#fffdfa" />
    <path d="M196 350 L196 260 C196 235 216 226 230 236 C240 231 256 226 256 226 C256 226 272 231 282 236 C296 226 316 235 316 260 L316 350 Z" fill="#7f1d1d" opacity="0.95" />

    <path d="M256 288 C240 318 246 348 256 364 C266 348 272 318 256 288 Z" fill="#fde047" />
    <path d="M256 364 C226 354 206 328 216 304 C231 324 246 348 256 364 Z" fill="#fed7aa" />
    <path d="M256 364 C196 354 170 338 166 320 C190 324 226 350 256 364 Z" fill="#fde047" />
    <path d="M256 364 C286 354 306 328 296 304 C281 324 266 348 256 364 Z" fill="#fed7aa" />
    <path d="M256 364 C316 354 342 338 346 320 C322 324 286 350 256 364 Z" fill="#fde047" />

    <path d="M102 390 C144 374 174 400 216 384 C256 368 286 394 326 378 C366 364 410 390 410 390" stroke="#fef08a" stroke-width="10" stroke-linecap="round" fill="none" />
  </g>
</svg>`;

// Foreground icon for adaptive icons (centered emblem with transparent background)
const foregroundSvg = `<svg width="432" height="432" viewBox="0 0 432 432" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldGradF" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fef08a" />
      <stop offset="50%" stopColor="#facc15" />
      <stop offset="100%" stopColor="#b45309" />
    </linearGradient>
  </defs>

  <g transform="translate(86, 86) scale(0.50)">
    <line x1="256" y1="52" x2="256" y2="76" stroke="#fef08a" stroke-width="12" stroke-linecap="round" />
    <circle cx="256" cy="76" r="18" fill="url(#goldGradF)" />
    <path d="M256 82 C246 102 220 128 220 154 L292 154 C292 128 266 102 256 82 Z" fill="#fffdfa" />

    <circle cx="150" cy="122" r="14" fill="url(#goldGradF)" />
    <path d="M150 128 C144 144 124 160 124 182 L176 182 C176 160 156 144 150 128 Z" fill="#fffdfa" />

    <circle cx="362" cy="122" r="14" fill="url(#goldGradF)" />
    <path d="M362 128 C356 144 336 160 336 182 L388 182 C388 160 368 144 362 128 Z" fill="#fffdfa" />

    <path d="M96 182 L416 182 L396 200 L116 200 Z" fill="#fef3c7" />

    <path d="M164 350 L164 246 C164 218 190 198 210 214 C226 204 242 198 256 198 C270 198 286 204 302 214 C322 198 348 218 348 246 L348 350 Z" fill="#fffdfa" />
    <path d="M196 350 L196 260 C196 235 216 226 230 236 C240 231 256 226 256 226 C256 226 272 231 282 236 C296 226 316 235 316 260 L316 350 Z" fill="#7f1d1d" />

    <path d="M256 288 C240 318 246 348 256 364 C266 348 272 318 256 288 Z" fill="#fde047" />
    <path d="M256 364 C226 354 206 328 216 304 C231 324 246 348 256 364 Z" fill="#fed7aa" />
    <path d="M256 364 C196 354 170 338 166 320 C190 324 226 350 256 364 Z" fill="#fde047" />
    <path d="M256 364 C286 354 306 328 296 304 C281 324 266 348 256 364 Z" fill="#fed7aa" />
    <path d="M256 364 C316 354 342 338 346 320 C322 324 286 350 256 364 Z" fill="#fde047" />

    <path d="M102 390 C144 374 174 400 216 384 C256 368 286 394 326 378 C366 364 410 390 410 390" stroke="#fef08a" stroke-width="12" stroke-linecap="round" fill="none" />
  </g>
</svg>`;

// Function to generate full splash screen SVG for specific dimensions
function createSplashSvg(width, height) {
  const isPort = height >= width;
  const logoSize = Math.min(width, height) * (isPort ? 0.38 : 0.45);
  const cx = width / 2;
  const cy = height / 2 - (isPort ? 35 : 20);
  const textY = cy + logoSize / 2 + 35;
  const subY = textY + 28;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="splashBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#991b1b" />
        <stop offset="60%" stopColor="#7f1d1d" />
        <stop offset="100%" stopColor="#450a0a" />
      </linearGradient>
      <linearGradient id="sGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#facc15" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#splashBg)" />

    <!-- Centered Logo artwork -->
    <g transform="translate(${cx - logoSize/2}, ${cy - logoSize/2}) scale(${logoSize / 512})">
      <rect x="0" y="0" width="512" height="512" rx="100" fill="#991b1b" stroke="#fef08a" stroke-width="8" />
      <line x1="256" y1="52" x2="256" y2="76" stroke="#fef08a" stroke-width="10" stroke-linecap="round" />
      <circle cx="256" cy="76" r="16" fill="url(#sGold)" />
      <path d="M256 82 C246 102 220 128 220 154 L292 154 C292 128 266 102 256 82 Z" fill="#fffdfa" />
      <path d="M96 182 L416 182 L396 200 L116 200 Z" fill="#fef3c7" />
      <path d="M164 350 L164 246 C164 218 190 198 210 214 C226 204 242 198 256 198 C270 198 286 204 302 214 C322 198 348 218 348 246 L348 350 Z" fill="#fffdfa" />
      <path d="M196 350 L196 260 C196 235 216 226 230 236 C240 231 256 226 256 226 C256 226 272 231 282 236 C296 226 316 235 316 260 L316 350 Z" fill="#7f1d1d" />
      <path d="M256 288 C240 318 246 348 256 364 C266 348 272 318 256 288 Z" fill="#fde047" />
      <path d="M102 390 C144 374 174 400 216 384 C256 368 286 394 326 378 C366 364 410 390 410 390" stroke="#fef08a" stroke-width="12" stroke-linecap="round" fill="none" />
    </g>

    <!-- App Name typography -->
    <text x="${cx}" y="${textY}" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="${Math.max(20, Math.min(36, width * 0.065))}" fill="#fffdfa" text-anchor="middle" letter-spacing="1">
      RoomSewa Janakpur
    </text>
    <text x="${cx}" y="${subY}" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="${Math.max(12, Math.min(18, width * 0.035))}" fill="#fde047" text-anchor="middle" opacity="0.95">
      Mithila's Trusted Room &amp; Flat Finder
    </text>
  </svg>`;
}

async function generateAll() {
  console.log('Generating Android Mipmap Icons...');
  const mipmaps = [
    { folder: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { folder: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { folder: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { folder: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { folder: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
  ];

  for (const m of mipmaps) {
    const dir = path.join(resDir, m.folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // ic_launcher.png
    await sharp(Buffer.from(baseSvg))
      .resize(m.size, m.size)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // ic_launcher_round.png
    await sharp(Buffer.from(roundSvg))
      .resize(m.size, m.size)
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png
    await sharp(Buffer.from(foregroundSvg))
      .resize(m.fgSize, m.fgSize)
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`✓ Generated ${m.folder} icons (${m.size}px)`);
  }

  console.log('Generating Android Splash Screens...');
  const splashes = [
    { folder: 'drawable-port-mdpi', w: 320, h: 480 },
    { folder: 'drawable-port-hdpi', w: 480, h: 800 },
    { folder: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { folder: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { folder: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
    { folder: 'drawable-land-mdpi', w: 480, h: 320 },
    { folder: 'drawable-land-hdpi', w: 800, h: 480 },
    { folder: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { folder: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { folder: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
    { folder: 'drawable', w: 720, h: 1280 },
  ];

  for (const s of splashes) {
    const dir = path.join(resDir, s.folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const splashSvg = createSplashSvg(s.w, s.h);

    await sharp(Buffer.from(splashSvg))
      .resize(s.w, s.h)
      .png()
      .toFile(path.join(dir, 'splash.png'));

    console.log(`✓ Generated ${s.folder}/splash.png (${s.w}x${s.h})`);
  }

  console.log('All Android assets generated successfully!');
}

generateAll().catch(err => {
  console.error(err);
  process.exit(1);
});
