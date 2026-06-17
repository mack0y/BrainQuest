# 🧠 BrainQuest — Project Memory

> **A gamified learning platform for kids ages 4-11**
> Built with Vanilla JS + Supabase (Phase 1 — Core MVP · Phase 2 — Interactive Worksheets · Phase 3 — Quest-Worksheet Integration)

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
│   ├── worksheets.js        # Worksheet engine (~800 lines)
│   │   ├── window.WorksheetEngine — global object (uses window. for console/dev access)
│   │   ├── generate(subject, grade, difficulty) — builds a full worksheet
│   │   ├── Subject generators (genAlphabets, genNumbers, genMaths, genVocabulary, genColoring, genPuzzles)
│   │   ├── New exercise helpers: genMatchExercise (click-to-match columns), genSortExercise (tap-to-order), genDragOrder (drag-to-reorder), genDragMatch (drag-source-to-target), genDragZone (drag-into-category-zones)
│   │   ├── renderWorksheet(worksheet) — renders interactive HTML for choose, input, match, sort, dragorder, dragmatch, dragzone types
│   │   ├── attachHandlers(worksheet, container, onQuestComplete) — binds clicks, inputs, match/sort clicks, drag-and-drop (HTML5 DnD + touch), check/retry; optional quest callback for Claim Reward button
│   │   ├── saveCompletion — awards XP + persists to worksheet_completions table
│   │   ├── Drag system: initDragHandlers/removeDragHandlers/processDragDrop with HTML5 DnD (dragstart/dragover/drop) + touch events (touchstart/touchmove/touchend with floating clone and elementFromPoint hit detection)
│   │   └── Helpers (shuffle, wordToEmoji, getAnimalWord, subjectColor, renderMatch, renderSort, renderDragOrder, renderDragMatch, renderDragZone)
│   │
│   ├── gamification.js     # Gamification engine (~220 lines)
│   │   ├── XP constants (BASE=100, SCALE=1.25, forLevel(), DIFFICULTY multipliers)
│   │   ├── Badge cache with 60s TTL (_badgeCache, _badgeCacheTime, per-user cache)
│   │   ├── addXp (add XP, check level-up, carry over, exponential formula)
│   │   ├── checkBadges (cached, auto-award on conditions met)
│   │   ├── initQuestProgress (create progress rows for new user)
│   │   ├── getQuestStatuses (enrich quests with progress + user level sync + retroactive XP)
│   │   └── completeQuest (XP-first then mark complete — data integrity)
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
│   ├── quest-strip.js      # Quest progress strip module (40 lines) — NEW
│   │   └── QuestStrip.build(questStatuses, show) — generates compact horizontal strip HTML
│   │
│   └── app.js              # Application controller (~940 lines)
│       ├── init (bootstrap Supabase, Auth, DOM refs, listeners)
│       ├── Hash routing (handleRoute, navigate, render; parses ?quest= query param for quest mode)
│       ├── Navigation updates (XP badge, avatar, active links; Play nav route mapped)
│       ├── renderHome — Landing page (static, in HTML)
│       ├── renderAuth — Login/signup form with validation (route-aware tab switching)
│       ├── renderDashboard — HUD + quest progress strip + quest path + stats
│       ├── renderQuests — Full quest map
│       ├── renderWorksheet — Quest-aware worksheet page (loads pending quest data, enables quest mode)
│       ├── renderGenerator — Subject/grade/difficulty picker (free-play mode via /play and /generator, fetches quest statuses for strip)
│       ├── renderGeneratorForm — Shared form renderer (quest banner, pre-selected subject, scaled difficulty, quest strip)
│       ├── generateWorksheet / generateWorksheetFor(prefix) — Shared worksheet generation (passes quest callback in quest mode)
│       ├── completePendingQuest — Completes quest after passing worksheet, awards XP, navigates to dashboard
│       ├── renderLeaderboard — Top 10 players
│       ├── renderBadges — Badge collection (locked/unlocked)
│       ├── renderProfile — Name/avatar editor + stats + sign out
│       ├── buildQuestStripHTML → QuestStrip.build (extracted to quest-strip.js)
│       └── getRankTitle — Level-based title mapping
│
└── MEMORY.md               # This file
```

### Total: ~4,100 lines of code

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
| `/worksheet` | Subject picker + quest-mode worksheet (use ?quest=ID query param) | ✅ |
| `/worksheet/:id` | Specific worksheet | ✅ |
| `/leaderboard` | Top 10 players | ✅ |
| `/badges` | Badge collection | ✅ |
| `/profile` | Profile settings | ✅ |
| `/play` 🎮 | Free-play worksheet generator (renamed from /generator) | ✅ |
| `/generator` | Legacy alias for /play (both routes work) | ✅ |

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
- **Play** 🎮: Free-play worksheet generator (renamed from Generator) with subject/grade/difficulty pickers
- **Quest Banner**: Gradient banner shown in quest-mode worksheets showing quest icon, title, XP reward, and pass requirement
- **Claim Reward Button**: Pulsing amber button that appears after passing a quest worksheet (≥60%), completes the quest and awards XP
- **Worksheet**: Exercise container with numbered cards, clickable options, text inputs, hint tooltips, score/results overlay
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

- **Per-level XP requirement**: `Math.floor(100 * Math.pow(1.25, level))` (exponential)
  - Level 0 → 1: 100 XP
  - Level 1 → 2: 125 XP
  - Level 2 → 3: 156 XP
  - Level 5 → 6: ~305 XP
  - Level 10 → 11: ~931 XP
  - Total to reach Level 10: ~7,200 XP
- **Level-up**: When XP ≥ threshold, level increments and excess XP carries over (multi-level supported via while loop)
- **Quest rewards**: 100–300 XP per quest (defined in seed data)
- **Worksheet XP**: Base exercise XP multiplied by difficulty multiplier: Easy 1x, Normal 1.5x, Hard 2.5x, Legendary 4x
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
10. Navigate to **Generator** (`#/generator`) or **Worksheets** (`#/worksheet`) → forge a worksheet
11. Pick a subject (Alphabets/Numbers/Maths/Vocabulary/Coloring/Puzzles), grade (Preschool–Grades 4–5), and difficulty (Easy–Legendary)
12. Click **"Forge Worksheet"** → interactive exercises appear
13. Answer by clicking options or typing in text fields
14. Click **"Check Answers"** → see score (%), XP earned, correct/incorrect per question
15. Click **"Try Again"** → generates a fresh worksheet with new questions
16. XP is awarded and saved to Supabase worksheet_completions table
17. Click **Sign Out** → back to landing page

