// ============================================================
// PARTICLES.JS — Sistema de partículas y fuegos artificiales
// ============================================================

let particles = [];
let fireworks = [];

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      size: 2 + Math.random() * 3,
      color: color,
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function spawnFirework() {
  const x = Math.random() * canvas.width;
  const y = Math.random() * (canvas.height * 0.6);
  const colors = ['#ff00ff', '#00ffff', '#ffd700', '#ff69b4', '#00ff88', '#ff4500'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const particlesCount = 20 + Math.floor(Math.random() * 15);
  
  for (let i = 0; i < particlesCount; i++) {
    const angle = (Math.PI * 2 * i) / particlesCount;
    const speed = 2 + Math.random() * 3;
    fireworks.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 40 + Math.random() * 20,
      maxLife: 60,
      size: 2 + Math.random() * 2,
      color: color,
    });
  }
}

function updateFireworks() {
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const p = fireworks[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;
    p.life--;
    if (p.life <= 0) fireworks.splice(i, 1);
  }
}

function drawFireworks(ctxRef) {
  fireworks.forEach(p => {
    ctxRef.globalAlpha = p.life / p.maxLife;
    ctxRef.fillStyle = p.color;
    ctxRef.shadowColor = p.color;
    ctxRef.shadowBlur = 8;
    ctxRef.beginPath();
    ctxRef.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctxRef.fill();
  });
  ctxRef.shadowBlur = 0;
  ctxRef.globalAlpha = 1;
}