// ============================================================
// SISTEMA DE PARTÍCULAS CON OBJECT POOLING
// ============================================================

export class ParticleSystem {
  constructor(maxParticles = 300) {
    this.pool = [];
    this.active = [];
    for (let i = 0; i < maxParticles; i++) {
      this.pool.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, color: '#fff', size: 2, active: false });
    }
  }

  spawn(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const p = this._getFree();
      if (!p) break;
      p.x = x;
      p.y = y;
      p.vx = (Math.random() - 0.5) * 6;
      p.vy = (Math.random() - 1) * 6;
      p.life = 30 + Math.random() * 20;
      p.maxLife = p.life;
      p.color = color;
      p.size = 3 + Math.random() * 4;
      p.active = true;
      this.active.push(p);
    }
  }

  _getFree() {
    return this.pool.find(p => !p.active);
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life--;
      if (p.life <= 0) {
        p.active = false;
        this.active.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.active) {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
