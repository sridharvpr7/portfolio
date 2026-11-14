# Beyond the Circuit — Personal Engineering Portfolio

[![Production Website](https://img.shields.io/badge/Production%20Website-Live-brightgreen)](https://sridharvpr-portfolio.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6.svg)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff.svg)](https://vitejs.dev)
[![Render](https://img.shields.io/badge/Render-Web%20Service-46E3B7.svg)](https://render.com)

**Beyond the Circuit** is a cinematic personal engineering portfolio for **Sridhar Vpr** — an **Electronics & Communication Engineering (ECE)** student at J.N.N. Institute of Engineering and **Full-Stack Web Developer**. 

> *"Bridging the World of Circuits and Code"*

The portfolio unifies two technical worlds: low-level silicon hardware architectures (Digital Logic, VLSI, Verilog HDL, RTL Design, Embedded Systems) and modern software development (React 19, TypeScript, Node.js, Express, PostgreSQL, Firebase).

---

## 🌐 Live Deployments & Routes

- **Production Portfolio:** [https://sridharvpr-portfolio.onrender.com](https://sridharvpr-portfolio.onrender.com)
- **Interactive HTML Resume:** [https://sridharvpr-portfolio.onrender.com/resume](https://sridharvpr-portfolio.onrender.com/resume)
- **Direct PDF Download:** `/assets/resume/resume.pdf`
- **GitHub Profile:** [https://github.com/sridharvpr7](https://github.com/sridharvpr7)
- **LinkedIn Profile:** [https://linkedin.com/in/sridhar-manivannan-468ba035b](https://linkedin.com/in/sridhar-manivannan-468ba035b)

---

## ⚡ Main Features

### 1. Dedicated ECE Engineering Experience
- **Interactive Digital Logic Simulator:** Live interactive gate simulator (AND, OR, NOT, NAND, NOR, XOR, XNOR) with dynamic IEEE logic gate symbols, interactive inputs (A, B), and mathematically calculated outputs.
- **Dynamic Truth Table:** Live row highlighting reflecting the current logic gate state.
- **Radix & Number Systems Converter:** Real-time conversion across Decimal (Base 10), Binary (Base 2), Hexadecimal (Base 16), and 8-bit Two's Complement.
- **VLSI Digital IC Design Flow:** Step-by-step interactive ASIC/FPGA digital synthesis workflow (Spec → RTL Modeling → Verification → Logic Synthesis → Physical Design & Tapeout).
- **Verilog HDL Hardware Descriptions:** Genuine educational RTL modules with syntax highlighting (2-to-1 Multiplexer, 1-bit Full Adder, D Flip-Flop with asynchronous reset, 4-bit Synchronous Up-Counter, and Finite State Machine).
- **Embedded Protocols:** Technical breakdown of UART, SPI, and I2C serial protocols.
- **Applied ECE Project Showcase:** Academic simulation modules and engineering tools.

### 2. Interactive JSON-Driven HTML Resume (`/resume`)
- Dynamically rendered from `public/data/resume.json`.
- Clean editorial ATS-friendly layout on a light paper surface with dark typography and blue accents.
- Dedicated action toolbar with **Back to Portfolio**, **Print / Save as PDF**, and explicit **Download Resume (PDF)**.
- Full respect for browser print stylesheets (`@media print`) and zero automatic downloads upon opening the page.
- Direct PDF downloads link to `/assets/resume/resume.pdf` for seamless replacement.

### 3. "Beyond the Circuit AI" Portfolio Assistant
- Upgraded conversational assistant with conversation history context and rate-limiting.
- Grounded in verified portfolio facts covering education (J.N.N. Institute of Engineering, 2025–2029), VLSI skills, web development stack, and project architectures.
- Smart interactive action chips inside responses that smoothly navigate to corresponding portfolio sections or open the resume page.
- Copy response button with quick clipboard feedback.
- Gemini 1.5 Flash integration with a local verified knowledge engine fallback when no API key is provided.

### 4. Project Showcase & Case Studies
- In-depth case studies with real WebP screenshots, problem statements, technical architecture, and live links:
  - **Elder's Veil:** Comic and manga reading platform (Node.js, Express, PostgreSQL, OTP auth).
  - **CONVET PULSE:** Engineering radix and unit conversion platform for electronics students.
  - **Beyond the Circuit:** Personal portfolio with live visitor analytics and circuit simulations.
  - **Portfolio Manager:** Financial investment tracking platform with SQLite persistence and XIRR calculations.
  - **Kabaddi Pro:** Tournament management suite with automated fixture generator and PDF exports.

### 5. Production Backend & Serverless Integrations
- **Node.js HTTP Server (`server.mjs`):** Unified web service on Render with SPA fallback to `dist/index.html` (supporting direct refreshes on `/resume`).
- **Neon PostgreSQL:** Visitor analytics and presence tracking via `@neondatabase/serverless`.
- **Telegram Bot Webhook:** Real-time notifications for incoming enquiries and bot command router.
- **Contact Workflow:** Validation, spam protection, duplicate submission prevention, and transactional auto-replies via Resend with EmailJS client-side fallback.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript 6, Vite 8, Framer Motion, Lucide Icons |
| **Styling** | Custom CSS3 design tokens (`#080A0F`, `#10141D`, `#151B26`, `#38BDF8`), Dark/Light themes |
| **Backend** | Node.js, TypeScript runtime via `tsx`, RESTful API dispatching |
| **Databases** | Neon Serverless PostgreSQL, Firebase Realtime Database & Google OAuth |
| **Hardware / EDA** | Verilog HDL, ModelSim, EDA Playground |
| **Email & Alerts** | Resend API, Telegram Bot API, EmailJS |
| **Deployment** | Render Web Service (`render.yaml`), Node 22 |

---

## 📁 Repository Structure

```
portfolio/
├── api/                        # Backend REST endpoints & serverless handlers
│   ├── ai/chat.ts              # Beyond the Circuit AI endpoint with Gemini & local engine
│   ├── auth/                   # Google OAuth & session management
│   ├── db/                     # Neon PostgreSQL client & migrations
│   ├── lib/                    # Telegram bot, email, rate-limiting, session utilities
│   ├── contact.ts              # Contact form handler (Resend + Telegram alerts)
│   ├── server-router.ts        # Request routing & caching headers
│   ├── stats.ts                # Visitor count & live analytics API
│   └── track.ts                # Pageview tracking endpoint
├── public/
│   ├── assets/
│   │   ├── certificates/       # Verified certificates (Infosys, Codec, CodeAlpha, etc.)
│   │   ├── profile/            # Profile photo & Open Graph image (og-image.png)
│   │   └── resume/             # Official resume PDF (resume.pdf)
│   ├── data/                   # JSON content architecture
│   │   ├── resume.json         # JSON data source for /resume HTML page
│   │   ├── profile.json        # Owner biography, headline, and contacts
│   │   ├── projects.json       # Project case studies and metadata
│   │   ├── skills.json         # ECE & software technical skills
│   │   ├── education.json      # Verified academic history
│   │   ├── certifications.json # Verified certifications
│   │   └── navigation.json     # Navbar routes & anchor links
│   └── images/projects/        # Processed WebP project screenshots
├── src/
│   ├── components/             # Reusable UI components (Navbar, Footer, AiAssistant, CommandPalette)
│   ├── pages/
│   │   └── ResumePage.tsx      # Interactive JSON-driven HTML resume page (/resume)
│   ├── sections/               # Page sections (Hero, Ece, DualIdentity, About, Skills, Projects...)
│   │   └── EceSection.tsx      # Standalone ECE Engineering Section (Logic simulator, VLSI flow, Verilog)
│   ├── services/               # Content loader & analytics services
│   └── App.tsx                 # Main application with SPA routing
├── server.mjs                  # Production Node.js server for Render
├── render.yaml                 # Render Blueprint specification
└── vite.config.ts              # Vite build configuration with chunk splitting
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or v22 recommended)
- npm (v10+)

### Installation

```bash
# Clone the repository
git clone https://github.com/sridharvpr7/portfolio.git
cd portfolio

# Install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server (frontend only)
npm run dev

# Or build and start the full production server (frontend + API endpoints)
npm run build
npm start
```

Open `http://localhost:5173` for Vite dev server, or `http://localhost:3000` for the Node.js production server.

### Running Quality Checks & Tests

```bash
# Run unit & integration tests
npm test

# Run API TypeScript checks
npm run test:api

# Run production build
npm run build
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` for local testing:

```bash
cp .env.example .env
```

| Variable | Scope | Description |
|----------|-------|-------------|
| `PORT` | Server | Port for the Node.js server (Render assigns this automatically, defaults to `3000`) |
| `APP_BASE_URL` | Server | Full production URL (`https://sridharvpr-portfolio.onrender.com`) |
| `DATABASE_URL` | Server | Neon PostgreSQL connection string (`postgres://...`) |
| `TELEGRAM_BOT_TOKEN` | Server | Optional Telegram bot token for real-time visitor alerts |
| `TELEGRAM_CHAT_ID` | Server | Your numeric Telegram chat ID |
| `RESEND_API_KEY` | Server | Resend API key for transactional email auto-replies |
| `EMAIL_FROM_ADDRESS` | Server | Verified sender address for Resend |
| `GEMINI_API_KEY` | Server | Optional Gemini API key for Beyond the Circuit AI |
| `VITE_GOOGLE_CLIENT_ID`| Client | Google OAuth 2.0 Web Client ID |
| `VITE_EMAILJS_*` | Client | Optional EmailJS credentials for client-side fallback |

---

## 📄 Updating the Resume

1. **HTML Resume Content:** Edit `public/data/resume.json`. The `/resume` page immediately reflects any changes.
2. **PDF Resume File:** Place or overwrite your PDF at `public/assets/resume/resume.pdf`. The **Download Resume** buttons automatically download this PDF without code changes.

---

## 📬 Contact & Connect

- **Email:** [sridharvpr7@gmail.com](mailto:sridharvpr7@gmail.com)
- **LinkedIn:** [Sridhar Manivannan](https://linkedin.com/in/sridhar-manivannan-468ba035b)
- **GitHub:** [@sridharvpr7](https://github.com/sridharvpr7)
- **Portfolio:** [Beyond the Circuit](https://sridharvpr-portfolio.onrender.com)
