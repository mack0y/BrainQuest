// ═══════════════════════════════════════════
// BrainQuest – Database Layer
// ═══════════════════════════════════════════

// Credentials loaded from config.js (gitignored)
// For local dev: create config.js from config.example.js
// For production: injected by GitHub Actions workflow
const CONFIG_OK = typeof BRAINQUEST_CONFIG !== 'undefined' && BRAINQUEST_CONFIG.supabaseUrl && BRAINQUEST_CONFIG.supabaseUrl.startsWith('https://');
const SUPABASE_URL = CONFIG_OK ? BRAINQUEST_CONFIG.supabaseUrl : null;
const SUPABASE_ANON_KEY = CONFIG_OK ? BRAINQUEST_CONFIG.supabaseAnonKey : null;

// Show helpful message if config is missing
if (!CONFIG_OK && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  console.log('%c🧠 BrainQuest is almost ready!', 'font-size:1.5rem;font-weight:bold');
  console.log('%cAdd SUPABASE_URL and SUPABASE_ANON_KEY as GitHub Secrets and re-run the deploy workflow.', 'font-size:1rem;color:#00f0b5');
}

// Initialize Supabase client
let _supabase;

function initSupabase() {
  const supabaseModule = window.supabase;
  if (typeof supabaseModule !== 'undefined' && supabaseModule?.createClient) {
    _supabase = supabaseModule.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return _supabase;
  }
  console.warn('Supabase client library not loaded');
  return null;
}

// ── AUTH ──
async function signUp(email, password, username) {
  const { data, error } = await _supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signInWithGoogle() {
  // Use current page URL (without hash) so OAuth returns to the same page
  // Works for both localhost (/) and GitHub Pages subfolder (/BrainQuest/)
  const redirectUrl = window.location.origin + window.location.pathname;
  const { data, error } = await _supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUrl }
  });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await _supabase.auth.signOut();
  if (error) throw error;
}

function onAuthChange(callback) {
  return _supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

async function getSession() {
  const { data, error } = await _supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// ── PROFILES ──
async function getProfile(userId) {
  const { data, error } = await _supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function updateProfile(userId, updates) {
  const { data, error } = await _supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── QUESTS ──
async function getQuests() {
  const { data, error } = await _supabase
    .from('quests')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function getQuestProgress(userId) {
  const { data, error } = await _supabase
    .from('quest_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

async function updateQuestProgress(userId, questId, status) {
  const { data, error } = await _supabase
    .from('quest_progress')
    .upsert({
      user_id: userId,
      quest_id: questId,
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    }, { onConflict: 'user_id,quest_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── WORKSHEETS ──
async function getWorksheets(subject, grade, difficulty) {
  let query = _supabase.from('worksheets').select('*');
  if (subject) query = query.eq('subject', subject);
  if (grade) query = query.eq('grade', grade);
  if (difficulty) query = query.eq('difficulty', difficulty);
  const { data, error } = await query.limit(20);
  if (error) throw error;
  return data || [];
}

async function getWorksheetById(id) {
  const { data, error } = await _supabase
    .from('worksheets')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function completeWorksheet(userId, worksheetId, score, xpEarned) {
  const { data, error } = await _supabase
    .from('worksheet_completions')
    .insert({
      user_id: userId,
      worksheet_id: worksheetId,
      score,
      xp_earned: xpEarned
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── BADGES ──
async function getBadges() {
  const { data, error } = await _supabase
    .from('badges')
    .select('*');
  if (error) throw error;
  return data || [];
}

async function getUserBadges(userId) {
  const { data, error } = await _supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

async function awardBadge(userId, badgeId) {
  const { data, error } = await _supabase
    .from('user_badges')
    .insert({ user_id: userId, badge_id: badgeId })
    .select()
    .single();
  if (error && error.code !== '23505') throw error; // ignore duplicate
  return data;
}

// ── LEADERBOARD ──
async function getLeaderboard(limit = 10) {
  const { data, error } = await _supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, level, total_xp')
    .order('total_xp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ── SUBSCRIPTION ──
async function getSubscription(userId) {
  const { data, error } = await _supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || { tier: 'free' };
}

// ── DAILY STREAK ──
async function updateStreak(userId) {
  const profile = await getProfile(userId);
  if (!profile) return null;

  const today = new Date().toISOString().split('T')[0];
  const lastLogin = profile.last_login;

  let streakDays = profile.streak_days || 0;

  if (lastLogin !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    streakDays = lastLogin === yesterdayStr ? streakDays + 1 : 1;

    // Award 10 XP login bonus through gamification system (handles level-up)
    await Gamification.addXp(userId, 10, 'login');
    // Also update streak fields separately
    await updateProfile(userId, {
      last_login: today,
      streak_days: streakDays
    });
  }

  return streakDays;
}
