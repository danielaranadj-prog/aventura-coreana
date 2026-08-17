// ============================================================
// PARTÍCULAS Y FUEGOS ARTIFICIALES
// ============================================================
let particles = [];
let fireworks = [];

function spawnParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 1) * 6,
      life: 30 + Math.random() * 20,
      color,
      size: 3 + Math.random() * 4,
    });
  }
}

function spawnFirework() {
  const colors = ['#ff0040', '#00ffff', '#ffd700', '#ff69b4', '#00ff88', '#ff8c00', '#9d4edd'];
  const x = 30 + Math.random() * 340;
  const y = 80 + Math.random() * 120;
  const color = colors[Math.floor(Math.random() * colors.length)];
  const fwParticles = [];
  const count = 20 + Math.floor(Math.random() * 16);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 1.5 + Math.random() * 2.5;
    fwParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 40 + Math.random() * 30,
      maxLife: 40 + Math.random() * 30,
      color,
      size: 2 + Math.random() * 2.5,
    });
  }
  fireworks.push({ particles: fwParticles, exploded: true });
}

function updateFireworks() {
  for (let f = fireworks.length - 1; f >= 0; f--) {
    const fw = fireworks[f];
    let alive = false;
    fw.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life--;
      if (p.life > 0) alive = true;
    });
    if (!alive) fireworks.splice(f, 1);
  }
}

function drawFireworks(ctx) {
  fireworks.forEach(fw => {
    fw.particles.forEach(p => {
      if (p.life <= 0) return;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6 * alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
