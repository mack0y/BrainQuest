// ═══════════════════════════════════════════
// BrainQuest – UI Utilities
// ═══════════════════════════════════════════

const UI = {
  toastTimer: null,

  // ── PARTICLE FIELD ──
  createParticles() {
    const container = document.getElementById('particle-field');
    if (!container) return;

    const colors = ['#00f0b5', '#7c3aed', '#f59e0b', '#f43f5e', '#06b6d4'];

    for (let i = 0; i < 50; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 3 + 1.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      p.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${Math.random() * 100}%; top: ${Math.random() * 100}%;
        background: ${color};
        --dur: ${6 + Math.random() * 8}s;
        --delay: -${Math.random() * 10}s;
        --min: ${0.05 + Math.random() * 0.1};
        --mid: ${0.15 + Math.random() * 0.2};
        --max: ${0.25 + Math.random() * 0.3};
      `;
      container.appendChild(p);
    }
  },

  // ── CURSOR GLOW ──
  initCursorGlow() {
    const cg = document.getElementById('cursor-glow');
    if (!cg) return;

    document.addEventListener('mousemove', e => {
      cg.style.left = e.clientX + 'px';
      cg.style.top = e.clientY + 'px';
    });
  },

  // ── SCROLL REVEAL ──
  initScrollReveal() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach((en, i) => {
        if (en.isIntersecting) {
          setTimeout(() => en.target.classList.add('reveal--visible'), i * 70);
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.07 });

    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  },

  // ── TOAST ──
  showToast(title, sub, icon = '🎉') {
    const toast = document.getElementById('toast');
    if (!toast) {
      // Create toast on the fly
      this.createToast();
      setTimeout(() => this.showToast(title, sub, icon), 50);
      return;
    }

    toast.querySelector('.toast__icon').textContent = icon;
    toast.querySelector('.toast__title').textContent = title;
    toast.querySelector('.toast__sub').textContent = sub || '';
    toast.classList.add('toast--show');

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove('toast--show'), 3500);
  },

  createToast() {
    const existing = document.getElementById('toast');
    if (existing) return;

    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast__icon">🎉</div>
      <div class="toast__content">
        <div class="toast__title">Level Up!</div>
        <div class="toast__sub">+50 XP earned</div>
      </div>
    `;
    document.body.appendChild(toast);
  },

  // ── LEVEL-UP CELEBRATION ──
  celebrateLevelUp(level) {
    // Show toast
    this.showToast(
      `🎊 Level ${level} Unlocked!`,
      'New quests available! Keep going!',
      '🎊'
    );

    // Create confetti effect
    this.createConfetti();
  },

  createConfetti() {
    const colors = ['#00f0b5', '#7c3aed', '#f59e0b', '#f43f5e', '#06b6d4', '#ffd700'];
    const container = document.body;

    for (let i = 0; i < 40; i++) {
      const confetti = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 8 + 4;
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const dur = Math.random() * 2 + 1.5;

      confetti.style.cssText = `
        position: fixed; z-index: 9999; pointer-events: none;
        width: ${size}px; height: ${size * 0.6}px;
        background: ${color}; border-radius: 2px;
        left: ${left}%; top: -20px;
        opacity: 0.9;
        animation: confetti-fall ${dur}s ease-in ${delay}s forwards;
        transform: rotate(${Math.random() * 360}deg);
      `;

      // Add keyframe if not exists
      if (!document.getElementById('confetti-style')) {
        const style = document.createElement('style');
        style.id = 'confetti-style';
        style.textContent = `
          @keyframes confetti-fall {
            0% { transform: translateY(0) rotate(0deg); opacity: 0.9; }
            100% { transform: translateY(100vh) rotate(${Math.random() > 0.5 ? '720' : '-720'}deg); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      container.appendChild(confetti);
      setTimeout(() => confetti.remove(), (dur + delay) * 1000 + 100);
    }
  },

  // ── MAGNETIC BUTTONS ──
  initMagneticButtons() {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
      });
      btn.addEventListener('mouseleave', () => btn.style.transform = '');
    });
  },

  // ── HERO TILT ──
  initHeroTilt() {
    const title = document.querySelector('.hero__title');
    if (!title) return;

    document.addEventListener('mousemove', e => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      title.style.transform = `rotateY(${dx * 6}deg) rotateX(${-dy * 3}deg)`;
    });
  },

  // ── SKELETON LOADING ──
  showSkeleton(container, count = 3) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const skel = document.createElement('div');
      skel.className = 'skeleton';
      skel.style.height = `${60 + Math.random() * 40}px`;
      skel.style.marginBottom = '12px';
      container.appendChild(skel);
    }
  },

  // ── FORMAT NUMBER ──
  formatXp(xp) {
    if (xp >= 1000) return (xp / 1000).toFixed(1) + 'k';
    return xp.toString();
  }
};

// ── REGISTER SERVICE WORKER ──
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// ── INITIALIZE ON DOM READY ──
document.addEventListener('DOMContentLoaded', () => {
  UI.createParticles();
  UI.initCursorGlow();
  UI.createToast();
  UI.initMagneticButtons();
  UI.initHeroTilt();
  registerSW();
});
