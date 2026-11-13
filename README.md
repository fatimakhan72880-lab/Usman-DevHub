# 🚀 Usman DevHub Tech & Creative Studio

> **Full-spectrum digital agency & creative tech platform delivering 3D Animated Websites, Full-Stack Web Development, High-Conversion E-Commerce, Motion Design, and Cloud Architecture.**

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=flat&logo=three.js)](https://threejs.org/)
[![Node.js & Express](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=flat&logo=node.js)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Supabase-4169e1?style=flat&logo=postgresql)](https://supabase.com/)
[![Cloudflare](https://img.shields.io/badge/CDN%20%26%20DNS-Cloudflare%20Proxy-f38020?style=flat&logo=cloudflare)](https://cloudflare.com/)

---

## 📖 Table of Contents
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Quick Start (Local Setup)](#-quick-start-local-setup)
- [🔐 Environment Variables](#-environment-variables)
- [🐙 Pushing to GitHub (Step-by-Step)](#-pushing-to-github-step-by-step)
- [🗄️ Database & Cloudflare Hosting](#️-database--cloudflare-hosting)
- [🧑‍💻 Founder & Agency Contact](#-founder--agency-contact)

---

## ✨ Key Features

- **🌐 Interactive 3D WebGL Experiences:** Built with Three.js, custom vertex/fragment shaders, and GSAP smooth scroll animation systems.
- **📄 Official Order Agreement & Milestone Studio:** Automated generation of client contracts, 3-stage milestone escrow payment plans (25% Kickoff, 35% Mid Demo, 40% Final Launch), itemized scopes, and high-fidelity PDF downloads (`jsPDF` + `html2canvas`).
- **🤝 20% Partner Referral System:** Unique cryptographic tracking tokens (`UDH-REF-...`) with instant WhatsApp sharing, referral portal, and commission milestone payout logging.
- **🛡️ Hardened Executive Security Vault:** Server-side scrypt password hashing, timing-safe session HMAC tokens, brute-force IP rate limiting, and owner credential management.
- **🗄️ Hybrid Database Persistence Engine:**
  - Auto-connects to **Cloud PostgreSQL (Supabase / Neon / Cloud SQL)** with zero schema friction.
  - Automatic migration from local `data/db.json` on first connect.
  - Graceful, zero-crash fallback to local JSON storage when offline or testing.
- **☁️ Cloudflare Edge Optimization:** Configured for Cloudflare Registrar DNS, Orange Cloud ☁️ proxy caching, HTTP/3, and Full Strict SSL/TLS.
- **📱 Conversion-Driven Mobile First UX:** Floating WhatsApp direct-connect widget, instant booking consultation scheduler, dynamic portfolio filter, and client testimonials.
- **🔍 100% SEO Health Suite:** Schema.org JSON-LD multi-entity graphs (Organization, ProfessionalService, FAQPage), automated `sitemap.xml`, and OpenGraph social preview cards.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 with TypeScript
- **Bundler:** Vite 6
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **3D & Graphics:** Three.js, GSAP 3
- **Animations:** Motion (Framer Motion v12)
- **PDF & Canvas:** jsPDF, html2canvas, canvas-confetti
- **Icons:** Lucide React

### Backend & API
- **Server:** Node.js + Express 4
- **Database Driver:** `pg` (Node-Postgres connection pool with SSL)
- **Security:** Scrypt password derivation, Crypto HMAC sessions, strict sanitization
- **Compiler/Dev Runner:** `tsx`, `esbuild`

---

## 📁 Project Structure

```text
├── src/
│   ├── components/         # React components (Hero, Services, Portfolio, Admin, etc.)
│   ├── data/               # Service definitions, deliverables, and default datasets
│   ├── services/           # Frontend client services (storage, API sync, Catbox CDN)
│   ├── utils/              # PDF generator, scroll helpers, security & certificate utils
│   ├── App.tsx             # Main application orchestrator & client router
│   ├── index.css           # Global Tailwind CSS directives & custom styles
│   └── main.tsx            # React root mount
├── data/
│   └── db.json             # Local JSON database (fallback storage)
├── public/                 # Static assets, logos, favicon, sitemap.xml, robots.txt
├── server.ts               # Production-grade Express REST API & PostgreSQL sync engine
├── .env.example            # Environment variables template
├── package.json            # Node.js dependencies & scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build pipeline & asset proxy plugins
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- npm or bun

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/usman-devhub-studio.git
cd usman-devhub-studio
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
```bash
cp .env.example .env
```
*(You can leave default values for local testing, or add your Supabase PostgreSQL connection string).*

### 4. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production
```bash
npm run build
npm start
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `APP_URL` | Public production URL / Cloudflare custom domain | `https://usmandevhub.com` |
| `DATABASE_URL` | PostgreSQL connection URI (Supabase, Neon, etc.) | `postgres://postgres.[ref]:[pwd]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require` |
| `ADMIN_EMAIL` | Executive admin login email | `hello@usmandevhub.com` |
| `ADMIN_PASSWORD` | Executive admin login password | Strong password |
| `GEMINI_API_KEY` | *(Optional)* Google Gemini AI API key | `AIzaSy...` |

> **Note:** If `DATABASE_URL` is omitted, the application seamlessly runs on local storage (`/data/db.json`).

---

## 🐙 Pushing to GitHub (Step-by-Step)

Follow these terminal commands on your computer to push this project to GitHub:

### 1. Initialize Git in the project root
```bash
git init
```

### 2. Stage all project files
```bash
git add .
```

### 3. Make your initial commit
```bash
git commit -m "feat: initial commit for Usman DevHub Studio platform"
```

### 4. Create a new repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Set repository name (e.g., `usman-devhub-studio`).
3. Choose **Public** or **Private**.
4. Do **not** initialize with a README (you already have this one).
5. Click **Create repository**.

### 5. Link and push to GitHub
```bash
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/usman-devhub-studio.git
git push -u origin main
```

---

## 🗄️ Database & Cloudflare Hosting

### Connecting Supabase (PostgreSQL)
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings -> Database -> Connection String (URI)**.
3. Copy the transaction pooler URL (Port 6543).
4. Add it to your server host environment variables as `DATABASE_URL`.
5. Upon first boot, the application automatically runs migration and initializes `udh_app_state`.

### Cloudflare Deployment (Step-by-Step)
1. Go to **Cloudflare Dashboard** -> **Compute (Workers & Pages)**.
2. Select your Worker / Pages project: `usman-devhub`.
3. In **Build settings**:
   - **Framework preset:** `Vite`
   - **Build command:** `bun run build` *(or `npm run build:pages`)*
   - **Build output directory:** `dist`
4. In **Environment variables (Advanced)**:
   - Add `NODE_VERSION`: `20`
5. Click **Save and Deploy**.
6. The app uses `not_found_handling = "single-page-application"` in `wrangler.toml` so all SPA routes and refresh work seamlessly without infinite redirect loops.

### Cloudflare Custom Domain Setup
1. In Cloudflare Dashboard, open your domain DNS settings.
2. Add a `CNAME` record for `@` or `www` pointing to your Cloudflare Pages deployment (`<project>.pages.dev`).
3. Enable **Orange Cloud ☁️ (Proxy Mode)** for free DDoS protection, global edge caching, and SSL/TLS.
4. Set SSL/TLS encryption mode to **Full (Strict)**.

---

## 🧑‍💻 Founder & Agency Contact

**Muhammad Usman Afzal**  
*Founder, Lead Creative Technologist & Full-Stack Architect*

- 🌐 **Agency:** Usman DevHub Tech & Creative Studio
- 📧 **Inquiries:** [hello@usmandevhub.com](mailto:hello@usmandevhub.com)
- 💼 **LinkedIn:** [Muhammad Usman Afzal](https://www.linkedin.com/in/muhammad-usman-afzal-897655381)
- 📸 **Instagram:** [@usman_devhub](https://www.instagram.com/usman_devhub?rpxt=a3dwOWRqaDNzdW9n)

---

© 2026 Usman DevHub Tech & Creative Studio. All Rights Reserved.