---

## 🔜 Roadmap: Future Phases

### Phase 2 ✅ — Interactive Worksheets
- [x] Dynamic worksheet engine with 6 subject generators
- [x] Interactive online worksheets (clickable options + text inputs)
- [x] Auto-grading with score/XP calculation
- [x] "Try Again" generates fresh set of questions
- [x] XP awarded and persisted to Supabase on completion
- [x] Difficulty-adaptive (Easy / Normal / Hard / Legendary)
- [ ] Spaced repetition review system
- [ ] Printable PDF export for offline use

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

- **Navigation requires login**: Protected routes (dashboard, quests, leaderboard, badges, profile, play) show the home page when not logged in.
- **Service worker icons**: Uses inline SVG data URI in manifest — some platforms (iOS) may not support this for home screen icons. A real PNG asset would be more reliable.
- **CDN dependency**: Requires `cdn.jsdelivr.net` to be accessible for Supabase JS library. Works offline via service worker cache after first load.
- **No build step**: All code is vanilla JS — no minification, bundling, or transpilation. Good for a learning project, but could benefit from a build pipeline at scale.
- **Quest-worksheet integration**: Quests now require completing a worksheet with ≥60% score to earn XP. Clicking "Learn →" on a quest node navigates to `#/worksheet?quest=ID`. The subject is pre-selected and locked in quest mode. After passing, a "Claim Reward" button appears. This replaces the old instant-complete behavior.
- **Stale pendingQuest state**: Cleared on every route change via `handleRoute()` to prevent stale quest mode state.
- **Worksheet completions**: Dynamically generated worksheets use `null` for `worksheet_id` in the `worksheet_completions` table (since no matching row exists in `worksheets`). The FK constraint error is handled gracefully — XP is still awarded.
- **Worksheet variety**: Each generation creates new random exercises. However, the same word lists/patterns may repeat across sessions since they're drawn from fixed word banks.
- **`const` vs `window` globals**: `WorksheetEngine` is declared as `window.WorksheetEngine` (not `const`) to allow browser console/DevTools access for testing. Other modules use `const` since they're accessed by reference from other scripts.

