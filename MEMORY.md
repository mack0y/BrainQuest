# 🧠 BrainQuest — Project Memory

> **A gamified learning platform for kids ages 4-11**
> Built with Vanilla JS + Supabase (Phase 1 — Core MVP)

---

## 📋 Project Overview

BrainQuest transforms worksheet-based learning into an RPG-style adventure. Kids complete quests (worksheets), earn XP, level up, earn badges, and compete on the leaderboard — all while learning foundational subjects from Preschool to Grade 5.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (SPA) |
| **Backend** | Supabase (Auth, PostgreSQL, Storage, Realtime) |
| **Hosting** | GitHub Pages (vanilla static files — no build step) |
| **PWA** | Service worker + Web App Manifest |
| **Auth** | Supabase Auth (Email/Password + Google OAuth) |

---

## 🗂 File Structure

```
BrainQuest/
├── index.html              # SPA shell (283 lines)
│                           # - All 9 page views as hidden <div> containers
│                           # - Navigation, HUD, footer
│                           # - Background effects (particles, orbs, cursor glow)
│
├── manifest.json           # PWA manifest (standalone, shortcuts, theme)
├── sw.js                   # Service worker (network-first caching)
│
├── supabase/
│   └── schema.sql          # Full DB schema + RLS + seed data
│
├── css/
│   └── style.css           # Complete design system (911 lines)
│       ├── Design tokens (colors, radii, shadows, transitions)
│       ├── Reset + typography
│       ├── Background effects (particles, orbs, cursor glow)
│       ├── Navigation + layout
│       ├── Auth page (login/signup)
│       ├── Hero section
│       ├── HUD (XP bar, player stats)
│       ├── Quest path (timeline with locked/unlocked/completed)
│       ├── Subject cards
│       ├── Badges shelf
│       ├── Leaderboard
│       ├── Worksheet generator
│       ├── Toast notifications
│       ├── Footer
│       ├── Scroll reveal animations
│       ├── Skeleton loading
│       └── Responsive (mobile/tablet/desktop) + reduced-motion
│
├── js/
│   ├── db.js               # Database layer (238 lines)
│   │   ├── Supabase client init
│   │   ├── Auth API (signUp, signIn, signInWithGoogle, signOut)
│   │   ├── Profile CRUD (getProfile, updateProfile)
│   │   ├── Quest queries (getQuests, getQuestProgress, updateQuestProgress)
│   │   ├── Worksheet queries (getWorksheets, getWorksheetById, completeWorksheet)
│   │   ├── Badge queries (getBadges, getUserBadges, awardBadge)
│   │   ├── Leaderboard query
│   │   ├── Subscription query
│   │   └── Daily streak update (with 10 XP login bonus)
│   │
│   ├── auth.js             # Auth module (128 lines)
│   │   ├── Session listener (init, onLogin, onLogout)
│   │   ├── Login/signup/Google OAuth wrappers
│   │   ├── getLevelInfo (XP calc with per-level scaling)
│   │   └── isLoggedIn check
│   │
│   ├── gamification.js     # Gamification engine (179 lines)
│   │   ├── addXp (add XP, check level-up, carry over)
│   │   ├── checkBadges (auto-award on conditions met)
│   │   ├── initQuestProgress (create progress rows for new user)
│   │   └── getQuestStatuses (enrich quests with progress + unlock logic)
│   │
│   ├── ui.js               # UI utilities (202 lines)
│   │   ├── createParticles (floating colored dots)
│   │   ├── initCursorGlow (mouse-following radial gradient)
│   │   ├── initScrollReveal (IntersectionObserver animations)
│   │   ├── showToast (level-up/toast notifications)
│   │   ├── celebrateLevelUp (toast + confetti burst)
│   │   ├── createConfetti (40 colored pieces falling)
│   │   ├── initMagneticButtons (follow-cursor transform)
│   │   ├── initHeroTilt (parallax on hero title)
│   │   └── formatXp (1k+ formatting)
│   │
│   └── app.js              # Application controller (877 lines)
│       ├── init (bootstrap Supabase, Auth, DOM refs, listeners)
│       ├── Hash routing (handleRoute, navigate, render)
│       ├── Navigation updates (XP badge, avatar, active links)
│       ├── renderHome — Landing page (static, in HTML)
│       ├── renderAuth — Login/signup form with validation
│       ├── renderDashboard — HUD + quest path + stats
│       ├── renderQuests — Full quest map
│       ├── renderWorksheet — Subject picker or worksheet view
│       ├── renderLeaderboard — Top 10 players
│       ├── renderBadges — Badge collection (locked/unlocked)
│       ├── renderProfile — Name/avatar editor + stats + sign out
│       ├── renderGenerator — Subject/grade/difficulty picker
│       └── getRankTitle — Level-based title mapping
│
└── MEMORY.md               # This file
```

