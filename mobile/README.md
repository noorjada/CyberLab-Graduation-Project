# CyberLab Mobile

Full-featured Flutter companion for [CyberLab](https://github.com) — connects to the same API as the web app.

## Feature coverage

| Category | Mobile | Notes |
|----------|--------|-------|
| Auth (login/register) | ✅ | JWT, auto session restore |
| Dashboard + rank/XP | ✅ | Stats, study plan, quick actions |
| Study plans | ✅ | Enroll, topic checklists |
| Cyber Reference | ✅ | Search + markdown articles |
| Learning roadmap | ✅ | Modules, quizzes, cert claim |
| Learning notes | ✅ | CRUD, search, types |
| CTF challenges | ✅ | Flag submit, hints, AI, bookmarks |
| Practice exams | ✅ | Timer, AI lockdown, draft restore |
| Daily challenge | ✅ | Streak display |
| Courses | ✅ | Lessons, videos, quizzes |
| CTF events | ✅ | Join, status, leaderboard meta |
| University portal | ✅ | Join with invite code |
| Certificates | ✅ | Path + course certs |
| Leaderboard | ✅ | Top 50 |
| Search | ✅ | Challenges, plans, articles, paths |
| Notifications | ✅ | Inbox + mark read |
| CyberBot | ✅ | Floating AI chat (disabled in exam) |
| SOC Assistant | ✅ | Blue-team AI chat |
| Recon / VirusTotal / Intel | ✅ | IP, DNS, WHOIS, CVE, KEV, news |
| Security news | ✅ | Live feed (`/exploits/news`) + home preview |
| Activity feed | ✅ | Same as web dashboard |
| Exam history | ✅ | Past attempts & scores |
| CTF writeups | ✅ | Read/submit on challenge detail |
| Event leaderboards | ✅ | Event detail screen |
| University assignments | ✅ | From enrolled classrooms |
| Skill analytics | ✅ | Dashboard skill bars |
| Change password | ✅ | Profile settings |
| Labs catalog | 📋 Browse only | Hands-on labs → web |
| Hacking labs / Terminal | 🖥️ Web only | Docker + terminal |
| Admin / Builders | 🖥️ Web only | Staff tools |

---

## Prerequisites

1. **Flutter SDK 3.16+** — https://docs.flutter.dev/get-started/install/windows  
2. **Android Studio** (emulator) or a physical device with USB debugging  
3. **CyberLab server** running locally or on your network  
4. **MongoDB** seeded (`npm run seed:challenges`, `seed:study-plans`, etc.)

Verify Flutter:

```powershell
flutter doctor
```

---

## Setup (first time)

```powershell
cd C:\Users\haith\OneDrive\Desktop\cyberlab\mobile
.\setup.ps1          # Flutter SDK + project deps
.\setup-android.ps1  # Android SDK on D: drive (for real phone/APK)
```

`setup-android.ps1` installs the Android SDK to `D:\Android\Sdk` so builds do not fill your C: drive.

---

## Run the backend

In a separate terminal:

```powershell
cd C:\Users\haith\OneDrive\Desktop\cyberlab\server
npm run dev
```

Server must be on **port 5000** (default).

---

## Run the app (Android phone or emulator)

**This is a mobile app.** Use a USB-connected phone or Android emulator — not Chrome or Windows desktop.

```powershell
cd mobile
.\run.ps1
```

- **Emulator:** API auto-uses `http://10.0.2.2:5000/api`
- **Physical phone:** USB debugging ON, same Wi‑Fi as PC — script auto-detects your PC IP

### Install APK without USB debugging

```powershell
.\build-apk.ps1
```

Copy `build\app\outputs\flutter-apk\app-release.apk` to your phone and open it to install.

---

## Test account

Use an existing account or register in the app:

```
Email: admin@cyberlab.com
Password: admin123
```

Or register a new user from the app (min 6 char password).

---

## Manual test checklist

Run through these after `flutter run`:

### Auth
- [ ] Register new account → lands on Dashboard
- [ ] Log out → Profile → Sign out
- [ ] Log back in → session persists after hot restart

### Home tab
- [ ] Dashboard shows username, rank, stats
- [ ] Tap Daily Challenge quick action
- [ ] Search icon → search `sql` → open a challenge
- [ ] Notification bell → see notifications

### Learn tab
- [ ] Study Plans → open a plan → enroll → toggle a topic
- [ ] Cyber Reference → open article → markdown renders
- [ ] Learning Roadmap → complete a module (quiz if prompted)
- [ ] Learning Notes → create note → edit → delete
- [ ] My Courses → open course → mark lesson complete

### CTF tab
- [ ] Filter by category
- [ ] Open challenge → submit wrong flag → error
- [ ] Reveal hint → points deducted
- [ ] AI tab → ask CyberBot a question
- [ ] Bookmark challenge → visible in Profile

### Exams tab
- [ ] Start exam → CyberBot FAB disappears
- [ ] Answer questions → submit → see score
- [ ] Try opening CyberBot during exam → blocked
- [ ] Background app → focus warning logged (server)

### More tab
- [ ] Leaderboard loads
- [ ] Certificates list
- [ ] Security Tools → SOC, Recon, VirusTotal, Intel
- [ ] CTF Events → join event
- [ ] University → join with invite code (if seeded)
- [ ] Labs catalog → shows desktop-only banner

### CyberBot FAB
- [ ] Tap 🤖 on any main tab → chat works
- [ ] Hidden during active exam

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cannot reach server` | Start `npm run dev` in `server/` |
| Connection refused on emulator | Use default API URL (`10.0.2.2`) |
| Connection refused on phone | Use PC LAN IP in `--dart-define=API_URL=...` |
| `flutter` not found | Install Flutter SDK, restart terminal |
| Android licenses | Run `flutter doctor --android-licenses` |
| AI returns error | Set `OPENAI_API_KEY` or `GROQ_API_KEY` in `server/.env` |
| Empty challenges/exams | Run `npm run seed:challenges` and `npm run seed:exams` |

---

## Project structure

```
mobile/lib/
  config/         API & web URLs
  theme/          Dark cybersecurity UI
  models/         User model
  services/       Dio HTTP + SharedPreferences
  providers/      Auth + Exam session state
  router/         go_router + exam redirect guard
  screens/        All app screens (30+)
  widgets/        CyberAppBar, CyberBot, quiz sheet, etc.
  utils/          Rank, JSON formatting
```

---

## Build release APK

```powershell
flutter build apk --dart-define=API_URL=https://your-api.com/api
```

APK output: `build/app/outputs/flutter-apk/app-release.apk`
