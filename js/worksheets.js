// ═══════════════════════════════════════════
// BrainQuest – Worksheet Engine (Phase 2)
// Generates dynamic interactive worksheets
// ═══════════════════════════════════════════

window.WorksheetEngine = {

  // ── GENERATE a full worksheet ──
  generate(subject, grade, difficulty) {
    const exercises = this.generateExercises(subject, grade, difficulty);
    const totalXP = exercises.reduce((s, e) => s + e.xp, 0);
    return {
      id: Date.now(),
      subject: this.parseSubject(subject),
      grade: this.parseGrade(grade),
      difficulty: this.parseDifficulty(difficulty),
      title: this.makeTitle(subject, difficulty),
      exercises,
      totalXP,
      completed: false,
      score: 0
    };
  },

  parseSubject(s) {
    const map = { '🔤': 'Alphabets', '🔢': 'Numbers', '➕': 'Maths', '📖': 'Vocabulary', '🎨': 'Coloring', '🧩': 'Puzzles' };
    for (const [k, v] of Object.entries(map)) { if (s.includes(k) || s.includes(v)) return v; }
    return 'Alphabets';
  },
  parseGrade(s) {
    const g = ['Preschool', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grades 4–5'];
    for (const v of g) { if (s.includes(v)) return v; }
    return 'Kindergarten';
  },
  parseDifficulty(s) {
    if (s.includes('Legendary')) return 'legendary';
    if (s.includes('Epic')) return 'hard';
    if (s.includes('Normal')) return 'normal';
    return 'easy';
  },

  makeTitle(subject, difficulty) {
    const adj = { easy: 'Fun', normal: 'Adventure', hard: 'Epic', legendary: 'Legendary' };
    const subj = this.parseSubject(subject);
    const d = this.parseDifficulty(difficulty);
    return `${adj[d]} ${subj} Quest`;
  },

  // ── EXERCISE GENERATORS ──
  generateExercises(subject, grade, difficulty) {
    const subj = this.parseSubject(subject);
    const diff = this.parseDifficulty(difficulty);
    const gradeLevel = ['Preschool', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grades 4–5'].indexOf(this.parseGrade(grade));
    const maxNum = diff === 'easy' ? 5 : diff === 'normal' ? 10 : diff === 'hard' ? 20 : 50;
    const count = diff === 'easy' ? 5 : diff === 'normal' ? 6 : 7;

    let exercises = [];

    switch (subj) {
      case 'Alphabets': exercises = this.genAlphabets(count, gradeLevel, maxNum); break;
      case 'Numbers':   exercises = this.genNumbers(count, gradeLevel, maxNum); break;
      case 'Maths':     exercises = this.genMaths(count, gradeLevel, maxNum); break;
      case 'Vocabulary':exercises = this.genVocabulary(count, gradeLevel, maxNum); break;
      case 'Coloring':  exercises = this.genColoring(count, gradeLevel); break;
      case 'Puzzles':   exercises = this.genPuzzles(count, gradeLevel, maxNum); break;
    }

    return exercises.map((ex, i) => ({ ...ex, id: i + 1 }));
  },

  // ═══ ALPHABETS ═══
  genAlphabets(count, grade, maxNum) {
    const exercises = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const animals = { A: '🐊', B: '🐻', C: '🐱', D: '🐶', E: '🐘', F: '🦊', G: '🐸', H: '🐴', I: '🦎', J: '🦘', K: '🕊️', L: '🦁', M: '🐭', N: '🐮', O: '🦉', P: '🐧', Q: '🦆', R: '🐰', S: '🐍', T: '🐢', U: '🦄', V: '🦜', W: '🐋', X: '🦀', Y: '🐲', Z: '🦓' };

    // Letter recognition
    for (let i = 0; i < Math.min(2, count); i++) {
      const letter = letters[Math.floor(Math.random() * 26)];
      const options = this.shuffle([letter, ...this.getRandomLetters(letter, 3)]);
      exercises.push({
        type: 'choose',
        question: `Which letter is this? <span class="ws-big-letter">${letter}</span>`,
        image: animals[letter] || '🔤',
        options: options.map(l => ({ value: l, label: l })),
        answer: letter,
        xp: 15
      });
    }

    // Uppercase → lowercase matching
    if (count > 2) {
      const letter = letters[Math.floor(Math.random() * 26)];
      const lower = letter.toLowerCase();
      const options = this.shuffle([lower, ...this.getRandomLetters(lower, 3, true)]);
      exercises.push({
        type: 'choose',
        question: `Find the lowercase match for <span class="ws-big-letter">${letter}</span>`,
        options: options.map(l => ({ value: l, label: l })),
        answer: lower,
        xp: 15
      });
    }

    // Which word starts with...
    if (count > 3) {
      const letter = letters[Math.floor(Math.random() * 26)];
      const correct = this.getAnimalWord(letter);
      const wrong = this.getRandomWords(letter, 3);
      const options = this.shuffle([correct, ...wrong]);
      exercises.push({
        type: 'choose',
        question: `Which word starts with the letter <span class="ws-big-letter">${letter}</span>?`,
        options: options.map(w => ({ value: w, label: w })),
        answer: correct,
        xp: 15
      });
    }

    // Fill missing letter
    if (count > 4) {
      const word = this.getAnimalWord(letters[Math.floor(Math.random() * 26)]);
      const idx = Math.floor(Math.random() * word.length);
      const display = word.split('').map((c, i) => i === idx ? '___' : c).join(' ');
      exercises.push({
        type: 'input',
        question: `Fill in the missing letter: <span class="ws-word">${display}</span>`,
        hint: `The word is: ${word}`,
        answer: word[idx].toLowerCase(),
        accept: word[idx].toLowerCase(),
        xp: 20
      });
    }

    return exercises.slice(0, count);
  },

  // ═══ NUMBERS ═══
  genNumbers(count, grade, maxNum) {
    const exercises = [];

    // Count objects
    for (let i = 0; i < Math.min(2, count); i++) {
      const num = Math.floor(Math.random() * maxNum) + 1;
      const emojis = ['🌟', '🍎', '⭐', '🌈', '🎈', '🐟', '🌸', '🍪'].sort(() => Math.random() - 0.5);
      const emoji = emojis[0];
      const options = this.shuffle([num, ...this.getRandomNumbers(num, 3, maxNum)]);
      exercises.push({
        type: 'choose',
        question: `How many ${emoji} are there?`,
        image: emoji.repeat(num),
        options: options.map(n => ({ value: n.toString(), label: n.toString() })),
        answer: num.toString(),
        xp: 15
      });
    }

    // Number sequencing
    if (count > 2) {
      const start = Math.floor(Math.random() * (maxNum - 3)) + 1;
      const seq = [start, start + 1, start + 2];
      const blank = Math.floor(Math.random() * 3);
      const display = seq.map((n, i) => i === blank ? '___' : n).join(' → ');
      exercises.push({
        type: 'input',
        question: `What number is missing? <span class="ws-word">${display}</span>`,
        answer: seq[blank].toString(),
        accept: seq[blank].toString(),
        xp: 20
      });
    }

    // Match number to word
    if (count > 3) {
      const num = Math.floor(Math.random() * 10) + 1;
      const numWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
      const word = numWords[num - 1];
      const wrongWords = this.shuffle(numWords.filter(w => w !== word)).slice(0, 3);
      const options = this.shuffle([word, ...wrongWords]);
      exercises.push({
        type: 'choose',
        question: `Which word matches the number <span class="ws-big-letter">${num}</span>?`,
        options: options.map(w => ({ value: w, label: w })),
        answer: word,
        xp: 15
      });
    }

    // Greater than / less than
    if (count > 4) {
      const a = Math.floor(Math.random() * maxNum) + 1;
      const b = Math.floor(Math.random() * maxNum) + 1;
      exercises.push({
        type: 'choose',
        question: `Which is bigger? <span class="ws-big-letter">${a}</span> or <span class="ws-big-letter">${b}</span>?`,
        options: [
          { value: 'a', label: `${a}` },
          { value: 'b', label: `${b}` },
          { value: 'equal', label: 'Equal' }
        ],
        answer: a > b ? 'a' : b > a ? 'b' : 'equal',
        xp: 20
      });
    }

    return exercises.slice(0, count);
  },

  // ═══ MATHS ═══
  genMaths(count, grade, maxNum) {
    const exercises = [];
    const maxOp = grade < 2 ? 10 : maxNum;

    // Addition
    for (let i = 0; i < Math.min(2, count); i++) {
      const a = Math.floor(Math.random() * maxOp) + 1;
      const b = Math.floor(Math.random() * (maxOp - a)) + 1;
      const correct = a + b;
      const options = this.shuffle([correct, ...this.getRandomNumbers(correct, 3, maxOp * 2)]);
      exercises.push({
        type: 'choose',
        question: `<span class="ws-big-letter">${a} + ${b} = ?</span>`,
        options: options.map(n => ({ value: n.toString(), label: n.toString() })),
        answer: correct.toString(),
        xp: 20
      });
    }

    // Subtraction
    if (count > 2) {
      const a = Math.floor(Math.random() * maxOp) + 1;
      const b = Math.floor(Math.random() * a) + 1;
      const correct = a - b;
      const options = this.shuffle([correct, ...this.getRandomNumbers(correct, 3, maxOp)]);
      exercises.push({
        type: 'choose',
        question: `<span class="ws-big-letter">${a} - ${b} = ?</span>`,
        options: options.map(n => ({ value: n.toString(), label: n.toString() })),
        answer: correct.toString(),
        xp: 20
      });
    }

    // Visual counting
    if (count > 3) {
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      const items = '●'.repeat(a) + ' + ' + '●'.repeat(b);
      exercises.push({
        type: 'input',
        question: `Count the dots: ${items}`,
        answer: (a + b).toString(),
        accept: (a + b).toString(),
        xp: 15
      });
    }

    // Word problem
    if (count > 4) {
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      const items = ['apples', 'candies', 'stars', 'toys', 'cookies'];
      const item = items[Math.floor(Math.random() * items.length)];
      exercises.push({
        type: 'input',
        question: `You have ${a} ${item}. Your friend gives you ${b} more. How many ${item} do you have now?`,
        answer: (a + b).toString(),
        accept: (a + b).toString(),
        xp: 25
      });
    }

    return exercises.slice(0, count);
  },

  // ═══ VOCABULARY ═══
  genVocabulary(count, grade, maxNum) {
    const exercises = [];
    const words = grade < 1 ?
      ['cat', 'dog', 'sun', 'cup', 'bed', 'hat', 'bat', 'pen', 'bus', 'fox'] :
      grade < 2 ?
        ['fish', 'bird', 'book', 'tree', 'star', 'door', 'bell', 'kite', 'rain', 'milk'] :
        ['pencil', 'garden', 'bridge', 'candle', 'rocket', 'planet', 'window', 'silver', 'castle', 'forest'];

    // Word-picture matching
    for (let i = 0; i < Math.min(2, count); i++) {
      const word = words[Math.floor(Math.random() * words.length)];
      const emoji = this.wordToEmoji(word);
      const wrongWords = this.shuffle(words.filter(w => w !== word)).slice(0, 3);
      const options = this.shuffle([word, ...wrongWords]);
      exercises.push({
        type: 'choose',
        question: `Which word matches this picture? ${emoji}`,
        options: options.map(w => ({ value: w, label: w })),
        answer: word,
        xp: 15
      });
    }

    // Fill in blank
    if (count > 2) {
      const word = words[Math.floor(Math.random() * words.length)];
      const sentences = {
        'cat': 'The ___ sat on the mat.',
        'dog': 'The ___ likes to play ball.',
        'sun': 'The ___ is bright today.',
        'book': 'I read a ___ every night.',
        'tree': 'The ___ has green leaves.',
        'star': 'I can see a ___ in the sky.',
        'fish': 'The ___ swims in the water.',
        'bird': 'A ___ flew over the house.',
        'rain': 'The ___ falls from clouds.',
        'milk': 'I drink ___ every morning.'
      };
      const sentence = sentences[word] || `I see a ___`;
      const display = sentence.replace(word, '___');
      const wrongWords = this.shuffle(words.filter(w => w !== word)).slice(0, 3);
      const options = this.shuffle([word, ...wrongWords]);
      exercises.push({
        type: 'choose',
        question: `Fill in the blank: "${display}"`,
        options: options.map(w => ({ value: w, label: w })),
        answer: word,
        xp: 20
      });
    }

    // Unscramble
    if (count > 3) {
      const word = words[Math.floor(Math.random() * words.length)];
      let letters = word.split('');
      // Ensure at least two letters are swapped differently
      if (letters.length > 1) {
        [letters[0], letters[letters.length - 1]] = [letters[letters.length - 1], letters[0]];
      }
      const scrambled = letters.join('');
      exercises.push({
        type: 'input',
        question: `Unscramble the word: <span class="ws-big-letter">${scrambled}</span>`,
        hint: `It starts with "${word[0]}"`,
        answer: word,
        accept: word,
        xp: 25
      });
    }

    return exercises.slice(0, count);
  },

  // ═══ COLORING ═══
  genColoring(count, grade) {
    const exercises = [];
    const colors = [
      { name: 'red', emoji: '🔴' },
      { name: 'blue', emoji: '🔵' },
      { name: 'green', emoji: '🟢' },
      { name: 'yellow', emoji: '🟡' },
      { name: 'purple', emoji: '🟣' },
      { name: 'orange', emoji: '🟠' }
    ];

    // Color recognition
    for (let i = 0; i < Math.min(2, count); i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const wrongColors = this.shuffle(colors.filter(c => c.name !== color.name)).slice(0, 3);
      const options = this.shuffle([color, ...wrongColors]);
      exercises.push({
        type: 'choose',
        question: `What color is this? ${color.emoji}`,
        options: options.map(c => ({ value: c.name, label: `${c.emoji} ${c.name}` })),
        answer: color.name,
        xp: 10
      });
    }

    // Color by instruction
    if (count > 2) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const items = ['🍎', '🌈', '⭐', '🎨'];
      const item = items[Math.floor(Math.random() * items.length)];
      const wrongColors = this.shuffle(colors.filter(c => c.name !== color.name)).slice(0, 3);
      const options = this.shuffle([color, ...wrongColors]);
      exercises.push({
        type: 'choose',
        question: `What color should this ${item} be?`,
        options: options.map(c => ({ value: c.name, label: `${c.emoji} ${c.name}` })),
        answer: color.name,
        xp: 10
      });
    }

    return exercises.slice(0, count);
  },

  // ═══ PUZZLES ═══
  genPuzzles(count, grade, maxNum) {
    const exercises = [];

    // Pattern completion
    for (let i = 0; i < Math.min(2, count); i++) {
      const emojis = ['🔵', '🟢', '🟡', '🟣', '🔴', '🟠'];
      const used = this.shuffle(emojis).slice(0, 3);
      const patternLen = Math.floor(Math.random() * 2) + 2;
      const pattern = [];
      for (let p = 0; p < patternLen; p++) pattern.push(used[p % used.length]);
      const next = used[patternLen % used.length];
      const display = pattern.join(' ') + ' → ___';
      const wrong = this.shuffle(emojis.filter(e => e !== next)).slice(0, 3);
      const options = this.shuffle([next, ...wrong]);
      exercises.push({
        type: 'choose',
        question: `What comes next? <span class="ws-big-letter">${display}</span>`,
        options: options.map(e => ({ value: e, label: e })),
        answer: next,
        xp: 20
      });
    }

    // Odd one out
    if (count > 2) {
      const categories = [
        { items: ['🍎', '🍊', '🍋', '🐶'], correct: '🐶', reason: 'It\'s an animal, the others are fruit' },
        { items: ['🚗', '🚌', '🚲', '🐱'], correct: '🐱', reason: 'It\'s an animal, the others are vehicles' },
        { items: ['⭐', '🌙', '☀️', '📚'], correct: '📚', reason: 'It\'s a book, the others are sky objects' },
        { items: ['🌸', '🌻', '🌷', '🐟'], correct: '🐟', reason: 'It\'s a fish, the others are flowers' },
        { items: ['🎈', '🎠', '🎡', '🍕'], correct: '🍕', reason: 'It\'s food, the others are amusement park items' }
      ];
      const cat = categories[Math.floor(Math.random() * categories.length)];
      exercises.push({
        type: 'choose',
        question: `Which one doesn't belong? ${cat.items.join(' ')}`,
        options: cat.items.map(i => ({ value: i, label: i })),
        answer: cat.correct,
        xp: 20
      });
    }

    // Which comes next in sequence
    if (count > 3) {
      const seq = ['❶', '❷', '❸', '❹', '❺'];
      const start = Math.floor(Math.random() * 2) + 1;
      const display = seq.slice(0, start + 2).join(' → ') + ' → ___';
      const next = seq[start + 2];
      const wrong = this.shuffle(seq.filter(s => s !== next)).slice(0, 3);
      const options = this.shuffle([next, ...wrong]);
      exercises.push({
        type: 'choose',
        question: `What comes next? <span class="ws-big-letter">${display}</span>`,
        options: options.map(e => ({ value: e, label: e })),
        answer: next,
        xp: 15
      });
    }

    return exercises.slice(0, count);
  },

  // ── RENDER a worksheet to HTML ──
  renderWorksheet(worksheet) {
    const isResults = worksheet.completed;
    const pct = worksheet.exercises.length > 0 ? Math.round((worksheet.score / worksheet.exercises.length) * 100) : 0;
    const passed = pct >= 60;

    let html = `
      <div class="ws reveal">
        <div class="ws__header">
          <div class="ws__meta">
            <span class="ws__subject" style="background:${this.subjectColor(worksheet.subject)}">${worksheet.subject}</span>
            <span class="ws__grade">${worksheet.grade}</span>
            <span class="ws__diff ws__diff--${worksheet.difficulty}">${worksheet.difficulty}</span>
          </div>
          <h2 class="ws__title">${worksheet.title}</h2>
          <div class="ws__xp-badge">⭐ ${worksheet.totalXP} XP</div>
        </div>
    `;

    if (isResults) {
      html += `
        <div class="ws__results ${passed ? 'ws__results--pass' : 'ws__results--fail'}">
          <div class="ws__results-score">${pct}%</div>
          <div class="ws__results-label">${passed ? '🌟 Quest Complete!' : '💪 Keep Trying!'}</div>
          <div class="ws__results-detail">${worksheet.score} / ${worksheet.exercises.length} correct</div>
          <div class="ws__results-xp">+${Math.round(worksheet.totalXP * (pct / 100))} XP Earned</div>
        </div>`;
    }

    html += `<div class="ws__exercises">`;
    worksheet.exercises.forEach((ex, i) => {
      const status = isResults ? (ex.userAnswer === ex.answer ? 'ws-ex--correct' : 'ws-ex--wrong') : '';
      const feedback = isResults && ex.userAnswer !== ex.answer ? `<div class="ws-ex__feedback">Correct answer: <strong>${ex.answer}</strong></div>` : '';

      html += `
        <div class="ws-ex ${status}" data-id="${ex.id}">
          <div class="ws-ex__num">${i + 1}</div>
          <div class="ws-ex__body">
            <div class="ws-ex__question">${ex.question}</div>
            ${ex.hint ? `<div class="ws-ex__hint">💡 ${ex.hint}</div>` : ''}`;

      if (ex.type === 'choose') {
        html += `<div class="ws-ex__options" data-id="${ex.id}">`;
        ex.options.forEach(opt => {
          const selected = isResults && ex.userAnswer === opt.value ? ' ws-opt--selected' : '';
          const correct = isResults && opt.value === ex.answer ? ' ws-opt--correct' : '';
          const wrong = isResults && ex.userAnswer === opt.value && opt.value !== ex.answer ? ' ws-opt--wrong' : '';
          html += `<button class="ws-opt${selected}${correct}${wrong}" data-value="${opt.value}" data-id="${ex.id}">${opt.label}</button>`;
        });
        html += `</div>`;
      } else if (ex.type === 'input') {
        if (isResults) {
          html += `<div class="ws-ex__answer-display">Your answer: ${ex.userAnswer || '(none)'}</div>`;
        } else {
          html += `<input class="ws-ex__input" type="text" data-id="${ex.id}" placeholder="Type your answer..." autocomplete="off" />`;
        }
      }

      html += feedback;
      html += `</div></div>`;
    });

    html += `</div>`;

    if (!isResults) {
      html += `
        <div class="ws__actions">
          <button class="hero__btn-primary" id="wsCheckBtn">✅ Check Answers</button>
        </div>`;
    } else {
      html += `
        <div class="ws__actions">
          <button class="hero__btn-primary" id="wsRetryBtn">🔄 Try Again</button>
        </div>`;
    }

    html += `</div>`;
    return html;
  },

  // ── ATTACH EVENT HANDLERS ──
  // onQuestComplete(score, xpEarned, pct) — optional callback for quest mode
  attachHandlers(worksheet, container, onQuestComplete = null) {
    // Option clicks
    container.querySelectorAll('.ws-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        // Deselect siblings
        container.querySelectorAll(`.ws-opt[data-id="${id}"]`).forEach(b => b.classList.remove('ws-opt--selected'));
        btn.classList.add('ws-opt--selected');
      });
    });

    // Check Answers button
    const checkBtn = container.querySelector('#wsCheckBtn');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        let score = 0;
        worksheet.exercises.forEach(ex => {
          let userAnswer;
          if (ex.type === 'choose') {
            const selected = container.querySelector(`.ws-opt--selected[data-id="${ex.id}"]`);
            userAnswer = selected ? selected.dataset.value : '';
          } else {
            const input = container.querySelector(`.ws-ex__input[data-id="${ex.id}"]`);
            userAnswer = input ? input.value.trim().toLowerCase() : '';
          }
          ex.userAnswer = userAnswer;
          if (ex.type === 'input') {
            if (userAnswer === ex.accept || userAnswer === ex.answer) score++;
          } else if (userAnswer === ex.answer) {
            score++;
          }
        });
        worksheet.score = score;
        worksheet.completed = true;

        // Award XP
        const pct = Math.round((score / worksheet.exercises.length) * 100);
        const xpEarned = Math.round(worksheet.totalXP * (pct / 100));
        const passed = pct >= 60;

        UI.showToast('🏆 Worksheet Complete!', `+${xpEarned} XP • ${score}/${worksheet.exercises.length} correct`, '🏆');

        // Save to Supabase if logged in
        this.saveCompletion(worksheet, score, xpEarned);

        // Re-render worksheet with results
        container.innerHTML = this.renderWorksheet(worksheet);
        this.attachHandlers(worksheet, container, onQuestComplete);
        UI.initScrollReveal();

        // In quest mode, if passed, show the Claim Reward button
        if (onQuestComplete && passed) {
          const actionsDiv = container.querySelector('.ws__actions');
          if (actionsDiv) {
            const claimBtn = document.createElement('button');
            claimBtn.className = 'ws__claim-btn';
            claimBtn.textContent = '⚔️ Claim Reward!';
            claimBtn.addEventListener('click', () => {
              claimBtn.disabled = true;
              claimBtn.textContent = 'Claiming...';
              onQuestComplete(score, xpEarned, pct);
            });
            actionsDiv.appendChild(claimBtn);
          }
        }
      });
    }

    // Try Again button
    const retryBtn = container.querySelector('#wsRetryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        const newWs = this.generate(worksheet.subject, worksheet.grade, worksheet.difficulty);
        container.innerHTML = this.renderWorksheet(newWs);
        this.attachHandlers(newWs, container, onQuestComplete);
        UI.initScrollReveal();
      });
    }

    // Enter key for inputs
    container.querySelectorAll('.ws-ex__input').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const checkBtn = container.querySelector('#wsCheckBtn');
          if (checkBtn) checkBtn.click();
        }
      });
    });
  },

  // ── SAVE COMPLETION ──
  async saveCompletion(worksheet, score, xpEarned) {
    if (!Auth.isLoggedIn()) return;
    try {
      const profile = Auth.currentProfile;
      // Award XP
      await Gamification.addXp(profile.id, xpEarned, 'worksheet');
      // Save to Supabase worksheet_completions table (null worksheet_id for dynamically generated worksheets)
      if (typeof completeWorksheet === 'function') {
        try {
          await completeWorksheet(profile.id, null, score, xpEarned);
        } catch (dbErr) {
          // FK constraint errors (23503) are expected — no matching worksheet row
          // 23502 = NOT NULL violation (worksheet_id is null for dynamic worksheets)
          // 23503 = FK constraint violation (no matching worksheet row)
          if (dbErr?.code !== '23502' && dbErr?.code !== '23503') console.warn('Failed to save worksheet completion:', dbErr);
        }
      }
    } catch (e) {
      console.warn('Failed to save worksheet completion:', e);
    }
  },

  // ── SUBJECT COLORS ──
  subjectColor(subject) {
    const colors = {
      'Alphabets': 'var(--secondary)',
      'Numbers': 'var(--amber)',
      'Maths': 'var(--cyan)',
      'Vocabulary': 'var(--rose)',
      'Coloring': 'var(--orange)',
      'Puzzles': 'var(--green)'
    };
    return colors[subject] || 'var(--primary)';
  },

  // ── HELPERS ──
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  getRandomLetters(exclude, count, lowercase) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const available = letters.split('').filter(l => l !== exclude.toUpperCase());
    const picked = this.shuffle(available).slice(0, count);
    return lowercase ? picked.map(l => l.toLowerCase()) : picked;
  },

  getRandomNumbers(exclude, count, max) {
    const available = [];
    for (let i = 1; i <= max; i++) {
      if (i !== exclude && i >= 0) available.push(i);
    }
    return this.shuffle(available).slice(0, count);
  },

  getAnimalWord(letter) {
    const map = {
      A: 'Apple', B: 'Bear', C: 'Cat', D: 'Dog', E: 'Elephant', F: 'Fox',
      G: 'Goat', H: 'Horse', I: 'Iguana', J: 'Jaguar', K: 'Koala', L: 'Lion',
      M: 'Monkey', N: 'Newt', O: 'Owl', P: 'Penguin', Q: 'Quail', R: 'Rabbit',
      S: 'Snake', T: 'Turtle', U: 'Unicorn', V: 'Vulture', W: 'Whale', X: 'Xerus',
      Y: 'Yak', Z: 'Zebra'
    };
    return map[letter.toUpperCase()] || 'Apple';
  },

  getRandomWords(excludeLetter, count) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => l !== excludeLetter.toUpperCase());
    const picked = this.shuffle(letters).slice(0, count);
    return picked.map(l => this.getAnimalWord(l));
  },

  wordToEmoji(word) {
    const map = {
      'cat': '🐱', 'dog': '🐶', 'sun': '☀️', 'cup': '🥤', 'bed': '🛏️',
      'hat': '🎩', 'bat': '🏏', 'pen': '🖊️', 'bus': '🚌', 'fox': '🦊',
      'fish': '🐟', 'bird': '🐦', 'book': '📚', 'tree': '🌳', 'star': '⭐',
      'door': '🚪', 'bell': '🔔', 'kite': '🪁', 'rain': '🌧️', 'milk': '🥛',
      'pencil': '✏️', 'garden': '🌻', 'bridge': '🌉', 'candle': '🕯️',
      'rocket': '🚀', 'planet': '🪐', 'window': '🪟', 'silver': '🥈',
      'castle': '🏰', 'forest': '🌲'
    };
    return map[word] || '📝';
  }
};
