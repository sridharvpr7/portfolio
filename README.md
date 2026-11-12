# Beyond the Circuit — Portfolio

A responsive, production-ready portfolio for an Electronics and Communication Engineering student who also builds software.

## Stack

- **React 19 + TypeScript** via Vite 8
- **Framer Motion** for animations
- **Firebase** (optional) — Google Sign-in + live viewer count via Realtime Database
- **Node.js + Neon PostgreSQL** (optional) — analytics, server-side Telegram webhook (Render web service mode)
- Content stored in `public/data/*.json` — no CMS, no build step needed to update text

---

## Quick Start

```powershell
# Install dependencies
npm install

# Start dev server (opens at http://localhost:5173)
npm run dev

# Production build → outputs to dist/
npm run build

# Preview the production build locally
npm run preview
```

---

## Deployment Options

### Option A — Static Site (Recommended for beginners)

Upload the `dist/` folder to any static host (Netlify, Vercel, Render Static Sites, GitHub Pages, Cloudflare Pages).

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Environment variables | See `.env.example` (only Firebase vars needed for sign-in / live count) |

Analytics and Telegram notifications are not available in static mode (they require the Node.js server).

### Option B — Render Web Service (Full features)

Runs `server.mjs`, which serves `dist/` and exposes API routes under `/api/`.

| Setting | Value |
|---------|-------|
| Environment | Node |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Environment variables | See `.env.example` (all vars) |

This enables:
- Visitor analytics via Neon PostgreSQL
- Telegram new-visitor notifications
- Server-side auth verification

---

## Firebase Setup (Optional)

Firebase enables **Google Sign-In** in the footer and a **live viewer counter** (Realtime Database presence).

The portfolio works fully without Firebase — these features are simply hidden when unconfigured.

### Steps

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project.
2. Enable **Authentication → Sign-in method → Google**.
3. Enable **Realtime Database → Create database** (start in locked mode).
4. Go to **Project Settings → General → Your apps → Add web app**.
5. Copy the `firebaseConfig` values into your `.env` file (see `.env.example`).
6. Apply the security rules from [`firebase-rules.md`](firebase-rules.md).

> **Note:** Firebase web config keys (API key, project ID, etc.) are safe to include in frontend bundles. Firebase Security Rules — not the API key — protect your data. Never put service account credentials, Telegram tokens, or database passwords in `.env` for the frontend.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values you need.

```powershell
Copy-Item .env.example .env
```

See comments inside `.env.example` for what each variable does and which deployment mode needs it.

---

## Content Editing

All portfolio content lives in `public/data/`. You can edit JSON files directly — no rebuild needed for static hosts (just re-deploy), and the dev server hot-reloads them automatically.

See [`CONTENT-EDITING.md`](CONTENT-EDITING.md) for a full field-by-field guide.

### Asset locations

| Asset | Where to put it |
|-------|----------------|
| Profile photo | `public/assets/profile/profile.jpg` |
| Resume PDF | `public/assets/resume/resume.pdf` |
| Project images | `public/assets/projects/<project-id>/` |
| Certificate images | `public/assets/certificates/` |

After adding your resume PDF, update `profile.json`:
```json
"resumeUrl": "/assets/resume/resume.pdf"
```

---

## Project Structure

```
portfolio/
├── public/
│   ├── data/           ← JSON content files (edit these)
│   ├── assets/         ← Images, PDFs, certificates
│   └── sitemap.xml
├── src/
│   ├── components/     ← React UI components
│   ├── firebase/       ← Firebase auth + presence hooks
│   ├── hooks/          ← Custom React hooks
│   ├── sections/       ← Page sections (Hero, About, Skills…)
│   └── services/       ← Content loader, analytics service
├── api/                ← Serverless API routes (Render web service mode)
├── server.mjs          ← Node.js server (Render web service mode)
├── firebase-rules.md   ← Firebase Realtime DB security rules
├── CONTENT-EDITING.md  ← Guide to editing JSON content
└── vite.config.ts
```

---

## What Needs Your Content

| Item | File / Location | Status |
|------|----------------|--------|
| Profile photo | `public/assets/profile/profile.jpg` | ⚠️ Add your photo |
| Resume PDF | `public/assets/resume/resume.pdf` | ⚠️ Add your resume |
| Project images | `public/assets/projects/*/` | ⚠️ Add per-project |
| Certificate images | `public/assets/certificates/` | ⚠️ Add your certs |
| Contact email | `public/data/contact.json` | ✏️ Edit |
| EmailJS keys | `.env` → `VITE_EMAILJS_*` | ⚠️ Configure |
| Firebase config | `.env` → `VITE_FIREBASE_*` | ⚠️ Optional |
| Neon DB URL | `.env` → `DATABASE_URL` | ⚠️ Optional (web service) |
| Telegram token | `.env` → `TELEGRAM_BOT_TOKEN` | ⚠️ Optional (web service) |

---

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm start` | Start Node.js web service (after build) |
| `npm run lint` | Run ESLint |

---

## License

Personal portfolio — all rights reserved. Code structure is MIT-compatible for reference, but the personal content (bio, projects, designs) belongs to the portfolio owner.