### Total: ~3,200 lines of code

---

## 🗄 Database Schema (Supabase)

### Tables (11 total)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | Extends `auth.users` | id, username, display_name, avatar_url, level, xp, total_xp, streak_days, last_login |
| `quests` | Quest definitions | id, level, title, description, subject, xp_reward, icon, sort_order |
| `quest_progress` | Per-user quest tracking | user_id, quest_id, status (locked/available/in_progress/completed) |
| `worksheets` | Worksheet content | id, title, subject, grade, difficulty, content (JSONB), xp_reward |
| `worksheet_completions` | Worksheet history | user_id, worksheet_id, score, xp_earned |
| `badges` | Badge definitions | id, name, description, icon, requirement_type, requirement_value |
| `user_badges` | Earned badges | user_id, badge_id (unique) |
| `study_squads` | Squad groups | id, name, invite_code, created_by |
| `squad_members` | Squad membership | squad_id, user_id, role (leader/member) |
| `family_relationships` | Parent-child linking | parent_id, child_id, approved |
| `subscriptions` | Payment tiers | user_id, tier (free/premium/school), stripe_customer_id, expires_at |

### Key RLS Policies

- **Profiles**: Users can read/update only their own profile
- **Quests/Worksheets/Badges**: Public read (any authenticated user)
- **Quest Progress/Completions**: Per-user CRUD
- **Squads**: Members can view their squads
- **Family**: Only linked parent/child can view
- **Subscriptions**: Own subscription only

### Seed Data

- **6 Quests**: Level 0 (The Beginning) through Level 5 (Multiplication Master)
- **8 Badges**: First Steps, ABC Hero, Number Knight, On Fire!, Math Wizard, Star Scholar, Quest King, Grand Champion
- **Auto-profile creation**: Trigger on `auth.users` insert

---

## 🧭 Routes (SPA Hash-based)

| Route | Page | Auth Required |
|-------|------|:---:|
| `/` | Home (hero + features) | ❌ |
| `/login` | Login | ❌ |
| `/signup` | Sign Up | ❌ |
| `/dashboard` | Main dashboard (quest path + HUD) | ✅ |
| `/quests` | Full quest map | ✅ |
| `/worksheet` | Subject picker | ✅ |
| `/worksheet/:id` | Specific worksheet | ✅ |
| `/leaderboard` | Top 10 players | ✅ |
| `/badges` | Badge collection | ✅ |
| `/profile` | Profile settings | ✅ |
| `/generator` | Worksheet generator | ✅ |

---

## 🎨 Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deep` | `#080a12` | Main background |
| `--bg-surface` | `#0f1320` | Card backgrounds |
| `--bg-card` | `#151b2e` | Inputs, deeper surfaces |
| `--primary` | `#00f0b5` | Emerald — main accent, CTAs, XP |
| `--secondary` | `#7c3aed` | Electric purple — secondary accent |
| `--amber` | `#f59e0b` | Warm accent |
| `--text` | `#e2e8f0` | Primary text |
| `--text-dim` | `#8892a8` | Secondary text |

### Typography

- **Display**: `Fredoka One` (rounded, playful — for headings)
- **Body**: `Inter` (clean, readable — for content)

### Key Components

