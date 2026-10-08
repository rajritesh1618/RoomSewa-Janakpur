import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicIconsDir = path.resolve(__dirname, '../public/assets/icons');
const resDir = path.resolve(__dirname, '../android/app/src/main/res');

if (!fs.existsSync(publicIconsDir)) {
  fs.mkdirSync(publicIconsDir, { recursive: true });
}

// Janaki Mandir SVG
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

  <line x1="256" y1="52" x2="256" y2="76" stroke="#fef08a" stroke-width="8" stroke-linecap="round" />
  <circle cx="256" cy="76" r="14" fill="url(#goldGrad)" />
  <path d="M256 82 C246 102 220 128 220 154 L292 154 C292 128 266 102 256 82 Z" fill="#fffdfa" />

  <circle cx="150" cy="122" r="10" fill="url(#goldGrad)" />
  <path d="M150 128 C144 144 124 160 124 182 L176 182 C176 160 156 144 150 128 Z" fill="#fffdfa" opacity="0.95" />

  <circle cx="362" cy="122" r="10" fill="url(#goldGrad)" />
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
</svg>`;

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

async function run() {
  console.log('Generating web icons...');
  const webSizes = [72, 96, 128, 144, 152, 192, 384, 512];
  for (const s of webSizes) {
    await sharp(Buffer.from(baseSvg))
      .resize(s, s)
      .png()
      .toFile(path.join(publicIconsDir, `icon-${s}x${s}.png`));
  }

  // Maskable icon
  await sharp(Buffer.from(baseSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicIconsDir, 'icon-maskable-512x512.png'));

  // Favicon
  await sharp(Buffer.from(baseSvg))
    .resize(64, 64)
    .png()
    .toFile(path.resolve(__dirname, '../public/favicon.ico'));

  console.log('Generating Android res mipmaps and splashes...');
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

    await sharp(Buffer.from(baseSvg))
      .resize(m.size, m.size)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    await sharp(Buffer.from(roundSvg))
      .resize(m.size, m.size)
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    await sharp(Buffer.from(baseSvg))
      .resize(m.fgSize, m.fgSize)
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));
  }

  console.log('All icons and resources successfully generated!');
}

run().catch(console.error);
