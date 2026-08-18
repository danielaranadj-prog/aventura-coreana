// ============================================================
// RENDERER — Dibujo de todo el juego
// ============================================================

// ---------- FONDOS ----------
function drawStars() {
  const stars = [
    { x: 50, y: 30, s: 1.5 }, { x: 120, y: 80, s: 1 }, { x: 200, y: 40, s: 2 },
    { x: 300, y: 120, s: 1 }, { x: 80, y: 200, s: 1.5 }, { x: 350, y: 250, s: 1 },
    { x: 150, y: 350, s: 2 }, { x: 280, y: 400, s: 1 }, { x: 60, y: 500, s: 1 },
    { x: 320, y: 550, s: 1.5 }, { x: 180, y: 600, s: 1 }, { x: 380, y: 50, s: 1 },
    { x: 30, y: 300, s: 2 }, { x: 370, y: 350, s: 1 }, { x: 100, y: 450, s: 1.5 },
    { x: 250, y: 500, s: 1 },
  ];
  stars.forEach(s => {
    const parallaxX = (s.x - cameraX * 0.1) % (LEVEL_WIDTH * TILE);
    const drawX = parallaxX < -10 ? parallaxX + LEVEL_WIDTH * TILE : parallaxX;
    ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.random() * 0.4) + ')';
    ctx.beginPath(); ctx.arc(drawX, s.y, s.s, 0, Math.PI * 2); ctx.fill();
  });
}

function drawNebula() {
  const nebulas = [
    { x: 100, y: 150, r: 80, c: 'rgba(255,0,255,0.08)' },
    { x: 300, y: 300, r: 100, c: 'rgba(0,255,255,0.06)' },
    { x: 200, y: 500, r: 120, c: 'rgba(255,105,180,0.07)' },
    { x: 50, y: 400, r: 60, c: 'rgba(138,43,226,0.09)' },
  ];
  nebulas.forEach(n => {
    const parallaxX = (n.x - cameraX * 0.05) % (LEVEL_WIDTH * TILE);
    const drawX = parallaxX < -200 ? parallaxX + LEVEL_WIDTH * TILE : parallaxX;
    const grad = ctx.createRadialGradient(drawX, n.y, 0, drawX, n.y, n.r);
    grad.addColorStop(0, n.c);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(drawX, n.y, n.r, 0, Math.PI * 2); ctx.fill();
  });
}

