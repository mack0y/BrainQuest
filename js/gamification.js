// ═══════════════════════════════════════════
// BrainQuest – Gamification Engine
// ═══════════════════════════════════════════

const Gamification = {
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

      // Handle multiple level-ups in a single call
      while (carryXp >= (newLevel + 1) * 200) {
        carryXp -= (newLevel + 1) * 200;
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
      const badges = await getBadges();
      const userBadges = await getUserBadges(userId);
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

      // SYNC: Auto-complete quests that match the user's level
      // If user is Level 3, quests 0-2 should be completed, quest 3 should be available
      for (let i = 0; i < quests.length; i++) {
        const quest = quests[i];
        const prog = progressMap[quest.id];

        // Auto-complete quest if user's level exceeds or equals this quest's level
        if (quest.level <= userLevel) {
          if (!prog || prog.status !== 'completed') {
            await updateQuestProgress(userId, quest.id, 'completed');
            progressMap[quest.id] = { status: 'completed' };
          }
        }
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

  // Complete a quest
  async completeQuest(userId, questId) {
    try {
      const quests = await getQuests();
      const quest = quests.find(q => q.id === questId);
      if (!quest) return null;

      await updateQuestProgress(userId, questId, 'completed');

      // Award XP
      const result = await this.addXp(userId, quest.xp_reward, 'quest');
      return result;
    } catch (e) {
      console.warn('Quest completion failed:', e);
      return null;
    }
  }
};