- **Hero**: Animated emblem with pulse rings, gradient title, tilt parallax
- **Navigation**: Glassmorphism sticky nav, XP badge, avatar with level badge
- **HUD**: Player avatar, level, rank, animated XP bar, stats (quests/streak/badges)
- **Quest Path**: Timeline with colored left-border cards, locked/unlocked/current states, pulse animation on active quests
- **Subject Cards**: Glassmorphism cards with colored top accents
- **Badges**: Grid shelf with locked (grayscale) / unlocked states
- **Leaderboard**: Rows with rank medals, avatar, XP, "you" highlight
- **Generator**: Card with decorative gradient orbs, select dropdowns
- **Toast**: Slide-in notification with icon + title + subtitle

### Animations

- Floating particles (50 colored dots drifting)
- Ambient gradient orbs (3 large blurred shapes drifting)
- Cursor glow (mouse-following radial gradient)
- Scroll reveal (IntersectionObserver fade-in)
- Hero tilt (parallax on mouse move)
- Magnetic buttons (follow cursor on hover)
- XP bar glide (shimmer effect)
- Quest pulse (glowing dot on active quests)
- Confetti burst (40 pieces on level up)
- Ring pulse (expanding rings on hero emblem)
- Skeleton loading (shimmer animation)

### Responsive Breakpoints

| Breakpoint | Changes |
|------------|---------|
| `≤ 900px` | Nav links hidden (hamburger menu), footer 2-col, stacked HUD |
| `≤ 600px` | Footer 1-col, 2-col subject/badge grid, smaller quest nodes |
| `≤ 400px` | 1-col everything |
| `prefers-reduced-motion` | All animations disabled |

---

## 🔐 Authentication Flow

1. **On load**: `Auth.init()` checks for existing Supabase session
2. **Hash routing**: `App.render()` checks `Auth.isLoggedIn()` to show auth vs dashboard pages
3. **Login page**: Tabbed UI (Log In / Sign Up), email/password form + Google OAuth button
4. **On signup**: Supabase auto-creates profile via DB trigger; `Auth.onLogin()` initializes quest progress
5. **On login**: `Auth.onLogin()` updates daily streak (+10 XP bonus), refreshes profile, navigates to dashboard
6. **Session**: Supabase handles token refresh via `autoRefreshToken: true`; OAuth redirect handled via `detectSessionInUrl: true`
7. **Logout**: `Auth.logout()` signs out via Supabase, navigates to home

---

## ⚙️ Gamification System

### XP Calculation

- **Per-level XP requirement**: `(level + 1) * 200`
  - Level 0 → 1: 200 XP
  - Level 1 → 2: 400 XP
  - Level 2 → 3: 600 XP
  - etc.
- **Level-up**: When XP ≥ threshold, level increments and excess XP carries over
- **Quest rewards**: 100–300 XP per quest (defined in seed data)
- **Daily login bonus**: +10 XP on login when `last_login ≠ today`

### Quest Unlock Logic

- Quest 0 is always "available" for new users
- Each subsequent quest unlocks when the previous quest is completed
- `Gamification.getQuestStatuses()` checks and updates locked→available transitions

### Badge Auto-Award

Badges are checked after any XP change (quest completion, login streak):

| Badge | Condition |
|-------|-----------|
| 🌱 First Steps | Complete Level 0 |
| 🔤 ABC Hero | Complete Level 1 |
| 🔢 Number Knight | Reach Level 2 |
| 🔥 On Fire! | 7-day streak |
| 🧙 Math Wizard | Reach Level 5 |
| ⭐ Star Scholar | 1000 Total XP |
| 👑 Quest King | Complete all 6 quests |
| 🏆 Grand Champion | Top of leaderboard |

### Rank Titles

| Level | Title |
|-------|-------|
| 0 | Apprentice Explorer |
| 1 | Curious Scholar |
| 2 | Number Knight |
| 3 | Math Warrior |
| 4 | Word Wizard |
| 5 | Multiplication Master |
| 6 | Sage Scholar |
| 7 | Quest Master |
| 8 | Brain Champion |
| 9 | Grand Champion |
| 10+ | Legendary Scholar |

---

## 🔌 Supabase Configuration

### Project Details

