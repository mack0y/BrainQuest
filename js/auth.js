// ═══════════════════════════════════════════
// BrainQuest – Authentication Module
// ═══════════════════════════════════════════

const Auth = {
  currentUser: null,
  currentProfile: null,
  authListener: null,
  initialized: false,

  // Initialize auth listener
  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Check for existing session
    try {
      const session = await getSession();
      if (session?.user) {
        this.currentUser = session.user;
        this.currentProfile = await getProfile(session.user.id);
      }
    } catch (e) {
      console.warn('No existing session');
    }

    // Listen for auth changes
    this.authListener = onAuthChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.currentUser = session.user;
        this.currentProfile = await getProfile(session.user.id);
        await this.onLogin();
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.currentProfile = null;
        await this.onLogout();
      }
    });

    // Check URL for auth tokens (OAuth redirect)
    if (window.location.hash && window.location.hash.includes('access_token')) {
      // Supabase handles this automatically via detectSessionInUrl
    }
  },

  // Called after successful login
  async onLogin() {
    if (this.currentProfile) {
      try {
        // Initialize quest progress for new users only (checks if rows exist)
        await Gamification.initQuestProgress(this.currentProfile.id);
        // Update daily streak & login bonus
        await updateStreak(this.currentProfile.id);
        const fresh = await getProfile(this.currentProfile.id);
        if (fresh) this.currentProfile = fresh;
      } catch (e) {
        console.warn('Login update failed:', e);
      }
    }
    // Only navigate to dashboard if not already there (prevents double-nav on auth listener)
    if (App.currentRoute !== '/dashboard') {
      App.navigate('/dashboard');
    }
  },

  // Called after logout
  async onLogout() {
    App.navigate('/');
  },

  // Email/password signup
  async signUp(email, password, username) {
    try {
      await signUp(email, password, username);
      return { success: true, message: 'Check your email for a confirmation link!' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Email/password login
  async signIn(email, password) {
    try {
      await signIn(email, password);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Google OAuth
  async signInWithGoogle() {
    try {
      await signInWithGoogle();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Logout
  async logout() {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Check if user is logged in
  isLoggedIn() {
    return !!this.currentUser;
  },

  // Get XP calculation for next level
  getLevelInfo(profile) {
    if (!profile) return { level: 0, xp: 0, totalXp: 0, xpForNext: 100, progress: 0 };

    const level = profile.level || 0;
    const xp = profile.xp || 0;
    const totalXp = profile.total_xp || 0;

    // XP required per level (increases each level)
    const xpForNext = (level + 1) * 200;
    const progress = Math.min((xp / xpForNext) * 100, 100);

    return { level, xp, totalXp, xpForNext, progress };
  }
};