### Fixed Bugs & Improvements

| Bug | Fix |
|-----|-----|
| SyntaxError in `getAnimalWord` (broken str_replace left dangling `return` statement) | Restored valid `return map[letter.toUpperCase()]` |
| `X: 'X-ray'` not an animal word | Changed to `X: 'Xerus'` (African ground squirrel) |
| `WorksheetEngine` not accessible from browser console (`const` doesn't create `window` property) | Changed `const WorksheetEngine` → `window.WorksheetEngine` |
| FK error code mismatch: `23503` vs `23502` for null `worksheet_id` | Now catches both `23502` (NOT NULL) and `23503` (FK) |
| Scroll reveal animations never triggered | Added `await` to async renderers + defensive `initScrollReveal()` calls |
| Quests instantly completed on button click | Replaced instant complete with worksheet+quest flow (banner, Claim Reward on ≥60%) |
| Navigation race condition causing stale state | navigate() returns early when setting hash; render only via hashchange |
| Match/sort exercise handler duplication on re-render | Replaced per-element listeners with event delegation |
| Auth tab switching between Login/Signup broken | Route-aware `dataset.authRoute` key replaces one-time `dataset.rendered` lock |
| `Quest King` and `Grand Champion` badges never awardable | Added missing `all_quests` and `leaderboard_top` cases to `checkBadges()` |
| Dragmatch swap silently dropped the old source back to pool without re-render | Removed premature `return` in swap logic, success sound + re-render now runs |
| Quest progress stuck at Level 0 for high-level users | Auto-sync quest statuses with user profile level in `getQuestStatuses()` |
| Retroactive XP not awarded when quests auto-complete via level sync | Added retroactive XP award + summary toast for newly synced quests |
| Quests could be marked complete without XP being awarded (data integrity) | `completeQuest()` now awards XP FIRST, only marks complete on success |
| `updateStreak()` race condition: addXp() profile update overwritten by streak update | Moved streak update (`last_login`, `streak_days`) BEFORE addXp() call |
| Redundant `checkBadges()` DB queries (2 queries per XP change) | Added badge cache with 60s TTL + per-user badge cache |
| Level formula `(N+1)*200` made early levels too slow, later levels impossible | Exponential formula `100 * 1.25^N` + worksheet XP scaled by difficulty (Easy 1x → Legendary 4x) |
| Play page lacked quest progress visibility | Added quest progress strip (QuestStrip.build) to Play page + Dashboard |
| `buildQuestStripHTML` bloated app.js | Extracted to `js/quest-strip.js` as standalone `QuestStrip` module |

---

## 📝 Git Workflow Notes

- This file (`MEMORY.md`) serves as the single source of truth for project memory
- Update this file when adding significant features or making architectural changes
- Keep the file structure section in sync with the actual project files

---

*Last updated: June 17, 2026*

## 🧠 Worksheet Engine Reference

### Exercise Types by Subject

| Subject | Exercise Modes | Interaction |
|---------|---------------|:-----------:|
| 🔤 **Alphabets** | Letter recognition, uppercase→lowercase matching, which word starts with..., fill missing letter, **drag-to-order ABC!** | Click / Input / Drag |
| 🔢 **Numbers** | Count objects, number sequencing, match number→word, **drag-to-order smallest→biggest** | Click / Input / Drag |
| ➕ **Maths** | Addition, subtraction, visual dot counting, word problems, **drag-to-match equation→answer** | Click / Input / Drag |
| 📖 **Vocabulary** | Word→emoji matching, fill-in-the-blank sentences, unscramble, **drag-to-match emoji→word** | Click / Input / Drag |
| 🎨 **Coloring** | Color recognition (emoji matching), what color should this be?, **drag-to-match color→object** | Click / Drag |
| 🧩 **Puzzles** | Pattern completion (emoji sequences), odd one out, sequence prediction, **drag-to-zone shape vs color groups** | Click / Drag |

### Exercise Interaction Types

| Type | Description | Scoring |
|------|-------------|---------|
| `choose` | Click an option button to select | Selected value matches answer |
| `input` | Type answer in text field | Input matches answer (case-insensitive) |
| `match` | Click left item, then click right item to match pair | All pairs correctly matched (all-or-nothing) |
| `sort` | Tap items from pool to order area (click-to-order) | All items in correct position (all-or-nothing) |
| `dragorder` | Drag items vertically to reorder (HTML5 DnD + touch) | All items in correct position (all-or-nothing) |
| `dragmatch` | Drag source items onto drop target zones | All targets have correct source (all-or-nothing) |
| `dragzone` | Drag items into category zones | All items in correct zone (all-or-nothing) |

### Difficulty Scaling

| Difficulty | Exercise Count | Max Number Range | XP Range |
|:----------:|:--------------:|:----------------:|:--------:|
| 🟢 Easy | 5 | 1–5 | 10–20 |
| 🟡 Normal | 6 | 1–10 | 15–25 |
| 🟠 Hard (Epic) | 7 | 1–20 | 15–25 |
| 🔴 Legendary | 7 | 1–50 | 20–25 |

### Scoring

- Each exercise has an `xp` value (10–35 depending on complexity; drag types = 30–35)
- Total worksheet XP = sum of all exercise XP values
- Score = `(correct / total exercises) * 100`%
- Awarded XP = `totalXP * (score / 100)` (percentage-based)
- Passing threshold: ≥ 60% correct

### Code Architecture

```
WorksheetEngine.generate(subject, grade, difficulty)
  │
  ├─ generateExercises(subject, grade, difficulty)
  │   ├─ genAlphabets(count, grade, maxNum)
  │   ├─ genNumbers(count, grade, maxNum)
  │   ├─ genMaths(count, grade, maxNum)
  │   ├─ genVocabulary(count, grade, maxNum)
  │   ├─ genColoring(count, grade)
  │   └─ genPuzzles(count, grade, maxNum)
  │
  ├─ Exercise helpers
  │   ├─ genMatchExercise(pairs, question) — click-to-match columns
  │   ├─ genSortExercise(items, question) — tap-to-order
  │   ├─ genDragOrder(items, question) — drag-to-reorder list
  │   ├─ genDragMatch(sources, targets, question) — drag source to target
  │   └─ genDragZone(items, zones, question) — drag into category zones
  │
  ├─ renderWorksheet(worksheet) → HTML string
  │   ├─ renderMatch(ex) — re-render match columns after interaction
  │   ├─ renderSort(ex, isResults) — re-render sort area
  │   ├─ renderDragOrder(ex, isResults) — reorderable list
  │   ├─ renderDragMatch(ex, isResults) — sources + target zones
  │   └─ renderDragZone(ex, isResults) — pool + category zones
  │
  └─ attachHandlers(worksheet, container)
      ├─ Option clicks (toggle selection)
      ├─ Match delegation (click left→right to pair)
      ├─ Sort delegation (click pool→order to place/remove)
      ├─ Drag system (HTML5 DnD + touch events with floating clone)
      │   ├─ initDragHandlers — sets up all DnD/touch listeners
      │   ├─ removeDragHandlers — cleanup to prevent listener accumulation
      │   └─ processDragDrop — routes drop to correct exercise type
      ├─ Check Answers (score + re-render results)
      ├─ Try Again (generate fresh worksheet)
      └─ Enter key shortcut for inputs
```

### Route Usage

| Route | What renders |
|-------|-------------|
| `#/play` 🎮 | Free-play generator form → worksheet result in `#genResult` (renamed from `/generator`) |
| `#/generator` | Legacy alias for `/play` (both routes map to the same page) |
| `#/worksheet` | Free-play generator form → worksheet result in `#wsResult` |
| `#/worksheet?quest=ID` | Quest-mode worksheet with pre-selected subject, quest banner, difficulty scaling, and Claim Reward flow |
| Both free-play routes | Uses shared `renderGeneratorForm(container, prefix)` with no quest data |
| Quest mode | Uses `renderGeneratorForm(container, prefix, questData)` with quest banner, locked subject dropdown, and `onQuestComplete` callback in `attachHandlers()` |

---

## ⚙️ GitHub Actions Deployment

The project uses a GitHub Actions workflow (`.github/workflows/deploy.yml`) to deploy to GitHub Pages:

1. On push to `master`, the workflow:
   - Checks out the repo
   - Validates that `SUPABASE_URL` and `SUPABASE_ANON_KEY` secrets are set
   - Creates `config.js` from the secrets
   - Uploads the build artifact
   - Deploys to GitHub Pages
2. **Required secrets** (set in repo → Settings → Secrets → Actions):
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_ANON_KEY`: Supabase anon/public key
