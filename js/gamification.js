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
      const progressMap = {};
      progress.forEach(p => { progressMap[p.quest_id] = p; });

      // Check if previous quest is completed to unlock current
      for (let i = 0; i < quests.length; i++) {
        const quest = quests[i];
        const prog = progressMap[quest.id];

        if (!prog || prog.status === 'locked') {
          // Check if previous quest is completed
          if (i === 0) {
            // First quest should be available
            if (!prog) {
              await updateQuestProgress(userId, quest.id, 'available');
              progressMap[quest.id] = { status: 'available' };
            }
          } else {
            const prevQuest = quests[i - 1];
            const prevProg = progressMap[prevQuest.id];
            if (prevProg && prevProg.status === 'completed') {
              if (!prog || prog.status === 'locked') {
                await updateQuestProgress(userId, quest.id, 'available');
                progressMap[quest.id] = { status: 'available' };
              }
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
