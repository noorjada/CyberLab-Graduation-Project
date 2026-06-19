# CyberLab

Hands-on cybersecurity training platform with CTF challenges, Docker hacking labs, learning paths, AI mentorship, and gamification.

## Features

- **CTF Challenges** — Web, network, Linux, forensics with paid hint economy, MITRE ATT&CK tags, ratings & bookmarks
- **Docker Labs** — Hardened containers with exec + WebSocket terminal, email-verified access
- **Learning Roadmap** — Module quizzes (80% pass required), XP rewards, PDF certificates
- **Daily Challenge** — Rotating daily CTF with streak bonuses
- **CTF Events** — Timed competitions with live leaderboards
- **Classrooms** — Instructor-led classes with invite codes and progress tracking
- **CyberBot AI** — Personalized mentorship + public guest Q&A (Groq Llama 3.1)
- **Skill Radar** — Category progress analytics and weak-area detection
- **Global Search** — Search challenges, labs, and paths from the sidebar
- **Community Writeups** — User-submitted writeups with upvotes
- **GitHub OAuth** — Optional social login
- **Onboarding Wizard** — Career path & skill level setup for new users
- **Activity Feed** — Live platform activity on the dashboard
- **Dark/Light Theme** — Toggle from the sidebar
- **Weekly Email Digest** — Optional progress emails
- **Admin CMS** — Manage challenges, labs, users, and roles
- **PWA** — Installable web app manifest
- **CI/CD** — GitHub Actions for client build + server tests

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Docker Desktop (for hacking labs)
- API keys (optional but recommended): [Groq](https://console.groq.com), [ipinfo.io](https://ipinfo.io), [VirusTotal](https://www.virustotal.com)

## Quick Start

### 1. Server

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm install
npm run dev
```

### 2. Seed data (first run)

```bash
node seed.js          # Users + challenges
node seedLabs.js      # Docker lab definitions
node seedPaths.js     # Learning paths
node seedWriteups.js  # Challenge writeups
```

### 3. Build Docker lab images

```powershell
# Windows
.\build-labs.ps1

# Linux/macOS
./build-labs.sh
```

### 4. Client

```bash
cd client
cp .env.example .env
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). API runs at [http://localhost:5000](http://localhost:5000).

## Default Admin

After running `seed.js`, check the seed output for admin credentials, or create a user and promote via MongoDB:

```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

## Project Structure

```
cyberlab/
├── client/          React 19 SPA
│   └── src/
│       ├── pages/   Feature pages
│       ├── components/
│       └── context/ Auth state
└── server/          Express 5 API
    ├── routes/      REST endpoints
    ├── models/      Mongoose schemas
    ├── docker-labs/ Lab Dockerfiles
    └── utils/       Docker, email, achievements
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `CLIENT_URL` | Yes | Frontend origin for CORS & emails |
| `GROQ_API_KEY` | For AI | CyberBot & hints |
| `IPINFO_TOKEN` | For recon | IP geolocation lookups |
| `VIRUSTOTAL_API_KEY` | For VT lab | Malware scanning |
| `REACT_APP_API_URL` | Client | API base URL (default: localhost:5000) |

## Scripts

| Command | Location | Description |
|---------|----------|-------------|
| `npm run dev` | server | Start API with nodemon |
| `npm start` | client | Start React dev server |
| `npm run build` | client | Production build |
| `node seed*.js` | server | Populate database |

## Certificate admin signature

1. Save your signature PNG to `server/assets/signatures/admin-signature.png`
2. Set in `server/.env`:
   ```
   CERT_ADMIN_NAME=Your Name
   CERT_ADMIN_TITLE=Administrator, CyberLab
   ```
3. Restart the server — all downloaded certificate PDFs will include your signature.

## Security Notes

- Lab containers auto-expire after 2 hours (cleanup runs every 5 minutes)
- Auth routes are rate-limited; flag submissions capped at 10 per 15 minutes
- Never commit `.env` files or expose API keys in the client bundle
