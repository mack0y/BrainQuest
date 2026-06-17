// ═══════════════════════════════════════════
// BrainQuest – Quest Progress Strip
// Extracted from app.js to reduce controller size
// ═══════════════════════════════════════════

const QuestStrip = {
  // Build a compact quest progress strip HTML string
  // Used on dashboard (above quest path) and play page
  // questStatuses: array from Gamification.getQuestStatuses() with .progress.status
  // show: false to suppress output (returns '')
  build(questStatuses, show = true) {
    if (!show || !questStatuses || questStatuses.length === 0) return '';

    const nodes = questStatuses.map(q => {
      const s = q.progress?.status || 'locked';
      const isDone = s === 'completed';
      const isCurrent = s === 'available' || s === 'in_progress';
      let cls = 'quest-strip__node';
      if (isDone) cls += ' quest-strip__node--done';
      else if (isCurrent) cls += ' quest-strip__node--current';
      else cls += ' quest-strip__node--locked';
      const href = isCurrent ? '#/worksheet?quest=' + q.id : '';
      const tag = href ? 'a' : 'span';
      const attrs = href ? 'href="' + href + '"' : '';
      const icon = q.icon || '⚔️';
      const level = q.level;
      const title = 'Level ' + level + ': ' + q.title + (isDone ? ' ✓' : '');
      const statusIcon = isDone ? '✓' : isCurrent ? '▶' : '🔒';
      return '<' + tag + ' ' + attrs + ' class="' + cls + '" title="' + title + '">' +
        '<span class="quest-strip__icon">' + icon + '</span>' +
        '<span class="quest-strip__level">Lv.' + level + '</span>' +
        '<span class="quest-strip__status">' + statusIcon + '</span>' +
        '</' + tag + '>';
    }).join('');

    return '<div class="quest-strip reveal">' +
      '<div class="quest-strip__header">' +
      '<span class="quest-strip__label">⚔️ Quest Progress</span>' +
      '<a href="#/quests" class="quest-strip__more">Full map →</a>' +
      '</div>' +
      '<div class="quest-strip__track">' + nodes + '</div>' +
      '</div>';
  }
};
