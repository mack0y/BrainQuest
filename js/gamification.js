// ═══════════════════════════════════════════
// BrainQuest – Gamification Engine
// ═══════════════════════════════════════════

// ── CONSTANTS ──
const XP = {
  // XP needed for level N → N+1: XP_FOR_LEVEL(N) = Math.floor(BASE * Math.pow(SCALE, N))
  // Level 0→1: 100, Level 1→2: 125, Level 5→6: ~305, Level 10→11: ~931
  // Total to reach Level 10: ~7,200 XP (feasible with varied worksheets)
  BASE: 100,
  SCALE: 1.25,
  // Difficulty multipliers for worksheet XP
  DIFFICULTY: { easy: 1, normal: 1.5, hard: 2.5, legendary: 4 },
  // Base XP per exercise type
  EXERCISE: { basic: 10, standard: 15, advanced: 20, challenge: 25, mastery: 30 },
  // Quest/base XP rewards map to these tiers
  // Helper: calculate XP needed for a specific level
  forLevel(lvl) { return Math.floor(this.BASE * Math.pow(this.SCALE, lvl)); },
  // Helper: calculate total XP to reach a level
  totalForLevel(lvl) {
    let total = 0;
    for (let i = 0; i < lvl; i++) total += this.forLevel(i);
    return total;
  }
};

const BADGE_CACHE_TTL = 60000; // 1 minute badge cache

