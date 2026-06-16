// ═══════════════════════════════════════════
// BrainQuest – Application Controller
// ═══════════════════════════════════════════

const App = {
  currentRoute: '/',
  pages: {},
  navLinks: null,
  navToggle: null,
  navXP: null,
  navAvatar: null,
  pendingQuest: null,

  // ── INIT ──
  async init() {
    // Supabase is loaded via CDN script tag in index.html
    // The global `supabase` object should be available
    if (typeof supabase !== 'undefined' && supabase?.createClient) {
      try {
        initSupabase();
      } catch (e) {
        console.warn('Supabase init failed:', e);
      }
    } else {
      console.warn('Supabase library not loaded, using offline demo mode');
    }

    // Init Auth
    await Auth.init();

    // Cache DOM refs
    this.navLinks = document.querySelector('.nav__links');
    this.navToggle = document.querySelector('.nav__toggle');
    this.navXP = document.querySelector('.nav__xp');
    this.navAvatar = document.querySelector('.nav__avatar');

    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());

    // Mobile nav toggle
    if (this.navToggle) {
      this.navToggle.addEventListener('click', () => {
        this.navLinks.classList.toggle('nav__links--open');
      });
    }

    // Initial render
    this.render();
  },

  // Load external script dynamically
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  // ── ROUTING ──
  handleRoute() {
    this.pendingQuest = null; // Clear stale quest state
    let hash = window.location.hash.slice(1) || '/';
    // Parse query params from hash (e.g., /worksheet?quest=1)
    const qIndex = hash.indexOf('?');
    if (qIndex !== -1) {
      const queryStr = hash.slice(qIndex + 1);
      hash = hash.slice(0, qIndex);
      const params = new URLSearchParams(queryStr);
      if (params.get('quest')) {
        const questId = parseInt(params.get('quest'));
        if (questId) this.pendingQuest = { questId };
      }
    }
    this.navigate(hash, false);
  },

  async navigate(path, pushState = true) {
    if (pushState) {
      // Setting hash triggers hashchange → handleRoute → render
      // Don't render here to avoid double renders with stale state
      window.location.hash = '#' + path;
      return;
    }
    this.currentRoute = path;
    await this.render();
  },

  // ── RENDER ──
  async render() {
    const isLoggedIn = Auth.isLoggedIn();
    const route = this.currentRoute;

    // Show/hide pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('page--active'));

    let pageId = 'page-home';

    if (!isLoggedIn) {
      if (route === '/login' || route === '/signup') {
        pageId = 'page-auth';
      } else {
        pageId = 'page-home';
      }
    } else {
      switch (true) {
        case route === '/dashboard':
        case route === '/':
          pageId = 'page-dashboard';
          break;
        case route === '/quests':
          pageId = 'page-quests';
          break;
        case route.startsWith('/worksheet'):
          pageId = 'page-worksheet';
          break;
        case route === '/leaderboard':
          pageId = 'page-leaderboard';
          break;
        case route === '/badges':
          pageId = 'page-badges';
          break;
        case route === '/profile':
          pageId = 'page-profile';
          break;
        case route === '/generator':
        case route === '/play':
          pageId = 'page-generator';
          break;
        default:
          pageId = 'page-dashboard';
      }
    }

    const page = document.getElementById(pageId);
    if (page) page.classList.add('page--active');

    // Update nav
    this.updateNav(isLoggedIn);

    // Render page content (await async renderers)
    await this.renderPage(pageId);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Re-init scroll reveal for new content
    setTimeout(() => UI.initScrollReveal(), 100);
  },

  // ── UPDATE NAV ──
  updateNav(isLoggedIn) {
    // Nav links visibility
    if (this.navLinks) {
      const links = this.navLinks.querySelectorAll('.nav__link');
      links.forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('nav__link--active', href === `#${this.currentRoute}`);
      });
    }

    // XP badge
    if (this.navXP) {
      if (!isLoggedIn) {
        this.navXP.style.display = 'none';
      } else {
        this.navXP.style.display = 'flex';
        const profile = Auth.currentProfile;
        if (profile) {
          const { level, xp, xpForNext } = Auth.getLevelInfo(profile);
          this.navXP.innerHTML = `<span class="nav__xp-icon">⭐</span> <span>${UI.formatXp(xp)} / ${UI.formatXp(xpForNext)} XP</span>`;
        } else {
          this.navXP.innerHTML = `<span class="nav__xp-icon">⭐</span> <span>0 XP</span>`;
        }
      }
    }

    // Avatar
    if (this.navAvatar) {
      if (!isLoggedIn) {
        this.navAvatar.style.display = 'none';
      } else {
        this.navAvatar.style.display = 'flex';
        const profile = Auth.currentProfile;
        this.navAvatar.innerHTML = profile?.avatar_url || '🧙';
        if (profile) {
          const levelBadge = document.createElement('span');
          levelBadge.className = 'nav__avatar-badge';
          levelBadge.textContent = profile.level || 0;
          this.navAvatar.appendChild(levelBadge);
        }
      }
    }

    // Start Quest / Profile button
    const navBtn = document.querySelector('.nav__btn');
    if (navBtn) {
      if (isLoggedIn) {
        navBtn.textContent = '⚔️ Dashboard';
        navBtn.onclick = () => App.navigate('/dashboard');
      } else {
        navBtn.textContent = 'Start Quest ⚔️';
        navBtn.onclick = () => App.navigate('/login');
      }
    }
  },

  // ── RENDER PAGE CONTENT ──
  async renderPage(pageId) {
    switch (pageId) {
      case 'page-home':
        this.renderHome();
        break;
      case 'page-auth':
        this.renderAuth();
        break;
      case 'page-dashboard':
        await this.renderDashboard();
        break;
      case 'page-quests':
        await this.renderQuests();
        break;
      case 'page-worksheet':
        await this.renderWorksheet();
        break;
      case 'page-leaderboard':
        await this.renderLeaderboard();
        break;
      case 'page-badges':
        await this.renderBadges();
        break;
      case 'page-profile':
        await this.renderProfile();
        break;
      case 'page-generator':
        this.renderGenerator();
        break;
    }
  },

  // ═══════════════════════════════════════════
  // PAGE: HOME (Hero / Landing)
  // ═══════════════════════════════════════════
  renderHome() {
    // Static content already in HTML, nothing dynamic needed
  },

  // ═══════════════════════════════════════════
  // PAGE: AUTH (Login / Signup)
  // ═══════════════════════════════════════════
  renderAuth() {
    const container = document.querySelector('#page-auth .auth-card');
    if (!container || container.dataset.rendered) return;
    container.dataset.rendered = 'true';

    const isSignup = this.currentRoute === '/signup';

    container.innerHTML = `
      <div class="auth-card__logo">🧠</div>
      <div class="auth-card__title">${isSignup ? 'Begin Your Quest' : 'Welcome Back'}</div>
      <div class="auth-card__sub">${isSignup ? 'Create your account to start learning!' : 'Log in to continue your adventure'}</div>

      <div class="auth-tabs">
        <button class="auth-tab ${!isSignup ? 'auth-tab--active' : ''}" onclick="App.navigate('/login')">Log In</button>
        <button class="auth-tab ${isSignup ? 'auth-tab--active' : ''}" onclick="App.navigate('/signup')">Sign Up</button>
      </div>

      <div class="auth-error" id="authError"></div>

      <form class="auth-form" id="authForm" onsubmit="return false;">
        ${isSignup ? `
        <div class="auth-form__group">
          <label class="auth-form__label">Username</label>
          <input class="auth-form__input" id="authUsername" type="text" placeholder="Choose a cool name..." required />
        </div>
        ` : ''}
        <div class="auth-form__group">
          <label class="auth-form__label">Email</label>
          <input class="auth-form__input" id="authEmail" type="email" placeholder="your@email.com" required />
        </div>
        <div class="auth-form__group">
          <label class="auth-form__label">Password</label>
          <input class="auth-form__input" id="authPassword" type="password" placeholder="••••••••" required minlength="6" />
        </div>
        <button class="auth-form__btn" type="submit">${isSignup ? '⚔️ Start Your Quest' : '🚀 Log In'}</button>
      </form>

      <div class="auth-divider">or continue with</div>

      <button class="btn-google" onclick="Auth.signInWithGoogle()">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.697 1.24 6.65l4.026 3.115Z"/><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/><path fill="#4A90E2" d="M19.834 21c2.195-2.016 3.534-5.02 3.534-9 0-.673-.069-1.395-.2-2H12v4.727h6.091a4.769 4.769 0 0 1-2.052 2.286l3.794 2.987Z"/><path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.534.357-2.235L1.24 6.65A11.936 11.936 0 0 0 0 12c0 1.92.457 3.74 1.24 5.35l4.037-3.082Z"/></svg>
        Continue with Google
      </button>
    `;

    // Handle form submission
    const form = document.getElementById('authForm');
    const errorEl = document.getElementById('authError');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const username = document.getElementById('authUsername')?.value.trim();

      errorEl.classList.remove('auth-error--show');
      const submitBtn = form.querySelector('.auth-form__btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Loading...';

      let result;
      if (isSignup) {
        result = await Auth.signUp(email, password, username || 'Young Scholar');
      } else {
        result = await Auth.signIn(email, password);
      }

      submitBtn.disabled = false;
      submitBtn.textContent = isSignup ? '⚔️ Start Your Quest' : '🚀 Log In';

      if (!result.success) {
        errorEl.textContent = result.message;
        errorEl.classList.add('auth-error--show');
      }
    });
  },

  // ═══════════════════════════════════════════
  // PAGE: DASHBOARD
  // ═══════════════════════════════════════════
  async renderDashboard() {
    const container = document.querySelector('#page-dashboard .dashboard-content');
    if (!container) return;

    const profile = Auth.currentProfile;
    if (!profile) {
      container.innerHTML = `<div class="auth-loading"><div class="spinner"></div><p>Loading your quest...</p></div>`;
      return;
    }

    const { level, xp, totalXp, xpForNext, progress } = Auth.getLevelInfo(profile);

    // Update HUD
    const hudAvatar = document.querySelector('.hud__avatar');
    const hudLevel = document.querySelector('.hud__avatar-level');
    const hudName = document.querySelector('.hud__name');
    const hudRank = document.querySelector('.hud__rank');
    const hudXpLabel = document.querySelector('.hud__xp-label span:last-child');
    const hudXpFill = document.querySelector('.hud__xp-fill');
    const statSheets = document.getElementById('statSheets');
    const statStreak = document.getElementById('statStreak');

    if (hudAvatar) hudAvatar.textContent = profile.avatar_url || '🧙';
    if (hudLevel) hudLevel.textContent = `Lv.${level}`;
    if (hudName) hudName.textContent = profile.display_name || 'Young Scholar';
    if (hudRank) hudRank.textContent = `⚔️ ${this.getRankTitle(level)}`;
    if (hudXpLabel) hudXpLabel.textContent = `${UI.formatXp(xp)} / ${UI.formatXp(xpForNext)} XP`;
    if (hudXpFill) hudXpFill.style.width = `${progress}%`;
    if (statStreak) statStreak.textContent = `🔥 ${profile.streak_days || 0}`;

    // Dashboard main content
    try {
      const questStatuses = await Gamification.getQuestStatuses(profile.id);
      const completedQuests = questStatuses.filter(q => q.progress.status === 'completed').length;
      if (statSheets) statSheets.textContent = completedQuests;

      this.renderQuestPath(container, questStatuses);
    } catch (e) {
      container.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:40px;">Could not load quests. Make sure you've run the database schema in Supabase.</p>`;
    }
  },

  // ═══════════════════════════════════════════
  // PAGE: QUESTS (Full quest map)
  // ═══════════════════════════════════════════
  async renderQuests() {
    const container = document.querySelector('#page-quests .quests-content');
    if (!container) return;

    const profile = Auth.currentProfile;
    if (!profile) {
      container.innerHTML = `<div class="auth-loading"><div class="spinner"></div></div>`;
      return;
    }

    try {
      const questStatuses = await Gamification.getQuestStatuses(profile.id);
      this.renderQuestPath(container, questStatuses, true);
    } catch (e) {
      container.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:40px;">Could not load quests.</p>`;
    }
  },

  renderQuestPath(container, quests, showFullMap = false) {
    const accentColors = ['green', 'primary', 'secondary', 'amber', 'rose', 'cyan'];

    container.innerHTML = `
      <div class="s-head reveal">
        <div>
          <div class="section__label">⚔️ Quest Path</div>
          <div class="section__title">${showFullMap ? 'The Full Adventure' : 'Your Quest Progress'}</div>
        </div>
        ${showFullMap ? '' : '<a href="#/quests" class="section__more">Full quest map →</a>'}
      </div>
      <div class="quest-path">
        <div class="quest-path__line"></div>
        ${quests.map((quest, i) => this.questNodeHTML(quest, i, accentColors)).join('')}
      </div>
    `;

    // Re-init scroll reveal for the newly added .reveal elements
    UI.initScrollReveal();

    // Attach quest start handlers — navigate to worksheet with quest param
    container.querySelectorAll('.quest-node__btn--start').forEach(btn => {
      btn.addEventListener('click', () => {
        const questId = parseInt(btn.dataset.questId);
        if (!questId) return;
        App.navigate(`/worksheet?quest=${questId}`);
      });
    });
  },

  questNodeHTML(quest, index, accentColors) {
    const status = quest.progress?.status || 'locked';
    const isLocked = status === 'locked';
    const isDone = status === 'completed';
    const isCurrent = status === 'available' || status === 'in_progress';

    let nodeClass = '';
    let levelContent = '';
    let btnClass = 'quest-node__btn--locked';
    let btnText = '🔒 Locked';
    let btnDisabled = 'disabled';
    let badges = `<span class="badge badge--locked">🔒 Need Lv. ${index}</span>`;

    if (isDone) {
      nodeClass = 'quest-node--done';
      levelContent = '✓';
      btnClass = 'quest-node__btn--done';
      btnText = '✓ Completed';
      btnDisabled = 'disabled';
      badges = `<span class="badge badge--done">✓ Completed</span>`;
    } else if (isCurrent) {
      nodeClass = 'quest-node--current';
      levelContent = quest.level;
      btnClass = 'quest-node__btn--start';
      btnText = `${quest.icon || '⚔️'} Learn →`;
      btnDisabled = '';
      badges = `<span class="badge badge--active">▶ Available</span>`;
    } else {
      nodeClass = 'quest-node--locked';
      levelContent = '🔒';
      btnClass = 'quest-node__btn--locked';
      btnText = `🔒 Complete Level ${index} First`;
      btnDisabled = 'disabled';
      badges = `<span class="badge badge--locked">🔒 Need Lv. ${index}</span>`;
    }

    const accent = accentColors[index % accentColors.length];

    return `
      <div class="quest-node ${nodeClass} reveal">
        <div class="quest-node__level">
          <div class="quest-node__level-num">${levelContent}</div>
          <div class="quest-node__level-txt">${isDone ? 'Done' : 'Level'}</div>
        </div>
        <div class="quest-node__card quest-node__card--${accent}">
          ${isCurrent ? '<div class="quest-node__pulse"></div>' : ''}
          <div class="quest-node__top">
            <div class="quest-node__title">${quest.icon || '⚔️'} Level ${quest.level} — ${quest.title}</div>
            <div class="quest-node__badges">${badges}</div>
          </div>
          <div class="quest-node__desc">${quest.description || ''}</div>
          <div class="quest-node__footer">
            <div class="quest-node__xp"><span>⭐</span>+${quest.xp_reward} XP on completion</div>
            <button class="quest-node__btn ${btnClass}" data-quest-id="${quest.id}" ${btnDisabled}>${btnText}</button>
          </div>
        </div>
      </div>
    `;
  },

  // ═══════════════════════════════════════════
  // PAGE: WORKSHEET (standalone — reuses generator form)
  // ═══════════════════════════════════════════
  async renderWorksheet() {
    const container = document.querySelector('#page-worksheet .worksheet-content');
    if (!container) return;

    // Check if we have a pending quest
    let questData = null;
    if (this.pendingQuest && this.pendingQuest.questId) {
      try {
        const quests = await getQuests();
        questData = quests.find(q => q.id === this.pendingQuest.questId) || null;
        if (!questData) this.pendingQuest = null;
      } catch (e) {
        this.pendingQuest = null;
      }
    }

    this.renderGeneratorForm(container, 'ws', questData);
  },

  // ═══════════════════════════════════════════
  // PAGE: GENERATOR
  // ═══════════════════════════════════════════
  renderGenerator() {
    const container = document.querySelector('#page-generator .generator-content');
    if (!container) return;
    this.renderGeneratorForm(container, 'gen');
  },

  // ── SHARED GENERATOR FORM (used by both worksheet, generator, and quest-mode) ──
  renderGeneratorForm(container, prefix, questData = null) {
    const isQuestMode = !!questData;
    const label = isQuestMode
      ? `${questData.icon || '⚔️'} ${questData.title}`
      : (prefix === 'gen' ? '🎮 Let\'s Play!' : 'Craft a Worksheet');
    const desc = isQuestMode
      ? `Complete this worksheet to earn ${questData.xp_reward} XP and unlock the next quest!`
      : (prefix === 'gen'
        ? 'Pick a subject, grade, and difficulty. Practice anything you want!'
        : 'Pick a subject, grade, and difficulty. Then complete the worksheet to earn XP and level up!');

    const subjectMap = {
      'Alphabets': 0,
      'Numbers': 1,
      'Maths': 2,
      'Vocabulary': 3,
      'Coloring': 4,
      'Puzzles': 5
    };
    const questSubjectIdx = isQuestMode && questData.subject !== 'General'
      ? subjectMap[questData.subject]
      : -1;

    container.innerHTML = `
      ${isQuestMode ? `
      <div class="ws__quest-banner reveal">
        <span class="ws__quest-banner-icon">${questData.icon || '⚔️'}</span>
        <div>
          <div class="ws__quest-banner-title">⚔️ Quest: ${questData.title}</div>
          <div style="font-size:0.78rem;color:var(--text-dim);">⭐ ${questData.xp_reward} XP reward · Pass with 60%+</div>
        </div>
        <span class="ws__quest-banner-sub">Level ${questData.level}</span>
      </div>
      ` : ''}
      <div class="s-head reveal">
        <div>
          <div class="section__label">${isQuestMode ? `${questData.icon || '⚔️'} Quest Activity` : '✨ Pick Your Practice'}</div>
          <div class="section__title">${label}</div>
        </div>
      </div>
      <div class="generator-card reveal">
        <div class="generator__text">
          <p>${desc}</p>
        </div>
        <div class="generator__controls">
          <select class="generator__select" id="${prefix}Subject" ${isQuestMode && questSubjectIdx >= 0 ? 'disabled' : ''}>
            <option ${questSubjectIdx === 0 ? 'selected' : ''}>🔤 Realm: Alphabets</option>
            <option ${questSubjectIdx === 1 ? 'selected' : ''}>🔢 Realm: Numbers</option>
            <option ${questSubjectIdx === 2 ? 'selected' : ''}>➕ Realm: Maths</option>
            <option ${questSubjectIdx === 3 ? 'selected' : ''}>📖 Realm: Vocabulary</option>
            <option ${questSubjectIdx === 4 ? 'selected' : ''}>🎨 Realm: Coloring</option>
            <option ${questSubjectIdx === 5 ? 'selected' : ''}>🧩 Realm: Puzzles</option>
          </select>
          <select class="generator__select" id="${prefix}Grade">
            <option ${isQuestMode && questData.level <= 1 ? 'selected' : ''}>👶 Grade: Preschool</option>
            <option ${!isQuestMode || (questData.level > 1 && questData.level <= 3) ? 'selected' : ''}>🎒 Grade: Kindergarten</option>
            <option>1️⃣ Grade: Grade 1</option>
            <option>2️⃣ Grade: Grade 2</option>
            <option>3️⃣ Grade: Grade 3</option>
            <option>4️⃣ Grade: Grades 4–5</option>
          </select>
          <select class="generator__select" id="${prefix}Difficulty">
            <option ${!isQuestMode || questData.level <= 2 ? 'selected' : ''}>⭐ Difficulty: Easy Quest</option>
            <option ${isQuestMode && questData.level > 2 && questData.level <= 4 ? 'selected' : ''}>⭐⭐ Difficulty: Normal Quest</option>
            <option ${isQuestMode && questData.level > 4 ? 'selected' : ''}>⭐⭐⭐ Difficulty: Epic Quest</option>
            <option>💀 Difficulty: Legendary</option>
          </select>
          <button class="generator__btn" onclick="App.generateWorksheetFor('${prefix}')">${isQuestMode ? '⚔️ Start Quest Worksheet' : '⚔️ Start'}</button>
        </div>
      </div>
      <div id="${prefix}Result" style="margin-top:24px;"></div>
    `;
  },

  // ═══════════════════════════════════════════
  // PAGE: LEADERBOARD
  // ═══════════════════════════════════════════
  async renderLeaderboard() {
    const container = document.querySelector('#page-leaderboard .leaderboard-content');
    if (!container) return;

    container.innerHTML = `
      <div class="s-head reveal">
        <div>
          <div class="section__label">🏆 Top Players</div>
          <div class="section__title">Top Brain Questers</div>
        </div>
      </div>
      <div class="leaderboard reveal" id="lbTable">
        <div class="leaderboard__header">
          <span style="font-size:1.3rem">🏆</span>
          <h3>Top Players</h3>
        </div>
        <div class="auth-loading" id="lbLoading"><div class="spinner"></div></div>
      </div>
    `;

    try {
      const leaders = await getLeaderboard(10);
      const lbTable = document.getElementById('lbTable');
      const loading = document.getElementById('lbLoading');

      if (loading) loading.remove();

      if (!leaders || leaders.length === 0) {
        lbTable.innerHTML += `<div class="leaderboard__row" style="justify-content:center;padding:40px;color:var(--text-dim)">No players yet. Be the first!</div>`;
        return;
      }

      const rankIcons = ['🥇', '🥈', '🥉'];
      const rankClasses = ['leaderboard__rank--gold', 'leaderboard__rank--silver', 'leaderboard__rank--bronze'];

      leaders.forEach((player, i) => {
        const isMe = Auth.currentProfile && Auth.currentProfile.id === player.id;
        const rankDisplay = i < 3 ? rankIcons[i] : (i + 1);
        const rankClass = i < 3 ? rankClasses[i] : 'leaderboard__rank--plain';

        const row = document.createElement('div');
        row.className = `leaderboard__row ${isMe ? 'leaderboard__row--me' : ''}`;
        row.innerHTML = `
          <span class="leaderboard__rank ${rankClass}">${rankDisplay}</span>
          <div class="leaderboard__avatar">${player.avatar_url || '🧙'}</div>
          <div class="leaderboard__info">
            <div class="leaderboard__name">${player.display_name || 'Scholar'} ${isMe ? '(You)' : ''}</div>
            <div class="leaderboard__level">⚔️ Level ${player.level || 0}</div>
          </div>
          <div class="leaderboard__xp">${UI.formatXp(player.total_xp || 0)} XP</div>
        `;
        lbTable.appendChild(row);
      });
    } catch (e) {
      const loading = document.getElementById('lbLoading');
      if (loading) {
        loading.innerHTML = `<p style="color:var(--text-dim);padding:40px;">Leaderboard not available. Make sure your database is set up.</p>`;
      }
    }
  },

  // ═══════════════════════════════════════════
  // PAGE: BADGES
  // ═══════════════════════════════════════════
  async renderBadges() {
    const container = document.querySelector('#page-badges .badges-content');
    if (!container) return;

    const profile = Auth.currentProfile;
    if (!profile) {
      container.innerHTML = `<div class="auth-loading"><div class="spinner"></div></div>`;
      return;
    }

    container.innerHTML = `
      <div class="s-head reveal">
        <div>
          <div class="section__label">🏆 Badges</div>
          <div class="section__title">Your Badge Collection</div>
        </div>
      </div>
      <div class="badges-shelf" id="badgeShelf">
        <div class="auth-loading"><div class="spinner"></div></div>
      </div>
    `;

    try {
      const allBadges = await getBadges();
      const userBadges = await getUserBadges(profile.id);
      const ownedIds = new Set(userBadges.map(b => b.badge_id));

      const shelf = document.getElementById('badgeShelf');
      shelf.innerHTML = '';

      if (!allBadges || allBadges.length === 0) {
        shelf.innerHTML = `<p style="color:var(--text-dim);text-align:center;grid-column:1/-1;padding:40px;">No badges available yet.</p>`;
        return;
      }

      allBadges.forEach(badge => {
        const owned = ownedIds.has(badge.id);
        const card = document.createElement('div');
        card.className = `reward-card reveal ${owned ? '' : 'reward-card--locked'}`;
        card.innerHTML = `
          <div class="reward-card__shine"></div>
          <span class="reward-card__icon">${badge.icon || '🏅'}</span>
          <div class="reward-card__name">${badge.name}</div>
          <div class="reward-card__req">${owned ? '✓ Earned!' : (badge.description || '🔒 Locked')}</div>
        `;
        shelf.appendChild(card);
      });

      // Init scroll reveal for the dynamically added badge cards
      UI.initScrollReveal();
    } catch (e) {
      const shelf = document.getElementById('badgeShelf');
      if (shelf) shelf.innerHTML = `<p style="color:var(--text-dim);text-align:center;grid-column:1/-1;padding:40px;">Badges not available.</p>`;
    }
  },

  // ═══════════════════════════════════════════
  // PAGE: PROFILE
  // ═══════════════════════════════════════════
  async renderProfile() {
    const container = document.querySelector('#page-profile .profile-content');
    if (!container) return;

    const profile = Auth.currentProfile;
    if (!profile) {
      container.innerHTML = `<div class="auth-loading"><div class="spinner"></div></div>`;
      return;
    }

    const { level, xp, totalXp, xpForNext, progress } = Auth.getLevelInfo(profile);

    const avatarOptions = ['🧙', '🦁', '🐉', '🦊', '🐺', '🦅', '🐻', '🦄', '🐱', '🐸'];

    container.innerHTML = `
      <div class="s-head reveal">
        <div>
          <div class="section__label">⚙️ My Stuff</div>
          <div class="section__title">Your Profile</div>
        </div>
      </div>

      <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-xl);padding:36px;max-width:600px;">
        <div style="display:flex;align-items:center;gap:24px;margin-bottom:28px;flex-wrap:wrap;">
          <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--secondary),var(--primary));display:flex;align-items:center;justify-content:center;font-size:2.5rem;box-shadow:0 0 24px var(--secondary-ghost);">
            <span id="profileAvatar">${profile.avatar_url || '🧙'}</span>
          </div>
          <div>
            <div style="font-family:'Fredoka One',sans-serif;font-size:1.3rem;color:var(--white);">${profile.display_name || 'Young Scholar'}</div>
            <div style="color:var(--primary);font-weight:600;font-size:0.85rem;">⚔️ ${this.getRankTitle(level)} · Level ${level}</div>
            <div style="color:var(--text-dim);font-size:0.8rem;margin-top:4px;">${UI.formatXp(totalXp)} Total XP</div>
          </div>
        </div>

        <div style="margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;">
            <span>Level Progress</span>
            <span>${UI.formatXp(xp)} / ${UI.formatXp(xpForNext)} XP</span>
          </div>
          <div style="height:8px;background:var(--bg-card);border-radius:var(--r-full);overflow:hidden;">
            <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,var(--secondary),var(--primary));border-radius:var(--r-full);transition:width 0.6s ease;"></div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
          <div style="background:var(--bg-card);border-radius:var(--r-md);padding:16px;text-align:center;">
            <div style="font-family:'Fredoka One',sans-serif;font-size:1.1rem;color:var(--white);">${profile.streak_days || 0}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Day Streak</div>
          </div>
          <div style="background:var(--bg-card);border-radius:var(--r-md);padding:16px;text-align:center;">
            <div style="font-family:'Fredoka One',sans-serif;font-size:1.1rem;color:var(--white);">Lv.${level}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Level</div>
          </div>
        </div>

        <div style="margin-bottom:20px;">
          <label style="font-size:0.78rem;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:8px;">Display Name</label>
          <input id="profileName" class="auth-form__input" value="${profile.display_name || ''}" style="width:100%;" />
        </div>

        <div style="margin-bottom:24px;">
          <label style="font-size:0.78rem;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:8px;">Avatar</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${avatarOptions.map(a => `
              <span class="profile-avatar-option" data-avatar="${a}" style="
                width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;
                font-size:1.3rem;cursor:pointer;border:2px solid ${profile.avatar_url === a ? 'var(--primary)' : 'var(--border)'};
                background:${profile.avatar_url === a ? 'var(--primary-ghost)' : 'transparent'};
                transition:all 0.15s;
              ">${a}</span>
            `).join('')}
          </div>
        </div>

        <button class="hero__btn-primary" id="saveProfileBtn" onclick="App.saveProfile()">💾 Save Changes</button>

        <hr style="border:none;border-top:1px solid var(--border);margin:28px 0;" />

        <button class="quest-node__btn quest-node__btn--locked" onclick="Auth.logout()" style="width:100%;padding:12px;">🚪 Sign Out</button>
      </div>
    `;

    // Avatar selector
    document.querySelectorAll('.profile-avatar-option').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.profile-avatar-option').forEach(x => {
          x.style.borderColor = 'var(--border)';
          x.style.background = 'transparent';
        });
        el.style.borderColor = 'var(--primary)';
        el.style.background = 'var(--primary-ghost)';
        document.getElementById('profileAvatar').textContent = el.dataset.avatar;
      });
    });
  },

  async saveProfile() {
    const profile = Auth.currentProfile;
    if (!profile) return;

    const name = document.getElementById('profileName')?.value.trim();
    const selectedAvatar = document.querySelector('.profile-avatar-option[style*="border-color: var(--primary)"]');
    const avatar = selectedAvatar?.dataset?.avatar || profile.avatar_url;

    const btn = document.getElementById('saveProfileBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
      await updateProfile(profile.id, {
        display_name: name || profile.display_name,
        avatar_url: avatar
      });
      Auth.currentProfile = await getProfile(profile.id);
      UI.showToast('Profile Saved!', 'Your changes have been updated.', '✅');
      this.render();
    } catch (e) {
      UI.showToast('Error', 'Could not save profile.', '❌');
    }

    btn.disabled = false;
    btn.textContent = '💾 Save Changes';
  },

  // ═══════════════════════════════════════════
  // GENERATE WORKSHEET (shared by both generator & worksheet pages)
  // ═══════════════════════════════════════════
  generateWorksheet() {
    this.generateWorksheetFor('gen');
  },

  generateWorksheetFor(prefix) {
    const subject = document.getElementById(prefix + 'Subject')?.value || 'Alphabets';
    const grade = document.getElementById(prefix + 'Grade')?.value || 'Kindergarten';
    const difficulty = document.getElementById(prefix + 'Difficulty')?.value || 'Easy';
    const resultDiv = document.getElementById(prefix + 'Result');
    const ws = WorksheetEngine.generate(subject, grade, difficulty);
    resultDiv.innerHTML = WorksheetEngine.renderWorksheet(ws);

    // Pass quest callback if in quest mode
    const questData = this.pendingQuest;
    if (questData && questData.questId) {
      WorksheetEngine.attachHandlers(ws, resultDiv, async (score, xpEarned, pct) => {
        await this.completePendingQuest(questData.questId, score, xpEarned, pct);
      });
    } else {
      WorksheetEngine.attachHandlers(ws, resultDiv);
    }

    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Init scroll reveal for the new worksheet content
    UI.initScrollReveal();
  },

  // Complete a pending quest after passing a worksheet
  async completePendingQuest(questId, score, xpEarned, pct) {
    const profile = Auth.currentProfile;
    if (!profile || !questId) return;

    const result = await Gamification.completeQuest(profile.id, questId);
    this.pendingQuest = null;

    if (result) {
      if (result.leveledUp) {
        UI.celebrateLevelUp(result.newLevel);
      } else {
        UI.showToast('+XP Earned!', `+${result.xpGained} XP • Quest complete!`, '⭐');
      }
      // Refresh profile and navigate back to dashboard
      await Auth.onLogin();
    } else {
      UI.showToast('Error', 'Could not complete quest. Try again!', '❌');
    }
  },

  // ── HELPERS ──
  getRankTitle(level) {
    const ranks = [
      'Apprentice Explorer',
      'Curious Scholar',
      'Number Knight',
      'Math Warrior',
      'Word Wizard',
      'Multiplication Master',
      'Sage Scholar',
      'Quest Master',
      'Brain Champion',
      'Grand Champion'
    ];
    return ranks[Math.min(level, ranks.length - 1)] || 'Legendary Scholar';
  }
};

// ── BOOT ──
document.addEventListener('DOMContentLoaded', () => App.init());