| Field | Value |
|-------|-------|
| **Project ID** | `ictsojpigdczrxdshrmh` |
| **Project URL** | `https://ictsojpigdczrxdshrmh.supabase.co` |
| **Anon Key** | Set in `js/db.js` |

### Setup Steps (already done)

1. ✅ Created Supabase project
2. ✅ Ran `supabase/schema.sql` (11 tables, RLS, seeds)
3. ✅ Enabled Google OAuth in Authentication → Providers
4. ✅ Configured Google Cloud Console OAuth credentials

### Auth Providers

- **Email/Password**: Enabled (default)
- **Google OAuth**: Enabled (configured in Supabase + Google Cloud Console)

---

## 🚀 Deployment (GitHub Pages)

This project is a static SPA — no build step required.

### Steps

1. Create a GitHub repository
2. Push all files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: BrainQuest Phase 1"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
3. Go to **Settings** → **Pages** → Deploy from `main` branch, root folder
4. Your site will be live at `https://<username>.github.io/BrainQuest/`

> **Note**: If deployed to a subpath (e.g., `/BrainQuest/`), update the `manifest.json` `start_url` to `"/BrainQuest/"` and service worker cache URLs to include the subpath prefix.

---

## 🧪 Testing the App Locally

```bash
# Option 1: npx serve (recommended)
npx serve .

# Option 2: Python
python -m http.server 3000

# Option 3: VS Code Live Server extension
```

Then open `http://localhost:3000` in your browser.

### Test Flow

1. Open the app → see the landing page with hero, features, subjects
2. Click **"Begin Your Quest"** → see the auth page
3. Click **"Sign Up"** → create an account with email/password
4. After signup → redirected to dashboard with quest path
5. Click **"Complete Quest →"** on Level 0 → earn XP, see toast
6. Level 1 unlocks → complete it → level up with confetti
7. Navigate to **Leaderboard** → see yourself ranked
8. Navigate to **Badges** → see earned badges
9. Navigate to **Profile** → change avatar/name
10. Navigate to **Generator** → forge a worksheet
11. Click **Sign Out** → back to landing page

---

## 🔜 Roadmap: Future Phases

### Phase 2 — Real Worksheets
- [ ] Generate actual printable PDF worksheets
- [ ] Interactive online worksheets (input fields, auto-grading)
- [ ] Subject-specific content (Alphabets, Numbers, Maths, etc.)
- [ ] Difficulty-adaptive content generation
- [ ] Spaced repetition review system

### Phase 3 — Social Features
- [ ] Study squads (3-5 members)
- [ ] Real-time chat within squads (Supabase Realtime)
- [ ] Squad quests with shared progress
- [ ] Friend system

### Phase 4 — Parent/Teacher Dashboard
- [ ] Link child accounts via family_relationships
- [ ] Progress analytics (charts, trends)
- [ ] Learning goal setting
- [ ] PDF report generation
- [ ] Alerts (low activity, struggling topics)

### Phase 5 — Monetization
- [ ] Stripe integration
- [ ] Free tier (50 worksheets)
- [ ] Premium tier ($4.99/month, unlimited)
- [ ] School tier ($199/year, classroom management)

---

## 🐛 Known Issues & Notes

- **Service worker icons**: Uses inline SVG data URI in manifest — some platforms (iOS) may not support this for home screen icons. A real PNG asset would be more reliable.
- **CDN dependency**: Requires `cdn.jsdelivr.net` to be accessible for Supabase JS library. Works offline via service worker cache after first load.
- **No build step**: All code is vanilla JS — no minification, bundling, or transpilation. Good for a learning project, but could benefit from a build pipeline at scale.
- **Quest completion redirect**: After completing a quest, the user is redirected to the dashboard. Future improvement: stay on current page with a local refresh.
- **Worksheet content**: Phase 1 has the worksheet infrastructure but no real educational content yet — that comes in Phase 2.

---

## 📝 Git Workflow Notes

- This file (`MEMORY.md`) serves as the single source of truth for project memory
- Update this file when adding significant features or making architectural changes
- Keep the file structure section in sync with the actual project files

---

*Last updated: June 16, 2026*