const Gamification = {
  // Badge cache to avoid redundant DB queries
  _badgeCache: null,
  _badgeCacheTime: 0,

  _getCachedBadges() {
    if (this._badgeCache && Date.now() - this._badgeCacheTime < BADGE_CACHE_TTL) {
      return this._badgeCache;
    }
    return null;
  },

  _setCachedBadges(data) {
    this._badgeCache = data;
    this._badgeCacheTime = Date.now();
  },

  _getCachedUserBadges(userId) {
    const key = 'ub_' + userId;
    const cached = this[key];
    if (cached && Date.now() - cached.time < BADGE_CACHE_TTL) {
      return cached.data;
    }
    return null;
  },

  _setCachedUserBadges(userId, data) {
    this['ub_' + userId] = { data, time: Date.now() };
  },
  // Add XP to user profile
  async addXp(userId, amount, source = 'quest') {
    if (!userId || !amount) return null;

    try {
      const profile = await getProfile(userId);
      if (!profile) return null;

      let carryXp = (profile.xp || 0) + amount;
      const newTotalXp = (profile.total_xp || 0) + amount;

      let leveledUp = false;
      let newLevel = profile.level;

      // Handle multiple level-ups in a single call using exponential formula
      while (carryXp >= XP.forLevel(newLevel)) {
        carryXp -= XP.forLevel(newLevel);
        newLevel++;
        leveledUp = true;
      }

      await updateProfile(userId, {
        level: newLevel,
        xp: carryXp,
        total_xp: newTotalXp
      });

      // Refresh profile
      const updatedProfile = await getProfile(userId);
      if (Auth) Auth.currentProfile = updatedProfile;

      // Check & award badges
      await this.checkBadges(userId, updatedProfile);

      return {
        xpGained: amount,
        leveledUp,
        newLevel,
        profile: updatedProfile
      };
    } catch (e) {
      console.warn('XP update failed:', e);
      // Notify user when XP fails to save
      try {
        UI.showToast('⚠️ Sync Issue', 'XP will be saved when connected.', '⚠️');
      } catch (_) {}
      return null;
    }
  },

  // Check and award badges based on achievements
  async checkBadges(userId, profile) {
    try {
      // Use cached badges to avoid redundant DB queries
      let badges = this._getCachedBadges();
      if (!badges) {
        badges = await getBadges();
        this._setCachedBadges(badges);
      }

      let userBadges = this._getCachedUserBadges(userId);
      if (!userBadges) {
        userBadges = await getUserBadges(userId);
        this._setCachedUserBadges(userId, userBadges);
      }
      const ownedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

      for (const badge of badges) {
        if (ownedBadgeIds.has(badge.id)) continue;

        let earned = false;

        switch (badge.requirement_type) {
          case 'quest_complete': {
            const progress = await getQuestProgress(userId);
            const done = progress.filter(p => p.status === 'completed').length;
            // Use > because value 0 means "complete at least 1 quest"
            earned = done > badge.requirement_value;
            break;
          }
          case 'level_reach':
            earned = (profile.level || 0) >= badge.requirement_value;
            break;
          case 'streak':
            earned = (profile.streak_days || 0) >= badge.requirement_value;
            break;
          case 'total_xp':
            earned = (profile.total_xp || 0) >= badge.requirement_value;
            break;
          case 'all_quests': {
            const progress = await getQuestProgress(userId);
            const done = progress.filter(p => p.status === 'completed').length;
            earned = done >= badge.requirement_value;
            break;
          }
          case 'leaderboard_top': {
            // Check if user is #1 on the leaderboard
            try {
              const leaders = await getLeaderboard(1);
              earned = leaders.length > 0 && leaders[0].id === userId;
            } catch (e) {
              earned = false;
            }
            break;
          }
          default:
            break;
        }

        if (earned) {
          await awardBadge(userId, badge.id);
          // Show badge notification
          setTimeout(() => {
            UI.showToast(`🏆 ${badge.name}`, `Badge earned: ${badge.description || badge.name}`);
          }, 500);
        }
      }
    } catch (e) {
      console.warn('Badge check failed:', e);
    }
  },

  // Initialize quest progress for a new user
  async initQuestProgress(userId) {
    try {
      // Check if progress rows already exist to avoid redundant upserts on every login
      const existing = await getQuestProgress(userId);
      if (existing.length > 0) return;

      const quests = await getQuests();
      for (let i = 0; i < quests.length; i++) {
        const quest = quests[i];
        const status = i === 0 ? 'available' : 'locked';
        await updateQuestProgress(userId, quest.id, status);
      }
    } catch (e) {
      console.warn('Quest init failed:', e);
    }
  },

  // Get visible quests with status for the user
  async getQuestStatuses(userId) {
    try {
      const quests = await getQuests();
      const progress = await getQuestProgress(userId);
      const profile = await getProfile(userId);
      const userLevel = profile ? (profile.level || 0) : 0;

      const progressMap = {};
      progress.forEach(p => { progressMap[p.quest_id] = p; });

      // ── LEVEL SYNC: Auto-complete quests + award retroactive XP ──
      // If user is Level 3, quests 0-2 should be completed, quest 3 stays available
      // Award XP FIRST for each quest, then mark complete (data integrity)
      let retroXpTotal = 0;
      const newlyCompleted = [];

      for (let i = 0; i < quests.length; i++) {
        const quest = quests[i];
        const prog = progressMap[quest.id];

        // Auto-complete quest if user's level exceeds this quest's level
        if (quest.level < userLevel) {
          if (!prog || prog.status !== 'completed') {
            // Award XP FIRST
            const retroResult = await this.addXp(userId, quest.xp_reward, 'quest_sync');
            if (retroResult) {
              retroXpTotal += retroResult.xpGained;
              newlyCompleted.push(quest.id);
            }
          }
        }
      }

      // THEN mark all quests as completed (only if XP was awarded)
      for (const qid of newlyCompleted) {
        await updateQuestProgress(userId, qid, 'completed');
        progressMap[qid] = { status: 'completed' };
      }

      // Show summary toast for retroactive XP (if any was awarded)
      if (retroXpTotal > 0) {
        try {
          UI.showToast('⚔️ Quests Synced!', `+${retroXpTotal} retroactive XP awarded for past progress!`, '📜');
        } catch (_) {}
      }

      // Unlock the next quest after the last completed one
      for (let i = 0; i < quests.length; i++) {
        const quest = quests[i];
        const prog = progressMap[quest.id];

        if (!prog) {
          // Missing progress row — create it
          if (i === 0) {
            await updateQuestProgress(userId, quest.id, 'available');
            progressMap[quest.id] = { status: 'available' };
          } else {
            const prevQuest = quests[i - 1];
            const prevProg = progressMap[prevQuest.id];
            const status = prevProg && prevProg.status === 'completed' ? 'available' : 'locked';
            await updateQuestProgress(userId, quest.id, status);
            progressMap[quest.id] = { status };
          }
        } else if (prog.status === 'locked') {
          // Check if previous quest is completed
          if (i > 0) {
            const prevQuest = quests[i - 1];
            const prevProg = progressMap[prevQuest.id];
            if (prevProg && prevProg.status === 'completed') {
              await updateQuestProgress(userId, quest.id, 'available');
              progressMap[quest.id] = { status: 'available' };
            }
          }
        }
      }

      // Return enriched quests
      return quests.map(quest => ({
        ...quest,
        progress: progressMap[quest.id] || { status: 'locked' }
      }));
    } catch (e) {
      console.warn('Quest status fetch failed:', e);
      return [];
    }
  },

  // Complete a quest — award XP FIRST, then mark complete (data integrity)
  async completeQuest(userId, questId) {
    try {
      const quests = await getQuests();
      const quest = quests.find(q => q.id === questId);
      if (!quest) return null;

      // Award XP FIRST — if this fails, quest won't be marked complete, safe to retry
      const result = await this.addXp(userId, quest.xp_reward, 'quest');

      // Only mark quest complete if XP was awarded successfully
      if (result) {
        await updateQuestProgress(userId, questId, 'completed');
      }

      return result;
    } catch (e) {
      console.warn('Quest completion failed:', e);
      return null;
    }
  }
};
