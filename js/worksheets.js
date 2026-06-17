// ═══════════════════════════════════════════
// BrainQuest – Worksheet Engine (Phase 2)
// Generates dynamic interactive worksheets
// ═══════════════════════════════════════════

window.WorksheetEngine = {

  // ── GENERATE a full worksheet ──
  generate(subject, grade, difficulty) {
    const diff = this.parseDifficulty(difficulty);
    const diffMult = XP.DIFFICULTY[diff] || 1;
    const exercises = this.generateExercises(subject, grade, difficulty);
    // Scale each exercise's XP by difficulty multiplier
    exercises.forEach(ex => { ex.xp = Math.round(ex.xp * diffMult); });
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

  // ═══ ALPHABETS — no repeated letters across exercises ═══
  genAlphabets(count, grade, maxNum) {
    const exercises = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const animals = { A: '🐊', B: '🐻', C: '🐱', D: '🐶', E: '🐘', F: '🦊', G: '🐸', H: '🐴', I: '🦎', J: '🦘', K: '🕊️', L: '🦁', M: '🐭', N: '🐮', O: '🦉', P: '🐧', Q: '🦆', R: '🐰', S: '🐍', T: '🐢', U: '🦄', V: '🦜', W: '🐋', X: '🦀', Y: '🐲', Z: '🦓' };
    const usedLetters = new Set();

    // Helper: pick a random unused letter
    const pickFreshLetter = () => {
      const avail = letters.split('').filter(l => !usedLetters.has(l));
      const picked = avail[Math.floor(Math.random() * avail.length)] || letters[Math.floor(Math.random() * 26)];
      usedLetters.add(picked);
      return picked;
    };

    // 1) Letter recognition — pick fresh letter
    const l1 = pickFreshLetter();
    exercises.push({
      type: 'choose',
      question: `Which letter is this? <span class="ws-big-letter">${l1}</span>`,
      image: animals[l1] || '🔤',
      options: this.shuffle([l1, ...this.getRandomLetters(l1, 3)]).map(l => ({ value: l, label: l })),
      answer: l1,
      xp: 15
    });

    // 2) Match letter → animal — use 3 fresh letters
    const matchLetters = [];
    for (let i = 0; i < 3; i++) matchLetters.push(pickFreshLetter());
    exercises.push(this.genMatchExercise(
      matchLetters.map(l => ({ id: `alp_${l}`, left: l, right: animals[l] || '🔤' })),
      'Match each letter to its animal friend! 🐾'
    ));

    // 3) Uppercase → lowercase — use fresh letter
    if (count > 2) {
      const l3 = pickFreshLetter();
      const lower = l3.toLowerCase();
      exercises.push({
        type: 'choose',
        question: `Find the small letter that goes with <span class="ws-big-letter">${l3}</span>`,
        options: this.shuffle([lower, ...this.getRandomLetters(l3, 3, true)]).map(l => ({ value: l, label: l })),
        answer: lower,
        xp: 15
      });
    }

    // 4) Drag to order: 4 fresh consecutive letters (different from previous picks)
    if (count > 4) {
      // Pick a start letter that's not in usedLetters and has room for 4 consecutive
      const avail = letters.split('').filter(l => !usedLetters.has(l));
      const startIdx = Math.floor(Math.random() * Math.max(1, avail.length - 3));
      const startL = avail[startIdx] || 'A';
      const startPos = letters.indexOf(startL);
      const dragLetters = letters.slice(startPos, Math.min(startPos + 4, 26)).split('');
      dragLetters.forEach(l => usedLetters.add(l));
      exercises.push(this.genDragOrder(
        dragLetters.map((l, i) => ({ id: `dorder_${l}`, label: l, correctOrder: i })),
        'Drag these letters into ABC order! 🔤'
      ));
    }

    // 5) Which word starts with... — use fresh letter
    if (count > 3) {
      const l5 = pickFreshLetter();
      const correct = this.getAnimalWord(l5);
      exercises.push({
        type: 'choose',
        question: `Which word starts with the letter <span class="ws-big-letter">${l5}</span>?`,
        options: this.shuffle([correct, ...this.getRandomWords(l5, 3)]).map(w => ({ value: w, label: w })),
        answer: correct,
        xp: 15
      });
    }

    // 6) Fill missing letter — use a word from a fresh letter
    if (count > 4) {
      const l6 = pickFreshLetter();
      const word = this.getAnimalWord(l6);
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

  // ═══ NUMBERS — no repeated values across exercises ═══
  genNumbers(count, grade, maxNum) {
    const exercises = [];
    const usedNumbers = new Set();
    const countEmojis = ['🌟', '🍎', '⭐', '🌈', '🎈', '🐟', '🌸', '🍪'];
    const usedEmojis = new Set();

    const pickFreshEmoji = () => {
      const avail = countEmojis.filter(e => !usedEmojis.has(e));
      const picked = avail.length > 0 ? avail[Math.floor(Math.random() * avail.length)] : countEmojis[Math.floor(Math.random() * countEmojis.length)];
      usedEmojis.add(picked);
      return picked;
    };

    const pickFreshNum = (max = maxNum, min = 1) => {
      // Try to find an unused number in range
      for (let attempt = 0; attempt < 20; attempt++) {
        const n = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!usedNumbers.has(n) || attempt === 19) {
          usedNumbers.add(n);
          return n;
        }
      }
      const n = Math.floor(Math.random() * (max - min + 1)) + min;
      usedNumbers.add(n);
      return n;
    };

    // 1) Count objects
    const num1 = pickFreshNum();
    const emoji1 = pickFreshEmoji();
    exercises.push({
      type: 'choose',
      question: `How many ${emoji1} are there?`,
      image: emoji1.repeat(num1),
      options: this.shuffle([num1, ...this.getRandomNumbers(num1, 3, maxNum)]).map(n => ({ value: n.toString(), label: n.toString() })),
      answer: num1.toString(),
      xp: 15
    });

    // 2) Match number → emoji count — use 3 fresh numbers with varied emoji
    const matchNums = [pickFreshNum(Math.min(5, maxNum)), pickFreshNum(Math.min(5, maxNum)), pickFreshNum(Math.min(5, maxNum))].sort((a,b) => a-b);
    const matchEmojis = ['🌟', '🍎', '⭐']; // keep these consistent for matching
    exercises.push(this.genMatchExercise(
      matchNums.map((n, i) => ({ id: `num_${n}`, left: matchEmojis[i].repeat(n), right: n.toString() })),
      'Match the stars to the right number! ⭐'
    ));

    // 3) Number sequencing — use fresh numbers, track all seq values
    if (count > 2) {
      const start = pickFreshNum(Math.max(1, maxNum - 3));
      [start, start + 1, start + 2].forEach(n => usedNumbers.add(n));
      const seq = [start, start + 1, start + 2];
      const blank = Math.floor(Math.random() * 3);
      exercises.push({
        type: 'input',
        question: `What number is missing? <span class="ws-word">${seq.map((n, i) => i === blank ? '___' : n).join(' → ')}</span>`,
        answer: seq[blank].toString(),
        accept: seq[blank].toString(),
        xp: 20
      });
    }

    // 4) Match number to word — use fresh number
    if (count > 3) {
      const numWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
      const n = pickFreshNum(Math.min(10, maxNum));
      const word = numWords[n - 1];
      exercises.push({
        type: 'choose',
        question: `Which word matches the number <span class="ws-big-letter">${n}</span>?`,
        options: this.shuffle([word, ...this.shuffle(numWords.filter(w => w !== word)).slice(0, 3)]).map(w => ({ value: w, label: w })),
        answer: word,
        xp: 15
      });
    }

    // 5) Drag to order — fresh set of 4 numbers
    if (count > 4) {
      const nums = [];
      for (let i = 0; i < 4; i++) nums.push(pickFreshNum());
      const sorted = [...nums].sort((a,b) => a - b);
      exercises.push(this.genDragOrder(
        nums.map((n, i) => ({ id: `ndrag_${n}`, label: n.toString(), correctOrder: sorted.indexOf(n) })),
        'Drag these numbers from smallest to biggest! 🔢'
      ));
    }

    return exercises.slice(0, count);
  },

  // ═══ MATHS — random equations every time, no fixed content ═══
  genMaths(count, grade, maxNum) {
    const exercises = [];
    const maxOp = grade < 2 ? 10 : maxNum;
    const usedEquations = new Set(); // e.g. "3+2" to prevent same equation

    const pickEquation = () => {
      for (let attempt = 0; attempt < 30; attempt++) {
        const a = Math.floor(Math.random() * maxOp) + 1;
        const b = Math.floor(Math.random() * Math.min(maxOp, a)) + 1;
        const key = `${a}+${b}`;
        if (!usedEquations.has(key) || attempt > 20) {
          usedEquations.add(key);
          return { a, b, sum: a + b, key };
        }
      }
      return { a: 1, b: 1, sum: 2, key: '1+1' };
    };

    // 1) Addition — random equation
    const eq1 = pickEquation();
    exercises.push({
      type: 'choose',
      question: `<span class="ws-big-letter">${eq1.a} + ${eq1.b} = ?</span>`,
      options: this.shuffle([eq1.sum, ...this.getRandomNumbers(eq1.sum, 3, maxOp * 2)]).map(n => ({ value: n.toString(), label: n.toString() })),
      answer: eq1.sum.toString(),
      xp: 20
    });

    // 2) Drag match: 3 random equations → answers (REPLACES the old fixed 1+1, 2+1, 2+2)
    const dragEqs = [];
    for (let i = 0; i < 3; i++) {
      const e = pickEquation();
      dragEqs.push(e);
    }
    exercises.push(this.genDragMatch(
      dragEqs.map(e => ({ id: `deq_${e.key.replace('+', '_')}`, label: `${e.a} + ${e.b}` })),
      dragEqs.map(e => ({ id: `dt_${e.key.replace('+', '_')}`, label: `= ${e.sum}`, correctSourceId: `deq_${e.key.replace('+', '_')}` })),
      'Drag each problem to its answer! ➕'
    ));

    // 3) Subtraction — different from addition
    if (count > 2) {
      const subA = Math.floor(Math.random() * maxOp) + 2; // minuend ≥ 2 so result can be ≥ 0
      const subB = Math.floor(Math.random() * (subA - 1)) + 1;
      const diffKey = `${subA}-${subB}`;
      if (!usedEquations.has(diffKey)) usedEquations.add(diffKey);
      const correct = subA - subB;
      exercises.push({
        type: 'choose',
        question: `<span class="ws-big-letter">${subA} - ${subB} = ?</span>`,
        options: this.shuffle([correct, ...this.getRandomNumbers(correct, 3, maxOp)]).map(n => ({ value: n.toString(), label: n.toString() })),
        answer: correct.toString(),
        xp: 20
      });
    }

    // 4) Visual counting — random count
    if (count > 3) {
      const total = Math.floor(Math.random() * 9) + 1;
      exercises.push({
        type: 'input',
        question: `How many dots? ${'●'.repeat(total)}`,
        answer: total.toString(),
        accept: total.toString(),
        xp: 15
      });
    }

    // 5) Word problem — random items, different equation from above
    if (count > 4) {
      const items = ['apples', 'candies', 'stars', 'toys', 'cookies', 'gems', 'buttons', 'pencils', 'stickers', 'coins', 'marbles', 'books', 'flowers', 'shells', 'pebbles'];
      const used = new Set();
      const pickItem = () => {
        for (let i = 0; i < 10; i++) {
          const it = items[Math.floor(Math.random() * items.length)];
          if (!used.has(it) || i > 8) { used.add(it); return it; }
        }
        return items[Math.floor(Math.random() * items.length)];
      };
      const item1 = pickItem();
      const item2 = pickItem();
      // Mix of addition and subtraction word problems
      const isAddition = Math.random() > 0.4;
      if (isAddition) {
        const a = Math.floor(Math.random() * 5) + 1;
        const b = Math.floor(Math.random() * 5) + 1;
        exercises.push({
          type: 'input',
          question: `You have ${a} ${item1}. Your friend gives you ${b} more ${item2}. How many items do you have now?`,
          answer: (a + b).toString(),
          accept: (a + b).toString(),
          xp: 25
        });
      } else {
        const total = Math.floor(Math.random() * 8) + 3;
        const taken = Math.floor(Math.random() * (total - 1)) + 1;
        exercises.push({
          type: 'input',
          question: `You have ${total} ${item1}. You give away ${taken} to a friend. How many ${item1} are left?`,
          answer: (total - taken).toString(),
          accept: (total - taken).toString(),
          xp: 25
        });
      }
    }

    return exercises.slice(0, count);
  },

  // ═══ VOCABULARY — 3x larger word pools, no repeated words across exercises ═══
  genVocabulary(count, grade, maxNum) {
    const exercises = [];
    // Expanded word pools — 30+ words per grade level
    const wordPools = {
      preschool: ['cat', 'dog', 'sun', 'cup', 'bed', 'hat', 'bat', 'pen', 'bus', 'fox',
                  'pot', 'map', 'rug', 'bib', 'nut', 'mop', 'jar', 'bag', 'wig', 'fan',
                  'yak', 'zoo', 'pie', 'hen', 'log', 'gem', 'ham', 'mug', 'tub', 'pig'],
      kindergarten: ['fish', 'bird', 'book', 'tree', 'star', 'door', 'bell', 'kite', 'rain', 'milk',
                    'frog', 'cake', 'nest', 'lamp', 'dish', 'desk', 'flag', 'soap', 'fork', 'leaf',
                    'keys', 'ring', 'tent', 'rock', 'barn', 'comb', 'drum', 'hand', 'sock', 'doll'],
      higher: ['pencil', 'garden', 'bridge', 'candle', 'rocket', 'planet', 'window', 'silver', 'castle', 'forest',
               'pirate', 'dragon', 'knight', 'temple', 'magpie', 'goblin', 'throne', 'shrine', 'beetle', 'cactus',
               'banana', 'puzzle', 'basket', 'mitten', 'saddle', 'marble', 'ribbon', 'walnut', 'violet', 'button']
    };
    const allWords = grade < 1 ? wordPools.preschool : grade < 2 ? wordPools.kindergarten : wordPools.higher;
    const usedWords = new Set();

    const pickFreshWord = () => {
      const avail = allWords.filter(w => !usedWords.has(w));
      if (avail.length === 0) {
        // Pool exhausted — reset tracking and continue
        usedWords.clear();
        return allWords[Math.floor(Math.random() * allWords.length)];
      }
      const picked = avail[Math.floor(Math.random() * avail.length)];
      usedWords.add(picked);
      return picked;
    };

    // Sentences for fill-in-blank — expanded to cover more words
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
      'milk': 'I drink ___ every morning.',
      'frog': 'The green ___ jumped in the pond.',
      'cake': 'I love eating ___ on my birthday.',
      'nest': 'The bird sits in its ___.',
      'lamp': 'Turn on the ___ when it is dark.',
      'desk': 'I do my homework at my ___.',
      'flag': 'The ___ waves in the wind.',
      'rocket': 'The ___ flew to the moon.',
      'castle': 'The princess lives in a ___.',
      'forest': 'The bear lives in the ___.',
      'candle': 'Light the ___ on the cake.',
      'garden': 'Flowers grow in the ___.',
      'pirate': 'The ___ sails the ocean.',
      'dragon': 'The ___ breathes fire.',
      'knight': 'The ___ wore shiny armor.',
      'bridge': 'Cross the ___ to reach the castle.',
      'puzzle': 'I put together the ___.',
      'basket': 'Put the apples in the ___.',
      'banana': 'The monkey ate a yellow ___.'
    };

    // 1) Word-picture matching — 1 to 2 exercises with different words
    const matchCount = Math.min(2, Math.max(1, count - 2));
    for (let i = 0; i < matchCount; i++) {
      const word = pickFreshWord();
      const emoji = this.wordToEmoji(word);
      exercises.push({
        type: 'choose',
        question: `Which word matches this picture? ${emoji}`,
        options: this.shuffle([word, ...this.shuffle(allWords.filter(w => w !== word)).slice(0, 3)]).map(w => ({ value: w, label: w })),
        answer: word,
        xp: 15
      });
    }

    // 2) Fill in the blank — different word
    if (count > 2) {
      const word = pickFreshWord();
      const display = sentences[word] ? sentences[word].replace(word, '___') : `I see a ___`;
      exercises.push({
        type: 'choose',
        question: `Fill in the blank: "${display}"`,
        options: this.shuffle([word, ...this.shuffle(allWords.filter(w => w !== word)).slice(0, 3)]).map(w => ({ value: w, label: w })),
        answer: word,
        xp: 20
      });
    }

    // 3) Drag match: emoji → word — 3 fresh words
    const dragWords = [];
    for (let i = 0; i < 3; i++) dragWords.push(pickFreshWord());
    exercises.push(this.genDragMatch(
      dragWords.map(w => ({ id: `vs_${w}`, label: this.wordToEmoji(w) || '📝' })),
      dragWords.map(w => ({ id: `vt_${w}`, label: w, correctSourceId: `vs_${w}` })),
      'Drag each picture to its word! 📖'
    ));

    // 4) Unscramble — different word, randomized scramble (not just swap ends)
    if (count > 3) {
      const word = pickFreshWord();
      const letters = this.shuffle(word.split('')).join('');
      // Ensure scrambled !== original
      const finalScrambled = letters === word
        ? word.slice(1) + word[0]
        : letters;
      exercises.push({
        type: 'input',
        question: `Fix the mixed-up letters! <span class="ws-big-letter">${finalScrambled}</span>`,
        hint: `It starts with "${word[0]}"`,
        answer: word,
        accept: word,
        xp: 25
      });
    }

    return exercises.slice(0, count);
  },

  // ═══ COLORING — expanded colors + objects, no repeated colors ═══
  genColoring(count, grade) {
    const exercises = [];
    const colors = [
      { name: 'red', emoji: '🔴' },
      { name: 'blue', emoji: '🔵' },
      { name: 'green', emoji: '🟢' },
      { name: 'yellow', emoji: '🟡' },
      { name: 'purple', emoji: '🟣' },
      { name: 'orange', emoji: '🟠' },
      { name: 'pink', emoji: '🩷' },
      { name: 'brown', emoji: '🟤' }
    ];
    const usedColors = new Set();

    const pickFreshColor = () => {
      const avail = colors.filter(c => !usedColors.has(c.name));
      if (avail.length === 0) usedColors.clear();
      const pool = avail.length > 0 ? avail : colors;
      const picked = pool[Math.floor(Math.random() * pool.length)];
      usedColors.add(picked.name);
      return picked;
    };

    // 1) Color recognition
    const c1 = pickFreshColor();
    exercises.push({
      type: 'choose',
      question: `What color is this? ${c1.emoji}`,
      options: this.shuffle([c1, ...this.shuffle(colors.filter(c => c.name !== c1.name)).slice(0, 3)]).map(c => ({ value: c.name, label: `${c.emoji} ${c.name}` })),
      answer: c1.name,
      xp: 10
    });

    // 2) Drag match: color → object — varied pairs each time
    const colorObjPool = [
      { name: 'red', obj: '🍎' }, { name: 'red', obj: '🌹' },
      { name: 'blue', obj: '🌊' }, { name: 'blue', obj: '💧' },
      { name: 'green', obj: '🍀' }, { name: 'green', obj: '🌿' },
      { name: 'yellow', obj: '⭐' }, { name: 'yellow', obj: '🌻' },
      { name: 'purple', obj: '🍇' }, { name: 'purple', obj: '🔮' },
      { name: 'orange', obj: '🍊' }, { name: 'orange', obj: '🎃' },
      { name: 'pink', obj: '🌸' }, { name: 'pink', obj: '🦩' },
      { name: 'brown', obj: '🧸' }, { name: 'brown', obj: '🌰' }
    ];
    // Pick 3 random color-object pairs (different colors)
    const shuffledPool = this.shuffle(colorObjPool);
    const usedColorNames = new Set();
    const pickedPairs = [];
    for (const pair of shuffledPool) {
      if (pickedPairs.length >= 3) break;
      if (!usedColorNames.has(pair.name)) {
        usedColorNames.add(pair.name);
        pickedPairs.push(pair);
      }
    }
    // Fallback if not enough unique colors found
    while (pickedPairs.length < 3) {
      pickedPairs.push({ name: 'red', obj: '🍎' });
    }
    pickedPairs.forEach(p => usedColors.add(p.name));
    exercises.push(this.genDragMatch(
      pickedPairs.map(c => ({ id: `cs_${c.name}`, label: c.name })),
      pickedPairs.map(c => ({ id: `ct_${c.name}`, label: c.obj, correctSourceId: `cs_${c.name}` })),
      'Drag each color to its object! 🎨'
    ));

    // 3) Color by instruction — fresh color + random item
    if (count > 2) {
      const c3 = pickFreshColor();
      const items = ['🍎', '🌈', '⭐', '🎨', '🦋', '🐞', '🌻', '💎', '🎈', '🚗'];
      const item = items[Math.floor(Math.random() * items.length)];
      exercises.push({
        type: 'choose',
        question: `What color should this ${item} be?`,
        options: this.shuffle([c3, ...this.shuffle(colors.filter(c => c.name !== c3.name)).slice(0, 3)]).map(c => ({ value: c.name, label: `${c.emoji} ${c.name}` })),
        answer: c3.name,
        xp: 10
      });
    }

    return exercises.slice(0, count);
  },

  // ═══ PUZZLES — varied patterns, no repeated sequences ═══
  genPuzzles(count, grade, maxNum) {
    const exercises = [];
    const allEmojis = ['🔵', '🟢', '🟡', '🟣', '🔴', '🟠', '🔶', '🔷', '🟩', '🟥', '🟨', '🟪'];

    // 1) Pattern completion — random pattern from different emoji sets each time
    const patternSets = [
      ['🔵', '🟢', '🟡', '🔴'],
      ['🐱', '🐶', '🐰', '🐸'],
      ['⭐', '🌈', '💫', '🌟'],
      ['🍎', '🍊', '🍋', '🍇'],
      ['🚗', '🚌', '🚲', '🚁'],
      ['🌳', '🌻', '🌵', '🌺']
    ];
    const patternSet = patternSets[Math.floor(Math.random() * patternSets.length)];
    const shuffledSet = this.shuffle(patternSet);
    const usedCount = Math.floor(Math.random() * 2) + 2; // 2 or 3
    const patternEmojis = shuffledSet.slice(0, usedCount);
    const patternLen = 3; // always show 3 items
    const pattern = [];
    for (let p = 0; p < patternLen; p++) pattern.push(patternEmojis[p % patternEmojis.length]);
    const next = patternEmojis[patternLen % patternEmojis.length];
    const wrongAnswers = this.shuffle(allEmojis.filter(e => e !== next)).slice(0, 3);
    exercises.push({
      type: 'choose',
      question: `What comes next? <span class="ws-big-letter">${pattern.join(' ')} → ___</span>`,
      options: this.shuffle([next, ...wrongAnswers]).map(e => ({ value: e, label: e })),
      answer: next,
      xp: 20
    });

    // 2) Sort by sequence — varied sort orders each time
    const sortSets = [
      { items: ['🔵', '🟢', '🟡', '🔴'], label: 'rainbow order', order: [0,1,2,3] },
      { items: ['❶', '❷', '❸', '❹'], label: 'number order', order: [0,1,2,3] },
      { items: ['🌱', '🌿', '🌳', '🌲'], label: 'size order (small→big)', order: [0,1,2,3] },
      { items: ['🐣', '🐥', '🐔', '🦃'], label: 'growth order', order: [0,1,2,3] }
    ];
    const sortSet = sortSets[Math.floor(Math.random() * sortSets.length)];
    exercises.push(this.genSortExercise(
      sortSet.items.map((e, i) => ({ id: `psort_${i}`, label: e, correctOrder: sortSet.order[i] })),
      `Put these in ${sortSet.label}! 🧩`
    ));

    // 3) Drag zone: varied categories each time
    if (count > 2) {
      const zoneConfigs = [
        {
          items: [
            { id: 'pz1', label: '🔵', zoneId: 'circle' },
            { id: 'pz2', label: '🟢', zoneId: 'circle' },
            { id: 'pz3', label: '🟡', zoneId: 'circle' },
            { id: 'pz4', label: '🔶', zoneId: 'diamond' },
            { id: 'pz5', label: '🔷', zoneId: 'diamond' }
          ],
          zones: [
            { id: 'circle', name: '🟣 Circles' },
            { id: 'diamond', name: '🔷 Diamonds' }
          ],
          question: 'Sort the shapes! 🧩'
        },
        {
          items: [
            { id: 'pz1', label: '🍎', zoneId: 'fruit' },
            { id: 'pz2', label: '🍊', zoneId: 'fruit' },
            { id: 'pz3', label: '🍋', zoneId: 'fruit' },
            { id: 'pz4', label: '🥕', zoneId: 'veggie' },
            { id: 'pz5', label: '🥦', zoneId: 'veggie' }
          ],
          zones: [
            { id: 'fruit', name: '🍎 Fruits' },
            { id: 'veggie', name: '🥦 Veggies' }
          ],
          question: 'Sort food into Fruit vs Veggie! 🧩'
        },
        {
          items: [
            { id: 'pz1', label: '🐱', zoneId: 'pet' },
            { id: 'pz2', label: '🐶', zoneId: 'pet' },
            { id: 'pz3', label: '🐰', zoneId: 'pet' },
            { id: 'pz4', label: '🦁', zoneId: 'wild' },
            { id: 'pz5', label: '🐯', zoneId: 'wild' }
          ],
          zones: [
            { id: 'pet', name: '🐱 Pets' },
            { id: 'wild', name: '🦁 Wild Animals' }
          ],
          question: 'Sort animals into Pets vs Wild! 🧩'
        }
      ];
      const zoneConfig = zoneConfigs[Math.floor(Math.random() * zoneConfigs.length)];
      exercises.push(this.genDragZone(zoneConfig.items, zoneConfig.zones, zoneConfig.question, 35));
    }

    // 4) Sequence prediction — random starting position
    if (count > 3) {
      const seqSets = [
        ['❶', '❷', '❸', '❹', '❺'],
        ['⬜', '⬛', '⬜', '⬛', '⬜'],
        ['🌑', '🌒', '🌓', '🌔', '🌕'],
        ['🎵', '🎶', '🎵', '🎶', '🎵']
      ];
      const seq = seqSets[Math.floor(Math.random() * seqSets.length)];
      const start = Math.floor(Math.random() * 3);
      const display = seq.slice(start, start + 3).join(' → ') + ' → ___';
      const next = seq[start + 3] || seq[seq.length - 1];
      const wrong = this.shuffle(seq.filter(s => s !== next)).slice(0, 3);
      exercises.push({
        type: 'choose',
        question: `What comes next? <span class="ws-big-letter">${display}</span>`,
        options: this.shuffle([next, ...wrong]).map(e => ({ value: e, label: e })),
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
      // Determine correct/wrong status for all types
      let exCorrect = false;
      if (isResults) {
        if (ex.answer !== undefined) {
          // choose / input — compare against ex.answer
          exCorrect = ex.userAnswer === ex.answer;
        } else if (ex.type === 'match') {
          exCorrect = (ex.pairs || []).every(p => ex.userMatches?.[p.id] === p.id) &&
                      Object.keys(ex.userMatches || {}).length === (ex.pairs || []).length;
        } else if (ex.type === 'sort' || ex.type === 'dragorder') {
          const items = ex.items || [];
          exCorrect = items.length > 0 && items.every(item => {
            const pos = (ex.userOrder || []).indexOf(item.id);
            return pos >= 0 && item.correctOrder === pos;
          });
        } else if (ex.type === 'dragmatch') {
          exCorrect = (ex.targets || []).every(t => ex.userMatches?.[t.id] === t.correctSourceId);
        } else if (ex.type === 'dragzone') {
          const items = ex.items || [];
          exCorrect = items.length > 0 && items.every(item => {
            const placedZones = Object.entries(ex.userZones || {}).filter(([, ids]) => ids.includes(item.id)).map(([zid]) => zid);
            return placedZones.length === 1 && placedZones[0] === item.zoneId;
          });
        }
      }
      const status = isResults ? (exCorrect ? 'ws-ex--correct' : 'ws-ex--wrong') : '';
      const feedback = isResults && !exCorrect && ex.answer !== undefined ? `<div class="ws-ex__feedback">Correct answer: <strong>${ex.answer}</strong></div>` : '';

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
      } else if (ex.type === 'dragorder') {
        html += this.renderDragOrder(ex, isResults);
      } else if (ex.type === 'dragmatch') {
        html += this.renderDragMatch(ex, isResults);
      } else if (ex.type === 'dragzone') {
        html += this.renderDragZone(ex, isResults);
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
      const nextLabel = passed ? '🎉 Next Question' : '🔄 Try Again';
      html += `
        <div class="ws__actions">
          <button class="hero__btn-primary" id="wsNextBtn">${nextLabel}</button>
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

    // Remove old delegation listeners to prevent accumulation
    if (container._matchHandler) container.removeEventListener('click', container._matchHandler);
    if (container._sortHandler) container.removeEventListener('click', container._sortHandler);
    this.removeDragHandlers(container);

    // Match clicks — event delegation on container
    container._matchHandler = (e) => {
      const btn = e.target.closest('.ws-match__item');
      if (!btn) return;
      const exId = parseInt(btn.closest('.ws-ex')?.dataset?.id);
      if (!exId) return;
      const ex = worksheet.exercises.find(ex => ex.id === exId);
      if (!ex || ex.type !== 'match') return;
      const matchDiv = btn.closest('.ws-match');
      if (!matchDiv) return;

      if (btn.dataset.side === 'left') {
        const pid = btn.dataset.mid;
        if (ex.userMatches[pid]) {
          delete ex.userMatches[pid];
          delete ex._selectedLeft;
          matchDiv.innerHTML = this.renderMatch(ex);
          return;
        }
        ex._selectedLeft = pid;
        matchDiv.querySelectorAll('.ws-match__item--selected').forEach(el => el.classList.remove('ws-match__item--selected'));
        btn.classList.add('ws-match__item--selected');
      } else if (btn.dataset.side === 'right') {
        if (!ex._selectedLeft) return;
        const leftPid = ex._selectedLeft;
        const rightPid = btn.dataset.mid;
        const alreadyMatched = Object.entries(ex.userMatches).find(([, v]) => v === rightPid);
        if (alreadyMatched) return;
        ex.userMatches[leftPid] = rightPid;
        delete ex._selectedLeft;
        matchDiv.innerHTML = this.renderMatch(ex);
      }
    };
    container.addEventListener('click', container._matchHandler);

    // Sort clicks — event delegation on container
    container._sortHandler = (e) => {
      const btn = e.target.closest('.ws-sort__item');
      if (!btn) return;
      const exId = parseInt(btn.closest('.ws-ex')?.dataset?.id);
      if (!exId) return;
      const ex = worksheet.exercises.find(ex => ex.id === exId);
      if (!ex || ex.type !== 'sort') return;
      const sortDiv = btn.closest('.ws-sort');
      if (!sortDiv) return;

      const sid = btn.dataset.sid;
      const isPlaced = btn.closest('.ws-sort__order');

      if (isPlaced) {
        ex.userOrder = ex.userOrder.filter(id => id !== sid);
      } else {
        if (!ex.userOrder.includes(sid)) {
          ex.userOrder.push(sid);
        }
      }
      sortDiv.innerHTML = this.renderSort(ex, false);
    };
    container.addEventListener('click', container._sortHandler);

    // ── DRAG-AND-DROP SYSTEM (HTML5 DnD + Touch) ──
    this.initDragHandlers(container, worksheet);

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
          } else if (ex.type === 'dragorder') {
            userAnswer = JSON.stringify(ex.userOrder || []);
            const dragItems = ex.items || [];
            let allCorrect = true;
            (ex.userOrder || []).forEach((itemId, pos) => {
              const item = dragItems.find(i => i.id === itemId);
              if (item && item.correctOrder !== pos) allCorrect = false;
            });
            if (allCorrect && (ex.userOrder || []).length === dragItems.length) score++;
          } else if (ex.type === 'dragmatch') {
            userAnswer = JSON.stringify(ex.userMatches || {});
            let allCorrect = true;
            (ex.targets || []).forEach(tgt => {
              if (ex.userMatches[tgt.id] !== tgt.correctSourceId) allCorrect = false;
            });
            if (allCorrect && Object.keys(ex.userMatches || {}).length === (ex.targets || []).length) score++;
          } else if (ex.type === 'dragzone') {
            userAnswer = JSON.stringify(ex.userZones || {});
            let allCorrect = true;
            (ex.items || []).forEach(item => {
              const placedZones = Object.entries(ex.userZones || {}).filter(([, ids]) => ids.includes(item.id)).map(([zid]) => zid);
              if (placedZones.length !== 1 || placedZones[0] !== item.zoneId) allCorrect = false;
            });
            if (allCorrect) score++;
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

        // Save to Supabase if logged in (awards worksheet XP)
        this.saveCompletion(worksheet, score, xpEarned);

        // Show worksheet XP toast (in quest mode, this is separate from quest reward XP)
        const questLabel = onQuestComplete ? '📝 Worksheet done! ' : '';
        UI.showToast('🏆 Worksheet Complete!', `${questLabel}+${xpEarned} XP • ${score}/${worksheet.exercises.length} correct`, '🏆');

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

    // Next Question / Try Again button
    const nextBtn = container.querySelector('#wsNextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
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

  // ── SOUND EFFECTS (Web Audio API - no external files) ──
  _audioCtx: null,

  _ensureAudio() {
    if (this._audioCtx) return true;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this._audioCtx = new Ctx();
      this._audioCtx.resume();
      return true;
    } catch (e) {
      return false;
    }
  },

  playPickup() {
    if (!this._ensureAudio()) return;
    const ctx = this._audioCtx;
    const now = ctx.currentTime;
    // Short ascending tone (like a quick pop/whoosh)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.12);
  },

  playDropSuccess() {
    if (!this._ensureAudio()) return;
    const ctx = this._audioCtx;
    const now = ctx.currentTime;
    // Rising chime: C5 → E5 → G5
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = now + i * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  },

  playWrong() {
    if (!this._ensureAudio()) return;
    const ctx = this._audioCtx;
    const now = ctx.currentTime;
    // Low square-wave buzz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.setValueAtTime(110, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.25);
  },

  // ── DRAG HANDLER SYSTEM ──
  removeDragHandlers(container) {
    if (container._dragStart) container.removeEventListener('dragstart', container._dragStart);
    if (container._dragOver) container.removeEventListener('dragover', container._dragOver);
    if (container._dragDrop) container.removeEventListener('drop', container._dragDrop);
    if (container._dragEnd) container.removeEventListener('dragend', container._dragEnd);
    if (container._touchStart) container.removeEventListener('touchstart', container._touchStart);
    if (container._touchMove) container.removeEventListener('touchmove', container._touchMove);
    if (container._touchEnd) container.removeEventListener('touchend', container._touchEnd);
    // Remove any floating clone
    const clone = document.querySelector('.ws-drag-clone');
    if (clone) clone.remove();
    container._dragState = null;
  },

  initDragHandlers(container, worksheet) {
    // Shared drag state stored on container
    container._dragState = { sourceId: null, exId: null, clone: null, offsetX: 0, offsetY: 0 };

    // HTML5 DnD: dragstart
    container._dragStart = (e) => {
      const item = e.target.closest('[draggable]');
      if (!item) return;
      const sourceId = item.dataset.did || item.dataset.sid || item.dataset.iid;
      if (!sourceId) return;
      const exDiv = item.closest('.ws-ex');
      if (!exDiv) return;
      container._dragState.sourceId = sourceId;
      container._dragState.exId = parseInt(exDiv.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', sourceId);
      // Add dragging class + pickup sound
      item.classList.add('ws-dragging');
      this.playPickup();
    };
    container.addEventListener('dragstart', container._dragStart);

    // HTML5 DnD: dragover (allow drop)
    container._dragOver = (e) => {
      const target = e.target.closest('.ws-dragorder__item, .ws-dragmatch__target, .ws-dragzone__zone');
      if (!target) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      // Highlight drop target
      container.querySelectorAll('.ws-drag-hover').forEach(el => el.classList.remove('ws-drag-hover'));
      target.classList.add('ws-drag-hover');
    };
    container.addEventListener('dragover', container._dragOver);

    // HTML5 DnD: drop
    container._dragDrop = (e) => {
      e.preventDefault();
      container.querySelectorAll('.ws-drag-hover, .ws-dragging').forEach(el => el.classList.remove('ws-drag-hover', 'ws-dragging'));
      const sourceId = e.dataTransfer.getData('text/plain');
      if (!sourceId || !container._dragState.exId) return;
      this.processDragDrop(container, worksheet, sourceId, e.target);
    };
    container.addEventListener('drop', container._dragDrop);

    // HTML5 DnD: dragend cleanup
    container._dragEnd = (e) => {
      container.querySelectorAll('.ws-drag-hover, .ws-dragging').forEach(el => el.classList.remove('ws-drag-hover', 'ws-dragging'));
    };
    container.addEventListener('dragend', container._dragEnd);

    // ── TOUCH DRAG SUPPORT ──
    container._touchStart = (e) => {
      const item = e.target.closest('[draggable]');
      if (!item) return;
      const sourceId = item.dataset.did || item.dataset.sid || item.dataset.iid;
      if (!sourceId) return;
      const exDiv = item.closest('.ws-ex');
      if (!exDiv) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = item.getBoundingClientRect();
      container._dragState.sourceId = sourceId;
      container._dragState.exId = parseInt(exDiv.dataset.id);
      container._dragState.offsetX = touch.clientX - rect.left;
      container._dragState.offsetY = touch.clientY - rect.top;

      // Create visual clone
      const clone = item.cloneNode(true);
      clone.className = 'ws-drag-clone';
      clone.style.position = 'fixed';
      clone.style.pointerEvents = 'none';
      clone.style.zIndex = '9999';
      clone.style.opacity = '0.85';
      clone.style.transform = 'scale(1.08) rotate(2deg)';
      clone.style.width = rect.width + 'px';
      clone.style.left = (touch.clientX - container._dragState.offsetX) + 'px';
      clone.style.top = (touch.clientY - container._dragState.offsetY) + 'px';
      document.body.appendChild(clone);
      container._dragState.clone = clone;
      item.classList.add('ws-dragging');
      this.playPickup();
    };
    container.addEventListener('touchstart', container._touchStart, { passive: false });

    container._touchMove = (e) => {
      if (!container._dragState.clone) return;
      e.preventDefault();
      const touch = e.touches[0];
      container._dragState.clone.style.left = (touch.clientX - container._dragState.offsetX) + 'px';
      container._dragState.clone.style.top = (touch.clientY - container._dragState.offsetY) + 'px';

      // Highlight drop target under finger
      container.querySelectorAll('.ws-drag-hover').forEach(el => el.classList.remove('ws-drag-hover'));
      const touchTarget = document.elementFromPoint(touch.clientX, touch.clientY);
      if (touchTarget) {
        const dropTarget = touchTarget.closest('.ws-dragorder__item, .ws-dragmatch__target, .ws-dragzone__zone');
        if (dropTarget) dropTarget.classList.add('ws-drag-hover');
      }
    };
    container.addEventListener('touchmove', container._touchMove, { passive: false });

    container._touchEnd = (e) => {
      // Remove clone
      if (container._dragState.clone) {
        container._dragState.clone.remove();
        container._dragState.clone = null;
      }
      container.querySelectorAll('.ws-drag-hover, .ws-dragging').forEach(el => el.classList.remove('ws-drag-hover', 'ws-dragging'));

      if (!container._dragState.sourceId) return;
      // Find element at touch release point
      const touch = e.changedTouches[0];
      if (touch) {
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (el) this.processDragDrop(container, worksheet, container._dragState.sourceId, el);
      }
      container._dragState.sourceId = null;
    };
    container.addEventListener('touchend', container._touchEnd);
  },

  processDragDrop(container, worksheet, sourceId, targetEl) {
    const target = targetEl.closest('.ws-dragorder__item, .ws-dragmatch__target, .ws-dragzone__zone, .ws-dragzone__placed');
    if (!target) {
      this.playWrong();
      return;
    }
    const exDiv = target.closest('.ws-ex');
    if (!exDiv) return;
    const exId = parseInt(exDiv.dataset.id);
    const ex = worksheet.exercises.find(ex => ex.id === exId);
    if (!ex) return;

    if (ex.type === 'dragorder') {
      const dropItem = target.closest('.ws-dragorder__item');
      if (!dropItem || !dropItem.dataset.did) return;
      const dropId = dropItem.dataset.did;
      const order = [...ex.userOrder];
      const fromIdx = order.indexOf(sourceId);
      const toIdx = order.indexOf(dropId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
      order.splice(fromIdx, 1);
      order.splice(toIdx, 0, sourceId);
      ex.userOrder = order;
    } else if (ex.type === 'dragmatch') {
      const targetZone = target.closest('.ws-dragmatch__target');
      if (!targetZone) return;
      const tgtId = targetZone.dataset.tid;
      if (!tgtId) return;
      // If source is already matched elsewhere, remove from there
      Object.keys(ex.userMatches).forEach(key => {
        if (ex.userMatches[key] === sourceId) delete ex.userMatches[key];
      });
      // If target already has a source, the old source is automatically
      // returned to the pool when we replace it (no early return needed)
      ex.userMatches[tgtId] = sourceId;
    } else if (ex.type === 'dragzone') {
      // Check if dropped on a zone or on a placed item (to remove it)
      const placed = target.closest('.ws-dragzone__placed');
      if (placed) {
        // Remove from its zone
        const itemId = placed.dataset.iid;
        Object.keys(ex.userZones).forEach(zid => {
          ex.userZones[zid] = ex.userZones[zid].filter(id => id !== itemId);
          if (ex.userZones[zid].length === 0) delete ex.userZones[zid];
        });
      } else {
        const zone = target.closest('.ws-dragzone__zone');
        if (!zone) return;
        const zoneId = zone.dataset.zid;
        if (!zoneId) return;
        // Remove from other zones
        Object.keys(ex.userZones).forEach(zid => {
          ex.userZones[zid] = ex.userZones[zid].filter(id => id !== sourceId);
          if (ex.userZones[zid].length === 0) delete ex.userZones[zid];
        });
        // Add to this zone
        if (!ex.userZones[zoneId]) ex.userZones[zoneId] = [];
        ex.userZones[zoneId].push(sourceId);
      }
    }

    // Success sound on valid drop
    this.playDropSuccess();
    // Re-render just this exercise
    const renderFn = ex.type === 'dragorder' ? this.renderDragOrder :
                     ex.type === 'dragmatch' ? this.renderDragMatch :
                     this.renderDragZone;
    exDiv.innerHTML = renderFn.call(this, ex, false);
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

  // ── DRAG-AND-DROP HELPERS ──
  genDragOrder(items, question, xp = 30) {
    // items: [{ id, label, correctOrder }, ...]
    const displayOrder = this.shuffle(items.map(i => i.id));
    return {
      type: 'dragorder',
      question,
      items,
      displayOrder,
      userOrder: [...displayOrder],
      xp
    };
  },

  genDragMatch(sources, targets, question, xp = 30) {
    // sources: [{ id, label }], targets: [{ id, label, correctSourceId }]
    return {
      type: 'dragmatch',
      question,
      sources: this.shuffle(sources),
      targets: this.shuffle(targets),
      userMatches: {},
      xp
    };
  },

  genDragZone(items, zones, question, xp = 35) {
    // items: [{ id, label }], zones: [{ id, name }]
    return {
      type: 'dragzone',
      question,
      items: this.shuffle(items),
      zones,
      userZones: {},
      xp
    };
  },

  // ── DRAG RENDER HELPERS ──
  renderDragOrder(ex, isResults) {
    const order = ex.userOrder || [];
    let html = `<div class="ws-dragorder" data-id="${ex.id}">`;
    if (!isResults) {
      order.forEach((itemId, pos) => {
        const item = ex.items.find(i => i.id === itemId);
        if (!item) return;
        html += `<div class="ws-dragorder__item" draggable="true" data-did="${item.id}" data-pos="${pos}">
          <span class="ws-dragorder__grip">⠿</span>
          <span class="ws-dragorder__pos">${pos + 1}</span>
          <span class="ws-dragorder__label">${item.label}</span>
        </div>`;
      });
      html += `<div class="ws-dragorder__hint">↕ Drag items to put them in the right order</div>`;
    } else {
      // Results mode
      order.forEach((itemId, pos) => {
        const item = ex.items.find(i => i.id === itemId);
        if (!item) return;
        const correct = item.correctOrder === pos;
        html += `<div class="ws-dragorder__result ${correct ? 'ws-dragorder__result--correct' : 'ws-dragorder__result--wrong'}">
          <span class="ws-dragorder__pos">${pos + 1}</span>
          <span class="ws-dragorder__label">${item.label}</span>
          ${!correct ? `<span class="ws-dragorder__result-correction">→ should be #${item.correctOrder + 1}</span>` : ''}
          ${!correct ? `<div class="ws-ex__feedback">✓ Correct: ${item.label} → position #${item.correctOrder + 1}</div>` : ''}
        </div>`;
      });
    }
    html += `</div>`;
    return html;
  },

  renderDragMatch(ex, isResults) {
    const matches = ex.userMatches || {};
    let html = `<div class="ws-dragmatch" data-id="${ex.id}">`;
    // Source pool
    html += `<div class="ws-dragmatch__sources">`;
    ex.sources.forEach(src => {
      const matched = Object.values(matches).includes(src.id);
      if (isResults) {
        const correctTarget = ex.targets.find(t => t.correctSourceId === src.id);
        const actualTargetId = matches[correctTarget?.id];
        const correct = actualTargetId === src.id;
        html += `<div class="ws-dragmatch__source ws-dragmatch__source--result ${correct ? 'ws-dragmatch__source--correct' : 'ws-dragmatch__source--wrong'}">
          ${src.label}
        </div>`;
      } else if (!matched) {
        html += `<div class="ws-dragmatch__source" draggable="true" data-sid="${src.id}">${src.label}</div>`;
      } else {
        // Already dragged to a target - show as placed
        html += `<div class="ws-dragmatch__source ws-dragmatch__source--placed" draggable="true" data-sid="${src.id}">${src.label} ✅</div>`;
      }
    });
    html += `</div>`;
    // Target zones
    html += `<div class="ws-dragmatch__targets">`;
    ex.targets.forEach(tgt => {
      const matchedSourceId = matches[tgt.id];
      const matchedSrc = matchedSourceId ? ex.sources.find(s => s.id === matchedSourceId) : null;
      let cls = 'ws-dragmatch__target';
      if (isResults) {
        cls += matchedSourceId === tgt.correctSourceId ? ' ws-dragmatch__target--correct' : ' ws-dragmatch__target--wrong';
      } else if (matchedSrc) {
        cls += ' ws-dragmatch__target--filled';
      }
      html += `<div class="${cls}" data-tid="${tgt.id}">
        <div class="ws-dragmatch__target-label">${tgt.label}</div>
        <div class="ws-dragmatch__target-zone">
          ${matchedSrc ? `<span class="ws-dragmatch__dropped">${matchedSrc.label}</span>` : '⬇ Drop here'}
        </div>
      </div>`;
    });
    html += `</div></div>`;
    // Feedback for wrong matches
    if (isResults) {
      ex.targets.forEach(tgt => {
        if (matches[tgt.id] !== tgt.correctSourceId) {
          const correctSrc = ex.sources.find(s => s.id === tgt.correctSourceId);
          html += `<div class="ws-ex__feedback">✓ Correct: ${tgt.label} → ${correctSrc?.label || '?'}</div>`;
        }
      });
    }
    return html;
  },

  renderDragZone(ex, isResults) {
    const zones = ex.userZones || {};
    let html = `<div class="ws-dragzone" data-id="${ex.id}">`;
    if (!isResults) {
      // Item pool
      html += `<div class="ws-dragzone__pool">`;
      ex.items.forEach(item => {
        const placed = Object.values(zones).flat().includes(item.id);
        if (!placed) {
          html += `<div class="ws-dragzone__item" draggable="true" data-iid="${item.id}">${item.label}</div>`;
        }
      });
      html += `</div>`;
      // Zones
      html += `<div class="ws-dragzone__zones">`;
      ex.zones.forEach(zone => {
        const zoneItems = (zones[zone.id] || []).map(iid => ex.items.find(i => i.id === iid)).filter(Boolean);
        html += `<div class="ws-dragzone__zone" data-zid="${zone.id}">
          <div class="ws-dragzone__zone-name">${zone.name}</div>
          <div class="ws-dragzone__zone-drop">
            ${zoneItems.length > 0
              ? zoneItems.map(item => `<span class="ws-dragzone__placed" draggable="true" data-iid="${item.id}" data-zid="${zone.id}">${item.label} ✕</span>`).join('')
              : '<span class="ws-dragzone__zone-hint">⬇ Drop here</span>'
            }
          </div>
        </div>`;
      });
      html += `</div>`;
    } else {
      // Results mode
      html += `<div class="ws-dragzone__results">`;
      ex.zones.forEach(zone => {
        const correctItems = ex.items.filter(i => i.zoneId === zone.id);
        const placedItems = (zones[zone.id] || []).map(iid => ex.items.find(i => i.id === iid)).filter(Boolean);
        const allCorrect = correctItems.every(ci => placedItems.includes(ci)) && placedItems.every(pi => pi.zoneId === zone.id);
        html += `<div class="ws-dragzone__zone-result ${allCorrect ? 'ws-dragzone__zone-result--correct' : 'ws-dragzone__zone-result--wrong'}">
          <div class="ws-dragzone__zone-name">${zone.name}</div>
          <div class="ws-dragzone__zone-items">
            ${correctItems.map(item => {
              const placed = placedItems.includes(item);
              return `<span class="ws-dragzone__zone-item ${placed ? 'ws-dragzone__zone-item--correct' : 'ws-dragzone__zone-item--missing'}">${item.label}</span>`;
            }).join('')}
          </div>
          ${!allCorrect ? `<div class="ws-dragzone__zone-correction">Correct items: ${correctItems.map(i => i.label).join(', ')}</div>` : ''}
        </div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
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
