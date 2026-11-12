import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PROJECTS_DIR = 'public/images/projects';

// Ensure base folder
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

async function processImage(inputPath, outputPath, { crop, width = 1200, height = 800, quality = 88 } = {}) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let pipeline = sharp(inputPath);
  if (crop) {
    pipeline = pipeline.extract(crop);
  }
  pipeline = pipeline.resize(width, height, { fit: 'cover', position: 'top' });
  await pipeline.webp({ quality }).toFile(outputPath);
  const stat = fs.statSync(outputPath);
  console.log(`Generated ${outputPath} (${width}x${height}, ${(stat.size / 1024).toFixed(1)} KB)`);
}

async function generateAll() {
  console.log('=== Starting Image Processing ===\n');

  // 1. Elder's Veil
  console.log('--- Elder\'s Veil ---');
  // Cover (3:2 1200x800) from elders-veil.png
  await processImage(
    'public/assets/projects/elders-veil/elders-veil.png',
    `${PROJECTS_DIR}/elders-veil/cover.webp`,
    {
      crop: { left: Math.round((1920 - 1560) / 2), top: 35, width: 1560, height: 1040 },
      width: 1200,
      height: 800
    }
  );
  // Gallery screenshots (1200x800)
  const evGallery = [
    { src: 'public/assets/projects/elders-veil/elders-veil.png', out: 'screenshot-01.webp', crop: { left: 0, top: 35, width: 1900, height: 1040 } },
    { src: 'public/assets/projects/elders-veil/2.png', out: 'screenshot-02.webp', crop: { left: 0, top: 35, width: 1900, height: 1040 } },
    { src: 'public/assets/projects/elders-veil/3.png', out: 'screenshot-03.webp', crop: { left: 0, top: 35, width: 1900, height: 1040 } },
    { src: 'public/assets/projects/elders-veil/5.png', out: 'screenshot-04.webp', crop: { left: 0, top: 35, width: 1900, height: 1040 } },
    { src: 'public/assets/projects/elders-veil/6.png', out: 'screenshot-05.webp', crop: { left: 0, top: 35, width: 1900, height: 1040 } },
    { src: 'public/assets/projects/elders-veil/7.png', out: 'screenshot-06.webp', crop: { left: 0, top: 35, width: 1900, height: 1040 } },
  ];
  for (const item of evGallery) {
    await processImage(item.src, `${PROJECTS_DIR}/elders-veil/${item.out}`, {
      crop: item.crop,
      width: 1200,
      height: 800
    });
  }

  // 2. Portfolio Manager
  console.log('\n--- Portfolio Manager ---');
  // Cover from cover image.png
  await processImage(
    'public/assets/projects/portfolio manager/cover image.png',
    `${PROJECTS_DIR}/portfolio-manager/cover.webp`,
    {
      crop: { left: Math.round((1920 - 1440) / 2), top: 116, width: 1440, height: 960 },
      width: 1200,
      height: 800
    }
  );
  // Gallery
  const pmGallery = [
    { src: 'public/assets/projects/portfolio manager/cover image.png', out: 'screenshot-01.webp' },
    { src: 'public/assets/projects/portfolio manager/Screenshot (149).png', out: 'screenshot-02.webp' },
    { src: 'public/assets/projects/portfolio manager/Screenshot (153).png', out: 'screenshot-03.webp' },
    { src: 'public/assets/projects/portfolio manager/Screenshot (154).png', out: 'screenshot-04.webp' },
    { src: 'public/assets/projects/portfolio manager/Screenshot (152).png', out: 'screenshot-05.webp' },
    { src: 'public/assets/projects/portfolio manager/Screenshot (151).png', out: 'screenshot-06.webp' },
    { src: 'public/assets/projects/portfolio manager/Screenshot (150).png', out: 'screenshot-07.webp' },
  ];
  for (const item of pmGallery) {
    await processImage(item.src, `${PROJECTS_DIR}/portfolio-manager/${item.out}`, {
      crop: { left: 0, top: 116, width: 1900, height: 960 },
      width: 1200,
      height: 800
    });
  }

  // 3. Kabbadi Pro
  console.log('\n--- Kabbadi Pro ---');
  // Cover
  await processImage(
    'public/assets/projects/kabbadi pro/cover image.png',
    `${PROJECTS_DIR}/kabbadi-pro/cover.webp`,
    {
      crop: { left: Math.round((1920 - 1485) / 2), top: 80, width: 1485, height: 990 },
      width: 1200,
      height: 800
    }
  );
  // Gallery
  const kpGallery = [
    { src: 'public/assets/projects/kabbadi pro/cover image.png', out: 'screenshot-01.webp' },
    { src: 'public/assets/projects/kabbadi pro/Screenshot (158).png', out: 'screenshot-02.webp' },
    { src: 'public/assets/projects/kabbadi pro/Screenshot (159).png', out: 'screenshot-03.webp' },
    { src: 'public/assets/projects/kabbadi pro/Screenshot (160).png', out: 'screenshot-04.webp' },
    { src: 'public/assets/projects/kabbadi pro/Screenshot (161).png', out: 'screenshot-05.webp' },
    { src: 'public/assets/projects/kabbadi pro/Screenshot (162).png', out: 'screenshot-06.webp' },
  ];
  for (const item of kpGallery) {
    await processImage(item.src, `${PROJECTS_DIR}/kabbadi-pro/${item.out}`, {
      crop: { left: 0, top: 80, width: 1900, height: 990 },
      width: 1200,
      height: 800
    });
  }

  // 4. Expense Tracker
  console.log('\n--- Expense Tracker ---');
  // Cover
  await processImage(
    'public/assets/projects/expense tracker/cover image.png',
    `${PROJECTS_DIR}/expense-tracker/cover.webp`,
    {
      crop: { left: Math.round((1920 - 1480) / 2), top: 90, width: 1480, height: 986 },
      width: 1200,
      height: 800
    }
  );
  // Gallery
  const etGallery = [
    { src: 'public/assets/projects/expense tracker/cover image.png', out: 'screenshot-01.webp' },
    { src: 'public/assets/projects/expense tracker/3.png', out: 'screenshot-02.webp' },
    { src: 'public/assets/projects/expense tracker/2.png', out: 'screenshot-03.webp' },
    { src: 'public/assets/projects/expense tracker/1.png', out: 'screenshot-04.webp' },
  ];
  for (const item of etGallery) {
    await processImage(item.src, `${PROJECTS_DIR}/expense-tracker/${item.out}`, {
      crop: { left: 0, top: 90, width: 1900, height: 986 },
      width: 1200,
      height: 800
    });
  }

  // 5. Music Player
  console.log('\n--- Music Player ---');
  await processImage(
    'public/assets/projects/music player/Screenshot (155).png',
    `${PROJECTS_DIR}/music-player/cover.webp`,
    {
      crop: { left: 160, top: 88, width: 1485, height: 990 },
      width: 1200,
      height: 800
    }
  );
  await processImage(
    'public/assets/projects/music player/Screenshot (155).png',
    `${PROJECTS_DIR}/music-player/screenshot-01.webp`,
    {
      crop: { left: 0, top: 88, width: 1900, height: 990 },
      width: 1200,
      height: 800
    }
  );

  // 6. Beyond the Circuit (Personal Portfolio)
  console.log('\n--- Beyond the Circuit ---');
  const btcDir = `${PROJECTS_DIR}/beyond-the-circuit`;
  if (!fs.existsSync(btcDir)) fs.mkdirSync(btcDir, { recursive: true });

  const converterDir = `${PROJECTS_DIR}/converter`;
  if (!fs.existsSync(converterDir)) fs.mkdirSync(converterDir, { recursive: true });

  // Composite og-image into 1200x800 3:2 canvas with seamless dark background
  const ogResized = await sharp('public/og-image.png')
    .resize(1100, 580, { fit: 'contain', background: { r: 5, g: 8, b: 15, alpha: 1 } })
    .toBuffer();

  const btcCoverSvg = `
    <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#05070d"/>
          <stop offset="50%" stop-color="#0a1020"/>
          <stop offset="100%" stop-color="#05070e"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#bgGrad)"/>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 242, 254, 0.05)" stroke-width="1"/>
      </pattern>
      <rect width="1200" height="800" fill="url(#grid)" />
      <!-- Outer Border -->
      <rect x="20" y="20" width="1160" height="760" rx="16" fill="none" stroke="rgba(0, 242, 254, 0.15)" stroke-width="1.5"/>
      <rect x="24" y="24" width="1152" height="752" rx="12" fill="none" stroke="rgba(120, 100, 255, 0.1)" stroke-width="1"/>
      <!-- Top banner label -->
      <g transform="translate(60, 60)">
        <rect width="190" height="32" rx="16" fill="rgba(0, 242, 254, 0.1)" stroke="#00f2fe" stroke-width="1"/>
        <text x="95" y="21" fill="#00f2fe" font-size="12" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle" letter-spacing="1.5">LIVE PORTFOLIO</text>
      </g>
      <!-- Bottom Tech Pills -->
      <g transform="translate(60, 720)">
        <rect x="0" y="0" width="100" height="28" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
        <text x="50" y="18" fill="#e2e8f0" font-size="12" font-family="system-ui" text-anchor="middle">React 19</text>
        <rect x="112" y="0" width="110" height="28" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
        <text x="167" y="18" fill="#e2e8f0" font-size="12" font-family="system-ui" text-anchor="middle">TypeScript</text>
        <rect x="234" y="0" width="80" height="28" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
        <text x="274" y="18" fill="#e2e8f0" font-size="12" font-family="system-ui" text-anchor="middle">Vite</text>
        <rect x="326" y="0" width="120" height="28" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
        <text x="386" y="18" fill="#e2e8f0" font-size="12" font-family="system-ui" text-anchor="middle">Framer Motion</text>
        <rect x="458" y="0" width="90" height="28" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
        <text x="503" y="18" fill="#e2e8f0" font-size="12" font-family="system-ui" text-anchor="middle">Firebase</text>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(btcCoverSvg))
    .composite([
      {
        input: ogResized,
        top: 110,
        left: 50
      }
    ])
    .webp({ quality: 90 })
    .toFile(`${PROJECTS_DIR}/beyond-the-circuit/cover.webp`);
  console.log(`Generated ${PROJECTS_DIR}/beyond-the-circuit/cover.webp (1200x800)`);

  const btcGallerySvg1 = `
    <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#04060c"/>
          <stop offset="100%" stop-color="#090f1d"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#bgGrad1)"/>
      <g transform="translate(100, 150)">
        <rect width="1000" height="500" rx="20" fill="#0d1424" stroke="rgba(0, 242, 254, 0.25)" stroke-width="2"/>
        <text x="50" y="80" fill="#ffffff" font-size="34" font-family="system-ui, sans-serif" font-weight="800">Beyond the Circuit</text>
        <text x="50" y="125" fill="#38bdf8" font-size="18" font-family="system-ui, sans-serif" font-weight="600">Dual Identity Architecture: Electronics Hardware &amp; Modern Software</text>
        <line x1="50" y1="160" x2="950" y2="160" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <g transform="translate(50, 200)">
          <rect width="420" height="220" rx="12" fill="rgba(6, 182, 212, 0.08)" stroke="rgba(6, 182, 212, 0.3)" stroke-width="1"/>
          <text x="30" y="45" fill="#22d3ee" font-size="20" font-family="monospace" font-weight="700">&lt;Hardware / ECE&gt;</text>
          <text x="30" y="85" fill="#94a3b8" font-size="15" font-family="system-ui">• Digital Circuits &amp; VLSI Verilog</text>
          <text x="30" y="120" fill="#94a3b8" font-size="15" font-family="system-ui">• Microcontrollers &amp; Embedded C</text>
          <text x="30" y="155" fill="#94a3b8" font-size="15" font-family="system-ui">• IoT &amp; Sensor Interfacing</text>
          <text x="30" y="190" fill="#94a3b8" font-size="15" font-family="system-ui">• Circuit Simulation &amp; Logic Design</text>
        </g>
        <g transform="translate(530, 200)">
          <rect width="420" height="220" rx="12" fill="rgba(168, 85, 247, 0.08)" stroke="rgba(168, 85, 247, 0.3)" stroke-width="1"/>
          <text x="30" y="45" fill="#c084fc" font-size="20" font-family="monospace" font-weight="700">&lt;Software / Web&gt;</text>
          <text x="30" y="85" fill="#94a3b8" font-size="15" font-family="system-ui">• React 19, TypeScript &amp; Vite</text>
          <text x="30" y="120" fill="#94a3b8" font-size="15" font-family="system-ui">• Node.js, Express &amp; PostgreSQL</text>
          <text x="30" y="155" fill="#94a3b8" font-size="15" font-family="system-ui">• Realtime Presence &amp; Firebase</text>
          <text x="30" y="190" fill="#94a3b8" font-size="15" font-family="system-ui">• Glassmorphic UI &amp; Framer Motion</text>
        </g>
      </g>
    </svg>
  `;
  await sharp(Buffer.from(btcGallerySvg1))
    .webp({ quality: 90 })
    .toFile(`${PROJECTS_DIR}/beyond-the-circuit/screenshot-01.webp`);
  console.log(`Generated ${PROJECTS_DIR}/beyond-the-circuit/screenshot-01.webp (1200x800)`);

  const btcGallerySvg2 = `
    <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#04060c"/>
          <stop offset="100%" stop-color="#080e1a"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#bgGrad2)"/>
      <g transform="translate(100, 140)">
        <rect width="1000" height="520" rx="20" fill="#0d1424" stroke="rgba(99, 102, 241, 0.3)" stroke-width="2"/>
        <text x="50" y="70" fill="#ffffff" font-size="30" font-family="system-ui, sans-serif" font-weight="800">Dynamic Content Architecture</text>
        <text x="50" y="110" fill="#818cf8" font-size="16" font-family="system-ui, sans-serif">Decoupled public/data/ JSON schema with TypeScript safety &amp; live analytics</text>
        <g transform="translate(50, 160)">
          <rect width="280" height="300" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"/>
          <text x="24" y="45" fill="#38bdf8" font-size="18" font-family="monospace" font-weight="700">JSON Schemas</text>
          <text x="24" y="90" fill="#cbd5e1" font-size="14" font-family="monospace">projects.json</text>
          <text x="24" y="125" fill="#cbd5e1" font-size="14" font-family="monospace">skills.json</text>
          <text x="24" y="160" fill="#cbd5e1" font-size="14" font-family="monospace">education.json</text>
          <text x="24" y="195" fill="#cbd5e1" font-size="14" font-family="monospace">experience.json</text>
          <text x="24" y="230" fill="#cbd5e1" font-size="14" font-family="monospace">certifications.json</text>
          <text x="24" y="265" fill="#cbd5e1" font-size="14" font-family="monospace">site.json &amp; seo.json</text>
        </g>
        <g transform="translate(360, 160)">
          <rect width="280" height="300" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"/>
          <text x="24" y="45" fill="#38bdf8" font-size="18" font-family="monospace" font-weight="700">Engine Features</text>
          <text x="24" y="90" fill="#cbd5e1" font-size="14" font-family="system-ui">• Realtime Presence</text>
          <text x="24" y="125" fill="#cbd5e1" font-size="14" font-family="system-ui">• Live Visitor Stats</text>
          <text x="24" y="160" fill="#cbd5e1" font-size="14" font-family="system-ui">• Telegram Alerts</text>
          <text x="24" y="195" fill="#cbd5e1" font-size="14" font-family="system-ui">• Contact Messaging</text>
          <text x="24" y="230" fill="#cbd5e1" font-size="14" font-family="system-ui">• Light/Dark Theming</text>
          <text x="24" y="265" fill="#cbd5e1" font-size="14" font-family="system-ui">• PWA &amp; Offline Ready</text>
        </g>
        <g transform="translate(670, 160)">
          <rect width="280" height="300" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"/>
          <text x="24" y="45" fill="#38bdf8" font-size="18" font-family="monospace" font-weight="700">Performance</text>
          <text x="24" y="90" fill="#cbd5e1" font-size="14" font-family="system-ui">• Rolldown / Vite 8 Build</text>
          <text x="24" y="125" fill="#cbd5e1" font-size="14" font-family="system-ui">• WebP Image Pipeline</text>
          <text x="24" y="160" fill="#cbd5e1" font-size="14" font-family="system-ui">• Zero Layout Shifts</text>
          <text x="24" y="195" fill="#cbd5e1" font-size="14" font-family="system-ui">• Lazy Loading</text>
          <text x="24" y="230" fill="#cbd5e1" font-size="14" font-family="system-ui">• Mobile Responsive</text>
          <text x="24" y="265" fill="#cbd5e1" font-size="14" font-family="system-ui">• Accessible Semantics</text>
        </g>
      </g>
    </svg>
  `;
  await sharp(Buffer.from(btcGallerySvg2))
    .webp({ quality: 90 })
    .toFile(`${PROJECTS_DIR}/beyond-the-circuit/screenshot-02.webp`);
  console.log(`Generated ${PROJECTS_DIR}/beyond-the-circuit/screenshot-02.webp (1200x800)`);

  // 7. Converter (Clean Branded Placeholder)
  console.log('\n--- Converter (Branded Placeholder) ---');
  const converterSvg = `
    <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cbg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#060913"/>
          <stop offset="50%" stop-color="#0a1224"/>
          <stop offset="100%" stop-color="#060913"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#cbg)"/>
      <pattern id="cgrid" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(56, 189, 248, 0.05)" stroke-width="1"/>
      </pattern>
      <rect width="1200" height="800" fill="url(#cgrid)"/>
      <!-- Outer Card -->
      <rect x="80" y="80" width="1040" height="640" rx="24" fill="#0c1428" stroke="rgba(56, 189, 248, 0.2)" stroke-width="1.5"/>
      <rect x="84" y="84" width="1032" height="632" rx="20" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      
      <!-- Top Distinction Badge -->
      <g transform="translate(130, 130)">
        <rect width="260" height="36" rx="18" fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" stroke-width="1.2"/>
        <circle cx="20" cy="18" r="5" fill="#f59e0b"/>
        <text x="36" y="23" fill="#fbbf24" font-size="12" font-family="system-ui" font-weight="700" letter-spacing="1">PROJECT IN DEVELOPMENT</text>
      </g>

      <!-- Main Title -->
      <text x="130" y="230" fill="#ffffff" font-size="44" font-family="system-ui, -apple-system, sans-serif" font-weight="800" letter-spacing="-0.5">Engineering Converter</text>
      <text x="130" y="275" fill="#94a3b8" font-size="20" font-family="system-ui, -apple-system, sans-serif">
        Digital Base &amp; Unit Conversion Suite for Electronics &amp; Computing
      </text>

      <!-- Conversion Cards Preview -->
      <g transform="translate(130, 330)">
        <!-- Card 1: Radix Conversion -->
        <rect width="290" height="220" rx="14" fill="#111c38" stroke="rgba(56, 189, 248, 0.25)" stroke-width="1"/>
        <text x="24" y="45" fill="#38bdf8" font-size="16" font-family="monospace" font-weight="700">01 // NUMBER BASES</text>
        <text x="24" y="85" fill="#e2e8f0" font-size="14" font-family="monospace">BIN: 1101 0110_2</text>
        <text x="24" y="115" fill="#e2e8f0" font-size="14" font-family="monospace">OCT: 326_8</text>
        <text x="24" y="145" fill="#e2e8f0" font-size="14" font-family="monospace">DEC: 214_10</text>
        <text x="24" y="175" fill="#38bdf8" font-size="14" font-family="monospace">HEX: 0xD6</text>
        <text x="24" y="202" fill="#64748b" font-size="11" font-family="system-ui">Two's Complement &amp; Signed</text>

        <!-- Card 2: ECE & Signal Units -->
        <g transform="translate(325, 0)">
          <rect width="290" height="220" rx="14" fill="#111c38" stroke="rgba(168, 85, 247, 0.25)" stroke-width="1"/>
          <text x="24" y="45" fill="#c084fc" font-size="16" font-family="monospace" font-weight="700">02 // SIGNAL &amp; ECE UNITS</text>
          <text x="24" y="85" fill="#e2e8f0" font-size="14" font-family="monospace">Freq: Hz ⇄ rad/s</text>
          <text x="24" y="115" fill="#e2e8f0" font-size="14" font-family="monospace">Power: dBm ⇄ Watts</text>
          <text x="24" y="145" fill="#e2e8f0" font-size="14" font-family="monospace">Impedance: Ω, pF, nH</text>
          <text x="24" y="175" fill="#c084fc" font-size="14" font-family="monospace">Wavelength: λ ⇄ f (c)</text>
          <text x="24" y="202" fill="#64748b" font-size="11" font-family="system-ui">RF &amp; Analog Calculations</text>
        </g>

        <!-- Card 3: Storage & Computing -->
        <g transform="translate(650, 0)">
          <rect width="290" height="220" rx="14" fill="#111c38" stroke="rgba(34, 197, 94, 0.25)" stroke-width="1"/>
          <text x="24" y="45" fill="#4ade80" font-size="16" font-family="monospace" font-weight="700">03 // STORAGE &amp; DATA</text>
          <text x="24" y="85" fill="#e2e8f0" font-size="14" font-family="monospace">Bits &amp; Bytes ⇄ KB/MB/GB</text>
          <text x="24" y="115" fill="#e2e8f0" font-size="14" font-family="monospace">Baud Rate &amp; Transfer</text>
          <text x="24" y="145" fill="#e2e8f0" font-size="14" font-family="monospace">Memory Addressing</text>
          <text x="24" y="175" fill="#4ade80" font-size="14" font-family="monospace">IEEE 754 Floating Pt</text>
          <text x="24" y="202" fill="#64748b" font-size="11" font-family="system-ui">Microcontroller Addressing</text>
        </g>
      </g>

      <!-- Bottom Tech Specs -->
      <g transform="translate(130, 640)">
        <text x="0" y="0" fill="#64748b" font-size="13" font-family="system-ui" font-weight="500">Tech Stack: HTML5 • CSS3 • JavaScript • Responsive Calculation Engine</text>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(converterSvg))
    .webp({ quality: 90 })
    .toFile(`${PROJECTS_DIR}/converter/cover.webp`);
  console.log(`Generated ${PROJECTS_DIR}/converter/cover.webp (1200x800)`);

  console.log('\n=== All Images Processed Successfully! ===\n');
}

generateAll().catch(err => {
  console.error('Error generating images:', err);
  process.exit(1);
});
