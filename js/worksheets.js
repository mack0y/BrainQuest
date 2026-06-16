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

    // Match letter → animal
    const matchLetters = this.shuffle(letters).slice(0, 3);
    const matchPairs = matchLetters.map(l => ({
      id: `alp_${l}`,
      left: l,
      right: animals[l] || '🔤'
    }));
    exercises.push(this.genMatchExercise(
      matchPairs,
      'Match each letter to its animal friend! 🐾'
    ));

    // Uppercase → lowercase matching
    if (count > 2) {
      const letter = letters[Math.floor(Math.random() * 26)];
      const lower = letter.toLowerCase();
      const options = this.shuffle([lower, ...this.getRandomLetters(lower, 3, true)]);
      exercises.push({
        type: 'choose',
        question: `Find the small letter that goes with <span class="ws-big-letter">${letter}</span>`,
        options: options.map(l => ({ value: l, label: l })),
        answer: lower,
        xp: 15
      });
    }

    // Sort letters in ABC order
    if (count > 4) {
      const sortStart = Math.floor(Math.random() * 22);
      const sortLetters = letters.slice(sortStart, sortStart + 4).split('');
      const sortItems = sortLetters.map((l, i) => ({
        id: `sort_${l}`,
        label: l,
        correctOrder: i
      }));
      exercises.push(this.genSortExercise(
        sortItems,
        'Put these letters in ABC order! 🔤'
      ));
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

    // Match number → emoji count
    const countNums = [1, 2, 3];
    const countEmojis = ['🌟', '🍎', '⭐'];
    const matchNumPairs = countNums.map(n => ({
      id: `num_${n}`,
      left: countEmojis[countNums.indexOf(n)].repeat(n),
      right: n.toString()
    }));
    exercises.push(this.genMatchExercise(
      matchNumPairs,
      'Match the stars to the right number! ⭐'
    ));

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

    // Sort numbers smallest → biggest
    if (count > 4) {
      const sortNums = this.shuffle([1,2,3,4]).slice(0, 4);
      const sorted = [...sortNums].sort((a,b) => a - b);
      const sortItems = sortNums.map((n, i) => ({
        id: `nsort_${n}`,
        label: n.toString(),
        correctOrder: sorted.indexOf(n)
      }));
      exercises.push(this.genSortExercise(
        sortItems,
        'Put these numbers in order from smallest to biggest! 🔢'
      ));
    }

    return exercises.slice(0, count);
  },

  // ═══ MATHS ═══
  genMaths(count, grade, maxNum) {
    const exercises = [];
    const maxOp = grade < 2 ? 10 : maxNum;

    // Addition
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

    // Match equation → answer
    const eqPairs = [
      { a: 1, b: 1 }, { a: 2, b: 1 }, { a: 2, b: 2 }
    ];
    const matchEqPairs = eqPairs.map((eq, i) => ({
      id: `eq_${i}`,
      left: `${eq.a} + ${eq.b}`,
      right: `${eq.a + eq.b}`
    }));
    exercises.push(this.genMatchExercise(
      matchEqPairs,
      'Match each math problem to its answer! ➕'
    ));

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
      const total = Math.floor(Math.random() * 9) + 1;
      const items = '●'.repeat(total);
      exercises.push({
        type: 'input',
        question: `How many dots? ${items}`,
        answer: total.toString(),
        accept: total.toString(),
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

    // Match word → emoji
    const vocabMatchWords = this.shuffle(words).slice(0, 3);
    const vocabPairs = vocabMatchWords.map(w => ({
      id: `voc_${w}`,
      left: this.wordToEmoji(w) || '📝',
      right: w
    }));
    exercises.push(this.genMatchExercise(
      vocabPairs,
      'Match each picture to its word! 📖'
    ));

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
        question: `Fix the mixed-up letters! <span class="ws-big-letter">${scrambled}</span>`,
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

    // Match color → object
    const colorItems = [
      { name: 'red', obj: '🍎' },
      { name: 'yellow', obj: '⭐' },
      { name: 'green', obj: '🍀' }
    ];
    const colorPairs = colorItems.map(c => ({
      id: `col_${c.name}`,
      left: c.obj,
      right: c.name
    }));
    exercises.push(this.genMatchExercise(
      colorPairs,
      'Match each object to its color! 🎨'
    ));

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

    // Sort pattern sequence
    const sortEmojis = ['🔵', '🟢', '🟡', '🔴'];
    const sortPatternItems = sortEmojis.map((e, i) => ({
      id: `pats_${i}`,
      label: e,
      correctOrder: i
    }));
    exercises.push(this.genSortExercise(
      sortPatternItems,
      'Put these colors in rainbow order! 🌈'
    ));

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
        question: `Find the one that is different! ${cat.items.join(' ')}`,
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
      } else if (ex.type === 'match') {
        // Matching columns
        const matchState = ex.userMatches || {};
        html += `<div class="ws-match" data-id="${ex.id}">`;
        html += `<div class="ws-match__col ws-match__col--left">`;
        ex.leftOrder.forEach(pid => {
          const pair = ex.pairs.find(p => p.id === pid);
          if (!pair) return;
          const matchedTo = matchState[pid];
          let cls = '';
          if (isResults) {
            cls = matchedTo === pid ? ' ws-match__item--correct' : ' ws-match__item--wrong';
          } else if (matchedTo) {
            cls = ' ws-match__item--matched';
          }
          if (!isResults && ex._selectedLeft === pid) cls += ' ws-match__item--selected';
          html += `<button class="ws-match__item${cls}" data-mid="${pid}" data-side="left">${pair.left}</button>`;
        });
        html += `</div>`;
        html += `<div class="ws-match__col ws-match__col--right">`;
        ex.rightOrder.forEach(pid => {
          const pair = ex.pairs.find(p => p.id === pid);
          if (!pair) return;
          const matchedBy = Object.entries(matchState).find(([,v]) => v === pid);
          let cls = '';
          if (isResults) {
            const correctMatch = matchedBy && matchedBy[0] === pid;
            cls = correctMatch ? ' ws-match__item--correct' : ' ws-match__item--wrong';
          } else if (matchedBy) {
            cls = ' ws-match__item--matched';
          }
          html += `<button class="ws-match__item${cls}" data-mid="${pid}" data-side="right">${pair.right}</button>`;
        });
        html += `</div></div>`;
        // Feedback for wrong matches
        if (isResults) {
          ex.pairs.forEach(pair => {
            if (matchState[pair.id] !== pair.id) {
              html += `<div class="ws-ex__feedback">✓ Correct: ${pair.left} → ${pair.right}</div>`;
            }
          });
        }
      } else if (ex.type === 'sort') {
        // Click-to-order sort
        const sortState = ex.userOrder || [];
        html += `<div class="ws-sort" data-id="${ex.id}">`;
        if (!isResults) {
          html += `<div class="ws-sort__pool">`;
          ex.displayOrder.forEach(itemId => {
            const item = ex.items.find(i => i.id === itemId);
            if (!item || sortState.includes(itemId)) return;
            html += `<button class="ws-sort__item" data-sid="${item.id}">${item.label}</button>`;
          });
          html += `</div>`;
          html += `<div class="ws-sort__order">`;
          sortState.forEach((itemId, pos) => {
            const item = ex.items.find(i => i.id === itemId);
            if (!item) return;
            html += `<button class="ws-sort__item ws-sort__item--placed" data-sid="${item.id}" data-pos="${pos}"><span class="ws-sort__pos">${pos + 1}</span> ${item.label}</button>`;
          });
          if (sortState.length < ex.items.length) {
            html += `<div class="ws-sort__hint">👆 Tap the items above to put them in order!</div>`;
          }
          html += `</div>`;
        } else {
          // Results mode
          html += `<div class="ws-sort__results">`;
          sortState.forEach((itemId, pos) => {
            const item = ex.items.find(i => i.id === itemId);
            if (!item) return;
            const correct = item.correctOrder === pos;
            html += `<span class="ws-sort__result-item ${correct ? 'ws-sort__result-item--correct' : 'ws-sort__result-item--wrong'}">
              <span class="ws-sort__pos">${pos + 1}</span> ${item.label}
              ${!correct ? `<span class="ws-sort__result-correct">→ should be #${item.correctOrder + 1}</span>` : ''}
            </span>`;
          });
          html += `</div>`;
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
        container.querySelectorAll(`.ws-opt[data-id="${id}"]`).forEach(b => b.classList.remove('ws-opt--selected'));
        btn.classList.add('ws-opt--selected');
      });
    });

    // Match clicks
    container.querySelectorAll('.ws-match__item[data-side="left"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const exId = parseInt(btn.closest('.ws-ex').dataset.id);
        const ex = worksheet.exercises.find(e => e.id === exId);
        if (!ex) return;
        const pid = btn.dataset.mid;
        // If already matched, unmatch
        if (ex.userMatches[pid]) {
          const rightPid = ex.userMatches[pid];
          delete ex.userMatches[pid];
          delete ex._selectedLeft;
          container.querySelector('.ws-match').innerHTML = this.renderMatch(ex);
          this.attachHandlers(worksheet, container, onQuestComplete);
          return;
        }
        ex._selectedLeft = pid;
        // Update UI
        container.querySelectorAll('.ws-match__item--selected').forEach(el => el.classList.remove('ws-match__item--selected'));
        btn.classList.add('ws-match__item--selected');
      });
    });

    container.querySelectorAll('.ws-match__item[data-side="right"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const exId = parseInt(btn.closest('.ws-ex').dataset.id);
        const ex = worksheet.exercises.find(e => e.id === exId);
        if (!ex || !ex._selectedLeft) return;
        const leftPid = ex._selectedLeft;
        const rightPid = btn.dataset.mid;
        ex.userMatches[leftPid] = rightPid;
        delete ex._selectedLeft;
        // Re-render just the match part
        const matchDiv = btn.closest('.ws-match');
        if (matchDiv) {
          matchDiv.innerHTML = this.renderMatch(ex);
        }
        this.attachHandlers(worksheet, container, onQuestComplete);
      });
    });

    // Sort clicks — add to order
    container.querySelectorAll('.ws-sort__pool .ws-sort__item').forEach(btn => {
      btn.addEventListener('click', () => {
        const exId = parseInt(btn.closest('.ws-ex').dataset.id);
        const ex = worksheet.exercises.find(e => e.id === exId);
        if (!ex) return;
        const sid = btn.dataset.sid;
        if (!ex.userOrder.includes(sid)) {
          ex.userOrder.push(sid);
        }
        const sortDiv = btn.closest('.ws-sort');
        if (sortDiv) {
          sortDiv.innerHTML = this.renderSort(ex, false);
        }
        this.attachHandlers(worksheet, container, onQuestComplete);
      });
    });

    // Sort clicks — remove from order
    container.querySelectorAll('.ws-sort__order .ws-sort__item').forEach(btn => {
      btn.addEventListener('click', () => {
        const exId = parseInt(btn.closest('.ws-ex').dataset.id);
        const ex = worksheet.exercises.find(e => e.id === exId);
        if (!ex) return;
        const sid = btn.dataset.sid;
        ex.userOrder = ex.userOrder.filter(id => id !== sid);
        const sortDiv = btn.closest('.ws-sort');
        if (sortDiv) {
          sortDiv.innerHTML = this.renderSort(ex, false);
        }
        this.attachHandlers(worksheet, container, onQuestComplete);
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
          } else if (ex.type === 'input') {
            const input = container.querySelector(`.ws-ex__input[data-id="${ex.id}"]`);
            userAnswer = input ? input.value.trim().toLowerCase() : '';
          } else if (ex.type === 'sort') {
            userAnswer = JSON.stringify(ex.userOrder || []);
            const sortItems = ex.items || [];
            let allCorrect = true;
            (ex.userOrder || []).forEach((itemId, pos) => {
              const item = sortItems.find(i => i.id === itemId);
              if (item && item.correctOrder !== pos) allCorrect = false;
            });
            if (allCorrect && (ex.userOrder || []).length === sortItems.length) score++;
          } else if (ex.type === 'match') {
            userAnswer = JSON.stringify(ex.userMatches || {});
            let allMatched = true;
            (ex.pairs || []).forEach(pair => {
              if (ex.userMatches[pair.id] !== pair.id) allMatched = false;
            });
            if (allMatched && Object.keys(ex.userMatches || {}).length === (ex.pairs || []).length) score++;
          } else {
            const input = container.querySelector(`.ws-ex__input[data-id="${ex.id}"]`);
            userAnswer = input ? input.value.trim().toLowerCase() : '';
          }
          ex.userAnswer = userAnswer;
          if (ex.type === 'input') {
            if (userAnswer === ex.accept || userAnswer === ex.answer) score++;
          } else if (ex.type === 'choose') {
            if (userAnswer === ex.answer) score++;
          }
          // match and sort types are already scored above with allCorrect/allMatched
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

  // ── NEW EXERCISE TYPE HELPERS ──
  genMatchExercise(pairs, question, xp = 25) {
    // pairs: [{ id, left, right }, ...]
    const leftOrder = this.shuffle(pairs.map(p => p.id));
    const rightOrder = this.shuffle(pairs.map(p => p.id));
    return {
      type: 'match',
      question,
      pairs,
      leftOrder,
      rightOrder,
      userMatches: {},
      xp
    };
  },

  genSortExercise(items, question, xp = 25) {
    // items: [{ id, label, correctOrder }, ...] — correctOrder = 0,1,2...
    const displayOrder = this.shuffle(items.map(i => i.id));
    return {
      type: 'sort',
      question,
      items,
      displayOrder,
      userOrder: [],
      xp
    };
  },

  // ── RENDER MATCH (helper, for re-rendering after clicks) ──
  renderMatch(ex) {
    const matchState = ex.userMatches || {};
    let html = `<div class="ws-match__col ws-match__col--left">`;
    ex.leftOrder.forEach(pid => {
      const pair = ex.pairs.find(p => p.id === pid);
      if (!pair) return;
      const matchedTo = matchState[pid];
      let cls = matchedTo ? ' ws-match__item--matched' : '';
      if (ex._selectedLeft === pid) cls += ' ws-match__item--selected';
      html += `<button class="ws-match__item${cls}" data-mid="${pid}" data-side="left">${pair.left}</button>`;
    });
    html += `</div><div class="ws-match__col ws-match__col--right">`;
    ex.rightOrder.forEach(pid => {
      const pair = ex.pairs.find(p => p.id === pid);
      if (!pair) return;
      const matchedBy = Object.entries(matchState).find(([,v]) => v === pid);
      let cls = matchedBy ? ' ws-match__item--matched' : '';
      html += `<button class="ws-match__item${cls}" data-mid="${pid}" data-side="right">${pair.right}</button>`;
    });
    html += `</div>`;
    return html;
  },

  // ── RENDER SORT (helper, for re-rendering after clicks) ──
  renderSort(ex, isResults) {
    const sortState = ex.userOrder || [];
    let html = '';
    if (!isResults) {
      html += `<div class="ws-sort__pool">`;
      ex.displayOrder.forEach(itemId => {
        const item = ex.items.find(i => i.id === itemId);
        if (!item || sortState.includes(itemId)) return;
        html += `<button class="ws-sort__item" data-sid="${item.id}">${item.label}</button>`;
      });
      html += `</div><div class="ws-sort__order">`;
      sortState.forEach((itemId, pos) => {
        const item = ex.items.find(i => i.id === itemId);
        if (!item) return;
        html += `<button class="ws-sort__item ws-sort__item--placed" data-sid="${item.id}" data-pos="${pos}"><span class="ws-sort__pos">${pos + 1}</span> ${item.label}</button>`;
      });
      if (sortState.length < ex.items.length) {
        html += `<div class="ws-sort__hint">👆 Tap the items above to put them in order!</div>`;
      }
      html += `</div>`;
    }
    return html;
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