function drawFactoryBackground() {
  const smokes = [
    { x: 80, y: 100, r: 90, c: 'rgba(80,80,80,0.12)' },
    { x: 250, y: 250, r: 110, c: 'rgba(60,60,60,0.10)' },
    { x: 150, y: 450, r: 130, c: 'rgba(90,90,90,0.08)' },
    { x: 350, y: 80, r: 70, c: 'rgba(100,100,100,0.09)' },
  ];
  smokes.forEach(s => {
    const parallaxX = (s.x - cameraX * 0.03) % (LEVEL_WIDTH * TILE);
    const drawX = parallaxX < -200 ? parallaxX + LEVEL_WIDTH * TILE : parallaxX;
    const grad = ctx.createRadialGradient(drawX, s.y, 0, drawX, s.y, s.r);
    grad.addColorStop(0, s.c);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(drawX, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  });

  for (let i = 0; i < 12; i++) {
    const sx = ((i * 67 + 30) - cameraX * 0.15) % (LEVEL_WIDTH * TILE);
    const drawX = sx < 0 ? sx + LEVEL_WIDTH * TILE : sx;
    const sy = 50 + (i * 47) % 500;
    const flicker = 0.4 + Math.sin(Date.now() / 200 + i) * 0.3;
    ctx.fillStyle = `rgba(255, 100, 0, ${flicker})`;
    ctx.shadowColor = '#ff4500';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(drawX, sy, 1.5 + Math.random(), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = 'rgba(40, 30, 30, 0.4)';
  for (let i = 0; i < 6; i++) {
    const px = ((i * 300 + 100) - cameraX * 0.08) % (LEVEL_WIDTH * TILE);
    const drawX = px < -60 ? px + LEVEL_WIDTH * TILE : px;
    ctx.fillRect(drawX, 0, 24, canvas.height);
    ctx.fillStyle = 'rgba(60, 45, 40, 0.5)';
    for (let r = 20; r < canvas.height; r += 60) {
      ctx.fillRect(drawX - 2, r, 28, 8);
    }
    ctx.fillStyle = 'rgba(40, 30, 30, 0.4)';
  }
}

// ---------- TILES ----------
function drawTile(tile, px, py) {
  if (currentLevelTheme === 'factory') {
    _drawFactoryTile(tile, px, py);
  } else {
    _drawNebulaTile(tile, px, py);
  }
}

function _drawNebulaTile(tile, px, py) {
  if (tile === 1) {
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(px, py, TILE, 3);
    ctx.fillStyle = '#4a1a6b';
    ctx.fillRect(px + 4, py + 10, 4, 4);
    ctx.fillRect(px + 20, py + 18, 5, 5);
    ctx.fillRect(px + 12, py + 24, 3, 3);
    ctx.strokeStyle = 'rgba(255,0,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
  } else if (tile === 2) {
    ctx.fillStyle = '#00b4d8';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(px + TILE / 2, py); ctx.lineTo(px + TILE / 2, py + TILE);
    ctx.moveTo(px, py + TILE / 2); ctx.lineTo(px + TILE / 2, py + TILE / 2);
    ctx.moveTo(px + TILE / 2, py + TILE / 4); ctx.lineTo(px + TILE, py + TILE / 4);
    ctx.moveTo(px + TILE / 2, py + TILE * 3 / 4); ctx.lineTo(px + TILE, py + TILE * 3 / 4);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (tile === 3) {
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff5cc';
    ctx.fillRect(px + 8, py + 8, 6, 6);
    ctx.fillRect(px + 18, py + 12, 4, 4);
    ctx.shadowBlur = 0;
  } else if (tile === 4) {
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(px, py, TILE * 2, TILE * 2);
    ctx.fillStyle = '#00cc6a';
    ctx.fillRect(px, py, TILE * 2, 8);
    ctx.fillRect(px, py + TILE, TILE * 2, 4);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, TILE * 2, TILE * 2);
    ctx.fillStyle = '#66ffaa';
    ctx.fillRect(px + 4, py + 12, 4, TILE * 2 - 16);
  }
}

function _drawFactoryTile(tile, px, py) {
  if (tile === 1) {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#3d3d3d';
    ctx.fillRect(px, py + 4, TILE, 2);
    ctx.fillRect(px, py + 18, TILE, 2);
    ctx.fillRect(px + 4, py, 2, TILE);
    ctx.fillRect(px + 20, py, 2, TILE);
    ctx.fillStyle = '#ff4500';
    ctx.fillRect(px, py, TILE, 2);
    ctx.fillRect(px, py + TILE - 2, TILE, 2);
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(px + 6, py + 6, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + TILE - 6, py + TILE - 6, 2, 0, Math.PI * 2); ctx.fill();
  } else if (tile === 2) {
    ctx.fillStyle = '#3d3d3d';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#ff4500';
    ctx.fillRect(px, py, TILE, 3);
    ctx.fillRect(px, py + TILE - 3, TILE, 3);
    ctx.shadowColor = '#ff4500';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(px + 8, py + 8, 4, 4);
    ctx.fillRect(px + 20, py + 8, 4, 4);
    ctx.fillRect(px + 8, py + 20, 4, 4);
    ctx.fillRect(px + 20, py + 20, 4, 4);
  } else if (tile === 3) {
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = '#ff4500';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffeebb';
    ctx.fillRect(px + 8, py + 8, 6, 6);
    ctx.fillRect(px + 18, py + 12, 4, 4);
    ctx.shadowBlur = 0;
  } else if (tile === 4) {
    // CORREGIDO: Reducido a 32x32 px (1x1 tile) para coincidir exactamente con la colisión física
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#666';
    ctx.fillRect(px, py, TILE, 6);
    ctx.fillRect(px, py + TILE - 6, TILE, 6);
    ctx.strokeStyle = '#ff4500';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, TILE, TILE);
    ctx.fillStyle = '#333';
    ctx.fillRect(px + 4, py + 6, 4, TILE - 12);
    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.arc(px + 6, py + 6, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + TILE - 6, py + TILE - 6, 2, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------- ESTRUCTURAS FINALES ----------
function drawFinalStructure(ctxRef, centerX, baseY) {
  if (currentLevelTheme === 'factory') {
    _drawFactoryExit(ctxRef, centerX, baseY);
  } else {
    _drawPyramid(ctxRef, centerX, baseY);
  }
}

function _drawPyramid(ctxRef, centerX, baseY) {
  const w = 112;
  const x = centerX - w / 2;
  ctxRef.fillStyle = 'rgba(0,0,0,0.25)';
  ctxRef.beginPath();
  ctxRef.ellipse(centerX, baseY + 6, w / 2 + 10, 10, 0, 0, Math.PI * 2);
  ctxRef.fill();

  ctxRef.fillStyle = '#c4b088';
  ctxRef.fillRect(x, baseY - 32, w, 32);
  ctxRef.fillStyle = '#a89070';
  ctxRef.fillRect(x + w - 14, baseY - 32, 14, 32);
  ctxRef.fillStyle = '#e6d5b8';
  ctxRef.fillRect(x, baseY - 34, w, 2);
  ctxRef.fillStyle = 'rgba(0,0,0,0.06)';
  ctxRef.fillRect(x + 8, baseY - 24, 20, 2);
  ctxRef.fillRect(x + 44, baseY - 18, 24, 2);
  ctxRef.fillRect(x + 84, baseY - 26, 16, 2);

  ctxRef.fillStyle = '#d4c4a0';
  ctxRef.fillRect(x + 8, baseY - 60, 96, 28);
  ctxRef.fillStyle = '#b8a078';
  ctxRef.fillRect(x + 90, baseY - 60, 14, 28);
  ctxRef.fillStyle = '#e6d5b8';
  ctxRef.fillRect(x + 8, baseY - 62, 96, 2);

  ctxRef.fillStyle = '#c4b088';
  ctxRef.fillRect(x + 16, baseY - 84, 80, 24);
  ctxRef.fillStyle = '#a89070';
  ctxRef.fillRect(x + 82, baseY - 84, 14, 24);
  ctxRef.fillStyle = '#d4c4a0';
  ctxRef.fillRect(x + 16, baseY - 86, 80, 2);

  ctxRef.fillStyle = '#d4c4a0';
  ctxRef.fillRect(x + 24, baseY - 106, 64, 22);
  ctxRef.fillStyle = '#b8a078';
  ctxRef.fillRect(x + 74, baseY - 106, 14, 22);
  ctxRef.fillStyle = '#e6d5b8';
  ctxRef.fillRect(x + 24, baseY - 108, 64, 2);

  ctxRef.fillStyle = '#c4b088';
  ctxRef.fillRect(x + 32, baseY - 134, 48, 28);
  ctxRef.fillStyle = '#a89070';
  ctxRef.fillRect(x + 66, baseY - 134, 14, 28);
  ctxRef.fillStyle = '#d4c4a0';
  ctxRef.fillRect(x + 32, baseY - 136, 48, 2);

  ctxRef.fillStyle = '#e6d5b8';
  ctxRef.fillRect(x + 44, baseY - 152, 24, 18);
  ctxRef.fillStyle = '#c4b088';
  ctxRef.fillRect(x + 62, baseY - 152, 6, 18);
  ctxRef.fillStyle = '#d4c4a0';
  ctxRef.fillRect(x + 44, baseY - 154, 24, 2);

  const drawWindow = (wx, wy, lit = false) => {
    ctxRef.fillStyle = lit ? '#ffd700' : '#3d2b1a';
    ctxRef.beginPath();
    ctxRef.moveTo(wx, wy + 10);
    ctxRef.quadraticCurveTo(wx + 5, wy - 3, wx + 10, wy + 10);
    ctxRef.lineTo(wx + 10, wy + 10);
    ctxRef.lineTo(wx, wy + 10);
    ctxRef.fill();
    if (lit) {
      ctxRef.save();
      ctxRef.shadowColor = '#ffd700';
      ctxRef.shadowBlur = 10;
      ctxRef.fillStyle = '#ffd700';
      ctxRef.beginPath();
      ctxRef.moveTo(wx + 1, wy + 9);
      ctxRef.quadraticCurveTo(wx + 5, wy - 1, wx + 9, wy + 9);
      ctxRef.fill();
      ctxRef.restore();
    }
    ctxRef.strokeStyle = 'rgba(0,0,0,0.2)';
    ctxRef.lineWidth = 1;
    ctxRef.beginPath();
    ctxRef.moveTo(wx, wy + 10);
    ctxRef.quadraticCurveTo(wx + 5, wy - 3, wx + 10, wy + 10);
    ctxRef.stroke();
  };

  drawWindow(x + 14, baseY - 30, true);
  drawWindow(x + 38, baseY - 30, false);
  drawWindow(x + 62, baseY - 30, true);
  drawWindow(x + 86, baseY - 30, false);
  drawWindow(x + 22, baseY - 56, false);
  drawWindow(x + 50, baseY - 56, true);
  drawWindow(x + 78, baseY - 56, false);
  drawWindow(x + 30, baseY - 80, true);
  drawWindow(x + 58, baseY - 80, false);
  drawWindow(x + 38, baseY - 102, true);
  drawWindow(x + 62, baseY - 102, false);
  drawWindow(x + 51, baseY - 130, true);

  ctxRef.fillStyle = '#d4c5a9';
  ctxRef.beginPath();
  ctxRef.moveTo(x + w, baseY);
  ctxRef.quadraticCurveTo(x + w + 28, baseY - 50, x + w + 14, baseY - 100);
  ctxRef.lineTo(x + w + 26, baseY - 100);
  ctxRef.quadraticCurveTo(x + w + 40, baseY - 50, x + w + 18, baseY);
  ctxRef.fill();
  ctxRef.strokeStyle = '#b8a88a';
  ctxRef.lineWidth = 1;
  ctxRef.stroke();
  ctxRef.strokeStyle = 'rgba(0,0,0,0.08)';
  ctxRef.beginPath();
  ctxRef.moveTo(x + w + 6, baseY - 10);
  ctxRef.quadraticCurveTo(x + w + 20, baseY - 50, x + w + 10, baseY - 90);
  ctxRef.stroke();

  ctxRef.save();
  ctxRef.shadowColor = '#ffd700';
  ctxRef.shadowBlur = 20;
  ctxRef.fillStyle = 'rgba(255, 215, 0, 0.3)';
  ctxRef.beginPath();
  ctxRef.arc(centerX, baseY - 152, 10, 0, Math.PI * 2);
  ctxRef.fill();
  ctxRef.restore();
}

function _drawFactoryExit(ctxRef, centerX, baseY) {
  const w = 120;
  const x = centerX - w / 2;

  ctxRef.fillStyle = 'rgba(0,0,0,0.4)';
  ctxRef.beginPath();
  ctxRef.ellipse(centerX, baseY + 6, w / 2 + 12, 10, 0, 0, Math.PI * 2);
  ctxRef.fill();

  ctxRef.fillStyle = '#3a3a3a';
  ctxRef.fillRect(x, baseY - 140, w, 140);
  ctxRef.fillStyle = '#2a2a2a';
  ctxRef.fillRect(x + 8, baseY - 132, w - 16, 124);

  ctxRef.fillStyle = '#555';
  for (let by = baseY - 130; by < baseY; by += 20) {
    ctxRef.fillRect(x + 4, by, w - 8, 4);
  }

  ctxRef.fillStyle = '#1a1a1a';
  ctxRef.fillRect(x + 20, baseY - 110, w - 40, 90);

  const blink = Math.sin(Date.now() / 200) > 0;
  ctxRef.fillStyle = blink ? '#ff0000' : '#550000';
  ctxRef.shadowColor = '#ff0000';
  ctxRef.shadowBlur = blink ? 15 : 0;
  ctxRef.beginPath();
  ctxRef.arc(x + 10, baseY - 130, 4, 0, Math.PI * 2);
  ctxRef.fill();
  ctxRef.beginPath();
  ctxRef.arc(x + w - 10, baseY - 130, 4, 0, Math.PI * 2);
  ctxRef.fill();
  ctxRef.shadowBlur = 0;

  ctxRef.strokeStyle = '#00ff41';
  ctxRef.lineWidth = 2;
  ctxRef.shadowColor = '#00ff41';
  ctxRef.shadowBlur = 10;
  ctxRef.strokeRect(x + 18, baseY - 112, w - 36, 94);
  ctxRef.shadowBlur = 0;

  ctxRef.fillStyle = '#00ff41';
  ctxRef.font = 'bold 10px monospace';
  ctxRef.textAlign = 'center';
  ctxRef.fillText('EXIT', centerX, baseY - 115);

  ctxRef.fillStyle = 'rgba(0, 255, 65, 0.15)';
  ctxRef.fillRect(x + 22, baseY - 108, w - 44, 86);
}

// ---------- PELIGROS (Fábrica) ----------
function drawHazards() {
  if (currentLevelTheme !== 'factory') return;
  hazardZones.forEach(h => {
    if (h.type === 'acid') {
      ctx.fillStyle = 'rgba(0, 255, 65, 0.25)';
      ctx.fillRect(h.x, h.y, h.w, h.h);
      for (let i = 0; i < 5; i++) {
        const bx = h.x + (i * (h.w / 5)) + Math.sin(Date.now() / 300 + i) * 4;
        const by = h.y + 8 + Math.cos(Date.now() / 400 + i) * 6;
        const alpha = 0.3 + Math.sin(Date.now() / 200 + i) * 0.2;
        ctx.fillStyle = `rgba(0, 255, 100, ${alpha})`;
        ctx.beginPath();
        ctx.arc(bx, by, 2 + Math.random(), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(h.x, h.y, h.w, h.h);
    } else if (h.type === 'press') {
      const pressY = h.y + Math.sin(Date.now() / (500 / h.speed)) * (h.h / 2);
      ctx.fillStyle = '#555';
      ctx.fillRect(h.x, pressY, h.w, h.h / 2);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(h.x, pressY + h.h / 2 - 4, h.w, 4);
      ctx.fillStyle = '#333';
      for (let tx = 0; tx < h.w; tx += 8) {
        ctx.fillRect(h.x + tx, pressY + h.h / 2 - 4, 4, 8);
      }
    }
  });
}

function drawMovingPlatforms() {
  if (currentLevelTheme !== 'factory') return;
  movingPlatforms.forEach(mp => {
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(mp.x, mp.y, mp.w, mp.h);
    ctx.fillStyle = '#ff4500';
    ctx.fillRect(mp.x, mp.y, mp.w, 3);
    ctx.fillRect(mp.x, mp.y + mp.h - 3, mp.w, 3);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(mp.x + 4, mp.y + 8, mp.w - 8, 2);
  });
}

// ---------- ENEMIGOS ----------
function drawEnemy(e) {
  if (e.dead) return;
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  const r = e.w / 2;
  ctx.save();

  if (e.type === 'big') {
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4a0000';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = e.hornColor;
    ctx.beginPath();
    ctx.moveTo(e.x + 8, e.y + 6); ctx.lineTo(e.x - 2, e.y - 8); ctx.lineTo(e.x + 14, e.y + 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.x + e.w - 8, e.y + 6); ctx.lineTo(e.x + e.w + 2, e.y - 8); ctx.lineTo(e.x + e.w - 14, e.y + 2);
    ctx.fill();
    const eyeOffset = e.vx > 0 ? 5 : -5;
    ctx.fillStyle = e.eyeColor;
    ctx.shadowColor = e.eyeColor;
    ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(cx - 8 + eyeOffset, cy - 2, 5, 0, Math.PI * 2); ctx.arc(cx + 8 + eyeOffset, cy - 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath(); ctx.arc(cx - 8 + eyeOffset + (e.vx > 0 ? 1 : -1), cy - 2, 2.5, 0, Math.PI * 2); ctx.arc(cx + 8 + eyeOffset + (e.vx > 0 ? 1 : -1), cy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 10); ctx.lineTo(cx + 10, cy - 10);
    ctx.stroke();
  } else if (e.type === 'fast') {
    ctx.fillStyle = e.color;
    const dir = e.vx > 0 ? 1 : -1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.1, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#008b8b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - r * dir, cy - 4); ctx.lineTo(cx - r * dir - 8 * dir, cy - 4);
    ctx.moveTo(cx - r * dir, cy + 4); ctx.lineTo(cx - r * dir - 8 * dir, cy + 4);
    ctx.stroke();
    const eyeOffset = e.vx > 0 ? 4 : -4;
    ctx.fillStyle = e.eyeColor;
    ctx.shadowColor = e.eyeColor;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(cx - 5 + eyeOffset, cy - 1, 3.5, 0, Math.PI * 2); ctx.arc(cx + 5 + eyeOffset, cy - 1, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#008b8b';
    ctx.beginPath(); ctx.arc(cx - 5 + eyeOffset + (e.vx > 0 ? 0.8 : -0.8), cy - 1, 1.5, 0, Math.PI * 2); ctx.arc(cx + 5 + eyeOffset + (e.vx > 0 ? 0.8 : -0.8), cy - 1, 1.5, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'fly') {
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    const wingFlap = Math.sin(Date.now() / 100) * 8;
    ctx.fillStyle = 'rgba(255, 105, 180, 0.6)';
    ctx.beginPath();
    ctx.ellipse(cx - r, cy - 4 + wingFlap, 10, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + r, cy - 4 - wingFlap, 10, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = e.hornColor;
    ctx.beginPath();
    ctx.moveTo(e.x + 6, e.y + 4); ctx.lineTo(e.x + 2, e.y - 4); ctx.lineTo(e.x + 10, e.y + 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.x + e.w - 6, e.y + 4); ctx.lineTo(e.x + e.w - 2, e.y - 4); ctx.lineTo(e.x + e.w - 10, e.y + 2);
    ctx.fill();
    const eyeOffset = e.vx > 0 ? 3 : -3;
    ctx.fillStyle = e.eyeColor;
    ctx.shadowColor = e.eyeColor;
    ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(cx - 5 + eyeOffset, cy + 2, 3.5, 0, Math.PI * 2); ctx.arc(cx + 5 + eyeOffset, cy + 2, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  } else if (e.type === 'hunter') {
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.moveTo(cx, e.y);
    ctx.lineTo(e.x + e.w, cy - 2);
    ctx.lineTo(e.x + e.w, cy + 6);
    ctx.lineTo(cx, e.y + e.h);
    ctx.lineTo(e.x, cy + 6);
    ctx.lineTo(e.x, cy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = e.hornColor;
    ctx.beginPath();
    ctx.moveTo(e.x, cy); ctx.lineTo(e.x - 6, cy - 4); ctx.lineTo(e.x, cy + 4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.x + e.w, cy); ctx.lineTo(e.x + e.w + 6, cy - 4); ctx.lineTo(e.x + e.w, cy + 4);
    ctx.fill();
    const eyeOffset = e.vx > 0 ? 3 : -3;
    ctx.fillStyle = e.eyeColor;
    ctx.shadowColor = e.eyeColor;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(cx - 5 + eyeOffset, cy + 2, 3.5, 0, Math.PI * 2); ctx.arc(cx + 5 + eyeOffset, cy + 2, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx - 5 + eyeOffset + (e.vx > 0 ? 0.8 : -0.8), cy + 2, 1.5, 0, Math.PI * 2); ctx.arc(cx + 5 + eyeOffset + (e.vx > 0 ? 0.8 : -0.8), cy + 2, 1.5, 0, Math.PI * 2); ctx.fill();
    const distX = Math.abs(player.x - e.x);
    const sameLevel = Math.abs(player.y - e.y) < 100;
    if (distX < 120 && sameLevel) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, e.y - 6);
      ctx.lineTo(player.x + player.w / 2, player.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  } else if (e.type === 'spark') {
    const sparkIntensity = 0.5 + Math.sin(Date.now() / 50) * 0.5;
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(255, 200, 0, ${sparkIntensity})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 10;
    for (let i = 0; i < 4; i++) {
      const angle = (Date.now() / 100) + (i * Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * (r + 6), cy + Math.sin(angle) * (r + 6));
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    const eyeOffset = e.vx > 0 ? 3 : -3;
    ctx.fillStyle = e.eyeColor;
    ctx.beginPath(); ctx.arc(cx - 4 + eyeOffset, cy, 2.5, 0, Math.PI * 2); ctx.arc(cx + 4 + eyeOffset, cy, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'rusty') {
    ctx.fillStyle = e.color;
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x, e.y, e.w, e.h);
    const shieldDir = e.vx > 0 ? 1 : -1;
    ctx.fillStyle = '#777';
    ctx.fillRect(shieldDir > 0 ? e.x + e.w - 4 : e.x, e.y + 4, 4, e.h - 8);
    ctx.fillStyle = '#ff4500';
    ctx.fillRect(shieldDir > 0 ? e.x + e.w - 4 : e.x, e.y + 8, 4, 4);
    const eyeOffset = e.vx > 0 ? 4 : -4;
    ctx.fillStyle = e.eyeColor;
    ctx.shadowColor = e.eyeColor;
    ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(cx - 6 + eyeOffset, cy - 4, 3, 0, Math.PI * 2); ctx.arc(cx + 6 + eyeOffset, cy - 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, e.y); ctx.lineTo(cx, e.y - 8);
    ctx.stroke();
    ctx.fillStyle = '#ff0000';
    ctx.beginPath(); ctx.arc(cx, e.y - 8, 2, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'welder') {
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    const thrust = Math.sin(Date.now() / 80) * 4;
    ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
    ctx.beginPath();
    ctx.ellipse(cx, e.y + e.h + 4 + thrust, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    const eyeOffset = e.vx > 0 ? 3 : -3;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 8 + eyeOffset, cy - 4, 16, 6);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(cx - 6 + eyeOffset, cy - 2, 12, 2);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + (e.vx > 0 ? r : -r), cy);
    ctx.lineTo(cx + (e.vx > 0 ? r + 8 : -r - 8), cy + 6);
    ctx.stroke();
    ctx.fillStyle = '#ff4500';
    ctx.beginPath(); ctx.arc(cx + (e.vx > 0 ? r + 8 : -r - 8), cy + 6, 3, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = e.hornColor;
    ctx.beginPath();
    ctx.moveTo(e.x + 6, e.y + 4); ctx.lineTo(e.x + 2, e.y - 2); ctx.lineTo(e.x + 10, e.y + 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.x + e.w - 6, e.y + 4); ctx.lineTo(e.x + e.w - 2, e.y - 2); ctx.lineTo(e.x + e.w - 10, e.y + 2);
    ctx.fill();
    const eyeOffset = e.vx > 0 ? 4 : -4;
    ctx.fillStyle = e.eyeColor;
    ctx.shadowColor = e.eyeColor;
    ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(cx - 6 + eyeOffset, cy + 2, 4, 0, Math.PI * 2); ctx.arc(cx + 6 + eyeOffset, cy + 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath(); ctx.arc(cx - 6 + eyeOffset + (e.vx > 0 ? 1 : -1), cy + 2, 2, 0, Math.PI * 2); ctx.arc(cx + 6 + eyeOffset + (e.vx > 0 ? 1 : -1), cy + 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4a0000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(e.x + 4, e.y + 4); ctx.lineTo(e.x + 12, e.y + 6); ctx.moveTo(e.x + e.w - 4, e.y + 4); ctx.lineTo(e.x + e.w - 12, e.y + 6); ctx.stroke();
  }

  if (e.type === 'welder' && e.projectiles) {
    e.projectiles.forEach(proj => {
      ctx.fillStyle = '#ff4500';
      ctx.shadowColor = '#ff4500';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  ctx.restore();
}

// ---------- MONEDAS ----------
function drawCoins() {
  coins.forEach(c => {
    if (c.collected) return;
    c.bob += 0.08;
    const bobY = Math.sin(c.bob) * 4;
    if (c.type === 'prispas') {
      const prispas = spriteLoader.get('prispas');
      if (prispas) ctx.drawImage(prispas.image, c.x - 1, c.y + 2 + bobY, 18, 28);
    } else {
      const item = spriteLoader.get('item');
      if (item) {
        const pulse = 1 + Math.sin(c.bob * 0.7) * 0.12;
        const size = 18 * pulse;
        const offset = (18 - size) / 2;
        ctx.save();
        ctx.shadowColor = currentLevelTheme === 'factory' ? '#ff4500' : '#00ffff';
        ctx.shadowBlur = 8 + Math.sin(c.bob) * 4;
        ctx.drawImage(item.image, c.x + offset, c.y + offset + bobY, size, size);
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }
  });
}

// ---------- PREVIEWS ----------
function drawTomyPreview() {
  const preview = document.getElementById('character-preview');
  const spriteData = spriteLoader.get('ready');
  if (!preview || !spriteData) return;
  const previewCtx = preview.getContext('2d');
  const col = menuPreviewFrame % spriteData.cols;
  const row = Math.floor(menuPreviewFrame / spriteData.cols);
  const dw = 80, dh = 153;
  previewCtx.clearRect(0, 0, preview.width, preview.height);
  previewCtx.imageSmoothingEnabled = true;
  previewCtx.drawImage(
    spriteData.image,
    col * spriteData.frameWidth, row * spriteData.frameHeight,
    spriteData.frameWidth, spriteData.frameHeight,
    (preview.width - dw) / 2, 0, dw, dh,
  );
}

function drawAranaPreview() {
  const preview = document.getElementById('arana-preview');
  const spriteData = spriteLoader.get('arana-ready');
  if (!preview || !spriteData) return;
  const previewCtx = preview.getContext('2d');
  const col = aranaPreviewFrame % spriteData.cols;
  const row = Math.floor(aranaPreviewFrame / spriteData.cols);
  const dw = 80, dh = 153;
  previewCtx.clearRect(0, 0, preview.width, preview.height);
  previewCtx.imageSmoothingEnabled = true;
  previewCtx.drawImage(
    spriteData.image,
    col * spriteData.frameWidth, row * spriteData.frameHeight,
    spriteData.frameWidth, spriteData.frameHeight,
    (preview.width - dw) / 2, 0, dw, dh,
  );
}

function drawWinCharacter() {
  const preview = document.getElementById('win-character-preview');
  const animName = selectedCharacter === 'tomy' ? 'celebrate' : 'arana-celebrate';
  const spriteData = spriteLoader.get(animName);
  if (!preview || !spriteData) return;
  const ctxWin = preview.getContext('2d');
  const canvasWin = preview;
  const col = winPreviewFrame % spriteData.cols;
  const row = Math.floor(winPreviewFrame / spriteData.cols);
  const fw = spriteData.frameWidth;
  const fh = spriteData.frameHeight;
  const aspectRatio = fw / fh;
  ctxWin.clearRect(0, 0, canvasWin.width, canvasWin.height);
  let renderWidth = canvasWin.width * 0.8;
  let renderHeight = renderWidth / aspectRatio;
  if (renderHeight > canvasWin.height * 0.9) {
    renderHeight = canvasWin.height * 0.9;
    renderWidth = renderHeight * aspectRatio;
  }
  const renderX = (canvasWin.width - renderWidth) / 2;
  const renderY = (canvasWin.height - renderHeight) / 2;
  ctxWin.imageSmoothingEnabled = false;
  ctxWin.drawImage(
    spriteData.image,
    col * fw, row * fh,
    fw, fh,
    renderX, renderY, renderWidth, renderHeight
  );
  ctxWin.imageSmoothingEnabled = true;
}

// ---------- DIBUJO PRINCIPAL ----------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentLevelTheme === 'factory') {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0a0a0a');
    grad.addColorStop(0.5, '#151515');
    grad.addColorStop(1, '#1f1f1f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawFactoryBackground();
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0d0221');
    grad.addColorStop(0.4, '#1a0a2e');
    grad.addColorStop(0.7, '#2d1b4e');
    grad.addColorStop(1, '#4a1a6b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawStars();
    drawNebula();
  }

  ctx.save();
  ctx.translate(-Math.floor(cameraX), 0);

  const startCol = Math.floor(cameraX / TILE);
  const endCol = startCol + Math.ceil(canvas.width / TILE) + 1;

  for (let y = 0; y < LEVEL_HEIGHT; y++) {
    for (let x = startCol; x <= endCol && x < LEVEL_WIDTH; x++) {
      const tile = levelMap[y][x];
      const px = x * TILE, py = y * TILE;
      if (tile >= 1 && tile <= 4) {
        drawTile(tile, px, py);
      }
    }
  }

  const finalCenterX = (LEVEL_WIDTH - 5) * TILE + TILE;
  const finalBaseY = GROUND_Y;
  drawFinalStructure(ctx, finalCenterX, finalBaseY);

  drawHazards();
  drawMovingPlatforms();
  drawCoins();
  enemies.forEach(e => drawEnemy(e));

  particles.forEach(p => {
    ctx.globalAlpha = p.life / 50;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1;

  if (player.invincible <= 0 || Math.floor(player.invincible / 4) % 2 === 0) {
    animator.draw(ctx, player.x, player.y, player.facing, player.w, player.h);
  }

  ctx.restore();
}

function drawMenu() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0d0221');
  grad.addColorStop(0.5, '#1a0a2e');
  grad.addColorStop(1, '#2d1b4e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawStars();
  drawNebula();
}