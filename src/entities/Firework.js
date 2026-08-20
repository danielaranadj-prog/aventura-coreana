// ============================================================
// FUEGOS ARTIFICIALES
// ============================================================

export class FireworkSystem {
  constructor(maxParticles = 500) {
    this.fireworks = [];
    this.pool = [];
    for (let i = 0; i < maxParticles; i++) {
      this.pool.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, color: '#fff', size: 2, active: false });
    }
  }

  spawn() {
    const colors = ['#ff0040','#00ffff','#ffd700','#ff69b4','#00ff88','#ff8c00','#9d4edd'];
    const x = 30 + Math.random() * 340;
    const y = 80 + Math.random() * 120;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const count = 20 + Math.floor(Math.random() * 16);
    const particles = [];
    for (let i = 0; i < count; i++) {
      const p = this.pool.find(p => !p.active);
      if (!p) break;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1.5 + Math.random() * 2.5;
      p.x = x; p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 40 + Math.random() * 30;
      p.maxLife = p.life;
      p.color = color;
      p.size = 2 + Math.random() * 2.5;
      p.active = true;
      particles.push(p);
    }
    this.fireworks.push(particles);
  }

  update() {
    for (let f = this.fireworks.length - 1; f >= 0; f--) {
      const fw = this.fireworks[f];
      let alive = false;
      for (const p of fw) {
        if (!p.active) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life--;
        if (p.life > 0) alive = true;
        else p.active = false;
      }
      if (!alive) this.fireworks.splice(f, 1);
    }
  }

  draw(ctx) {
    for (const fw of this.fireworks) {
      for (const p of fw) {
        if (!p.active || p.life <= 0) continue;
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6 * alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
}
