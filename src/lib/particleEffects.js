/**
 * GPU-Friendly Particle System for RockHound-GO
 * Handles badge unlocks, rarity auras, geological event visualizations
 * Optimized for mobile: paused during scroll, low overhead
 */

export class ParticleEmitter {
  constructor(canvas, particleCount = 50) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d');
    this.particles = [];
    this.particleCount = particleCount;
    this.animationId = null;
    this.isPaused = false;
  }

  /**
   * Emit particles from point (badge unlock effect)
   */
  emitFromPoint(x, y, color = '#8B5CF6', intensity = 1) {
    const count = Math.floor(this.particleCount * intensity);

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const velocity = 2 + Math.random() * 4;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  /**
   * Emit rarity aura (continuous, subtle glow)
   */
  emitRarityAura(x, y, rarity = 'common') {
    const rarityConfig = {
      common: { color: '#9CA3AF', rate: 2, speed: 0.5 },
      uncommon: { color: '#3B82F6', rate: 4, speed: 0.8 },
      rare: { color: '#8B5CF6', rate: 6, speed: 1.2 },
      legendary: { color: '#FBBF24', rate: 8, speed: 1.5 },
    };

    const config = rarityConfig[rarity] || rarityConfig.common;

    for (let i = 0; i < config.rate; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 40;

      this.particles.push({
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        vx: Math.cos(angle) * config.speed * -0.3,
        vy: Math.sin(angle) * config.speed * -0.3,
        life: 0.7 + Math.random() * 0.3,
        color: config.color,
        size: 1 + Math.random() * 2,
      });
    }
  }

  /**
   * Update and render particles
   */
  update() {
    if (this.isPaused || !this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Apply gravity
      p.vy += 0.1;

      // Fade out
      p.life -= 0.02;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Render
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.update());
    }
  }

  /**
   * Start animation loop
   */
  start() {
    this.isPaused = false;
    this.animationId = requestAnimationFrame(() => this.update());
  }

  /**
   * Pause without stopping (for scroll optimization)
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume animation
   */
  resume() {
    this.isPaused = false;
    this.update();
  }

  /**
   * Stop and clear
   */
  stop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.particles = [];
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

/**
 * Crystalline refraction effect (specimen/badge reveal)
 * Simulates light bending through crystal structures
 */
export function createCrystallineOverlay(imageUrl) {
  // CSS + SVG-based refraction
  const svg = `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="crystal">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" />
          <feDisplacementMap in="SourceGraphic" scale="5" />
        </filter>
        <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:0.4" />
          <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:0.1" />
        </linearGradient>
      </defs>
      <image href="${imageUrl}" width="200" height="200" filter="url(#crystal)" />
      <polygon points="0,0 200,0 200,200 0,200" fill="url(#glow)" opacity="0.3" />
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Pause particles when scrolling (performance optimization)
 */
export function setupScrollOptimizedParticles(emitter) {
  let scrollTimeout;

  window.addEventListener('scroll', () => {
    emitter.pause();

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      emitter.resume();
    }, 150);
  });

  return () => window.removeEventListener('scroll', () => {});
}

/**
 * Badge unlock sequence
 * Plays visual + haptic feedback
 */
export async function playBadgeUnlockSequence(
  badgeId,
  badgeName,
  rarityLevel = 'uncommon'
) {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '9999';
  canvas.style.pointerEvents = 'none';
  document.body.appendChild(canvas);

  const emitter = new ParticleEmitter(canvas, 150);
  emitter.start();

  // Central burst
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  emitter.emitFromPoint(centerX, centerY, '#FBBF24', 1.5);

  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }

  // Text reveal
  const textEl = document.createElement('div');
  textEl.textContent = `🏆 ${badgeName} Unlocked!`;
  textEl.style.position = 'fixed';
  textEl.style.top = '50%';
  textEl.style.left = '50%';
  textEl.style.transform = 'translate(-50%, -50%)';
  textEl.style.fontSize = '28px';
  textEl.style.fontWeight = 'bold';
  textEl.style.color = '#FBBF24';
  textEl.style.textShadow = '0 0 30px rgba(251, 191, 36, 0.8)';
  textEl.style.animation = 'pop-reveal 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  textEl.style.zIndex = '10000';
  document.body.appendChild(textEl);

  // Cleanup
  await new Promise((r) => setTimeout(r, 2500));
  emitter.stop();
  canvas.remove();
  textEl.remove();
}

/**
 * Add pop reveal animation keyframes to stylesheet
 */
export function injectParticleStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pop-reveal {
      0% { transform: translate(-50%, -50%) scale(0.1); opacity: 0; }
      50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    @keyframes liquid-glow {
      0%, 100% { filter: brightness(1) drop-shadow(0 0 10px currentColor); }
      50% { filter: brightness(1.2) drop-shadow(0 0 20px currentColor); }
    }
  `;
  document.head.appendChild(style);
}