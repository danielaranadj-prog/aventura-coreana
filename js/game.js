// ============================================================
// GAME.JS — Orquestador principal
// ============================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const GROUND_Y = (LEVEL_HEIGHT - 2) * TILE;

// ---------- ESTADO GLOBAL ----------
let gameState = 'loading';
let score = 0;
let lives = 3;
let timeLeft = 300;
let cameraX = 0;
let timerInterval = null;
let animationFrameId = null;
let selectedCharacter = 'tomy';
let prispasCollected = 0;
let allCoinsBonusGiven = false;
let menuPreviewFrame = 0;
let menuPreviewTimer = 0;
let aranaPreviewFrame = 0;
let winPreviewFrame = 0;
let winPreviewTimer = 0;
let currentLevelId = 1;

// ---------- JUGADOR ----------
const player = {
  x: 64,
  y: GROUND_Y - 48,
  w: 28,
  h: 48,
  vx: 0,
  vy: 0,
  onGround: true,
  facing: 1,
  invincible: 0,
  celebrating: false,
  celebrateTimer: 0,
  onMovingPlatform: null,
};

// Variable para tracking de posición segura[cite: 1]
let lastPosition = { x: 64, y: GROUND_Y - 48 };

// ---------- HELPERS DE FÍSICA ----------
function getTile(x, y) {
  const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
  if (ty < 0 || ty >= LEVEL_HEIGHT || tx < 0 || tx >= LEVEL_WIDTH) return 0;
  return levelMap[ty][tx];
}
function isSolid(tile) { return tile === 1 || tile === 2 || tile === 3 || tile === 4; }
function rectIntersect(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

// ---------- SELECTOR DE PERSONAJE ----------
function selectCharacter(name) {
  selectedCharacter = name;
  document.querySelectorAll('.character-card').forEach(card => {
    card.classList.remove('selected');
    card.setAttribute('aria-pressed', 'false');
  });
  const card = document.getElementById('character-' + name);
  if (card) {
    card.classList.add('selected');
    card.setAttribute('aria-pressed', 'true');
  }
}

// ---------- PREVIEWS ----------
function updateMenuPreview() {
  if (gameState !== 'menu') return;
  menuPreviewTimer++;
  if (menuPreviewTimer >= 6) {
    menuPreviewTimer = 0;
    const tomyData = spriteLoader.get('ready');
    const aranaData = spriteLoader.get('arana-ready');
    if (tomyData) menuPreviewFrame = (menuPreviewFrame + 1) % tomyData.frames;
    if (aranaData) aranaPreviewFrame = (aranaPreviewFrame + 1) % aranaData.frames;
    drawTomyPreview();
    drawAranaPreview();
  }
  requestAnimationFrame(updateMenuPreview);
}

function updateWinPreview() {
  if (gameState !== 'win') return;
  winPreviewTimer++;
  if (winPreviewTimer >= 5) {
    winPreviewTimer = 0;
    const animName = selectedCharacter === 'tomy' ? 'celebrate' : 'arana-celebrate';
    const celData = spriteLoader.get(animName);
    if (celData) {
      winPreviewFrame = (winPreviewFrame + 1) % celData.frames;
      drawWinCharacter();
    }
  }
  updateFireworks();
  if (winPreviewTimer === 0 && Math.random() < 0.15) spawnFirework();
  drawFireworks(ctx);
  requestAnimationFrame(updateWinPreview);
}

// ---------- FÍSICA DEL JUGADOR ----------
function updatePlayer() {
  if (player.celebrating) {
    player.celebrateTimer--;
    if (player.celebrateTimer <= 0) player.celebrating = false;
    animator.setAnimation('run');
    animator.update();
    return;
  }

  const isRunning = isKeyDown('ShiftLeft') || isKeyDown('ShiftRight') || isKeyDown('KeyX');
  const maxSpeed = isRunning ? RUN_SPEED : SPEED;
  const accel = isRunning ? 1.8 : 0.8;
  const jumpForce = isRunning ? JUMP_FORCE * 1.15 : JUMP_FORCE;

  if (isKeyDown('ArrowLeft') || isKeyDown('KeyA')) { player.vx -= accel; player.facing = -1; }
  if (isKeyDown('ArrowRight') || isKeyDown('KeyD')) { player.vx += accel; player.facing = 1; }
  player.vx *= FRICTION;
  player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));

  if ((isKeyDown('ArrowUp') || isKeyDown('KeyW') || isKeyDown('Space')) && player.onGround) {
    player.vy = jumpForce;
    player.onGround = false;
    player.onMovingPlatform = null;
    spawnParticles(player.x + player.w / 2, player.y + player.h, '#ffd700', 5);
    audioManager.play('jump');
  }
  player.vy += GRAVITY;

  if (currentLevelTheme === 'factory' && player.onMovingPlatform) {
    player.x += player.onMovingPlatform.vx;
  }

  player.x += player.vx;
  if (player.x < 0) { player.x = 0; player.vx = 0; }
  if (player.x > LEVEL_WIDTH * TILE - player.w) { player.x = LEVEL_WIDTH * TILE - player.w; }

  // --- Colisión horizontal ---
  const left = Math.floor(player.x / TILE);
  const right = Math.floor((player.x + player.w - 1) / TILE);
  const top = Math.floor(player.y / TILE);
  const bottom = Math.floor((player.y + player.h - 1) / TILE);
  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (ty < 0 || ty >= LEVEL_HEIGHT || tx < 0 || tx >= LEVEL_WIDTH) continue;
      if (isSolid(levelMap[ty][tx])) {
        if (player.vx > 0) { player.x = tx * TILE - player.w - 0.1; player.vx = 0; }
        else if (player.vx < 0) { player.x = (tx + 1) * TILE + 0.1; player.vx = 0; }
      }
    }
  }

  // --- Colisión vertical ---
  player.y += player.vy;
  player.onGround = false;
  const left2 = Math.floor(player.x / TILE);
  const right2 = Math.floor((player.x + player.w - 1) / TILE);
  const top2 = Math.floor(player.y / TILE);
  const bottom2 = Math.floor((player.y + player.h - 1) / TILE);
  for (let ty = top2; ty <= bottom2; ty++) {
    for (let tx = left2; tx <= right2; tx++) {
      if (ty < 0 || ty >= LEVEL_HEIGHT || tx < 0 || tx >= LEVEL_WIDTH) continue;
      const tile = levelMap[ty][tx];
      if (isSolid(tile)) {
        if (player.vy > 0) {
          player.y = ty * TILE - player.h - 0.1; player.vy = 0; player.onGround = true;
          
          // Actualizar posición segura[cite: 1]
          lastPosition.x = player.x;
          lastPosition.y = player.y;

          if (currentLevelTheme === 'factory') {
            player.onMovingPlatform = null;
            movingPlatforms.forEach(mp => {
              if (player.x + player.w > mp.x && player.x < mp.x + mp.w &&
                  Math.abs(player.y + player.h - mp.y) < 5) {
                player.onMovingPlatform = mp;
              }
            });
          }
        } else if (player.vy < 0) {
          player.y = (ty + 1) * TILE + 0.1; player.vy = 0;
          if (tile === 3) { levelMap[ty][tx] = 0; score += 100; spawnParticles(tx * TILE + 16, ty * TILE + 16, '#ffd700', 10); updateUI(); }
        }
      }
      if (tile === 5) winGame();
    }
  }

  if (player.y < -80) { player.y = -80; player.vy = 0; }

  if (currentLevelTheme === 'factory') {
    movingPlatforms.forEach(mp => {
      if (rectIntersect(player, mp)) {
        if (player.vy > 0 && player.y + player.h < mp.y + mp.h / 2) {
          player.y = mp.y - player.h - 0.1;
          player.vy = 0;
          player.onGround = true;
          player.onMovingPlatform = mp;
          // Actualizar posición segura en plataforma[cite: 1]
          lastPosition.x = player.x;
          lastPosition.y = player.y;
        }
      }
    });
  }

  if (currentLevelTheme === 'factory') {
    for (let i = 0; i < hazardZones.length; i++) {
      const h = hazardZones[i];
      if (h.type === 'acid') {
        if (player.x + player.w > h.x && player.x < h.x + h.w &&
            player.y + player.h > h.y && player.y < h.y + h.h) {
          if (player.invincible <= 0) { playerDie(true); return; }
        }
      } else if (h.type === 'press') {
        const pressY = h.y + Math.sin(Date.now() / (500 / h.speed)) * (h.h / 2);
        const pressRect = { x: h.x, y: pressY, w: h.w, h: h.h / 2 };
        if (rectIntersect(player, pressRect) && player.invincible <= 0) { playerDie(); return; }
      }
    }
  }

  if (player.y > LEVEL_HEIGHT * TILE + 20) {
    if (player.invincible <= 0) playerDie(true);
    else { player.x = lastPosition.x; player.y = lastPosition.y; player.vy = 0; player.vx = 0; player.onGround = true; }
    return;
  }

  if (player.invincible > 0) player.invincible--;
}

// ---------- OTRAS FUNCIONES (Animations, Enemies, Platforms, Coins, Camera) ----------
// [Se mantiene la lógica original de estas funciones intacta para brevedad]
function updateAnimations() {
  const hasInput = isKeyDown('ArrowLeft') || isKeyDown('KeyA') || isKeyDown('ArrowRight') || isKeyDown('KeyD');
  const isMoving = Math.abs(player.vx) > 0.1;
  if (player.onGround && !hasInput && !isMoving) { player.vx = 0; animator.setStaticFrame('run', 6); }
  else { animator.setAnimation('run', 6); animator.update(); }
}

function updateEnemies() {
  enemies.forEach(e => {
    if (e.dead) return;
    if (e.type === 'fly') { e.flyPhase += 0.05; e.y = e.baseY + Math.sin(e.flyPhase) * 40; e.x += e.vx; }
    else if (e.type === 'hunter') {
      const distX = Math.abs(player.x - e.x);
      const sameLevel = Math.abs(player.y - e.y) < 100;
      if (distX < 120 && sameLevel) { const dir = player.x > e.x ? 1 : -1; e.vx = dir * e.huntSpeed; }
      else if (Math.abs(e.vx) > Math.abs(e.originalVx)) e.vx = e.originalVx;
      e.x += e.vx;
    } else if (e.type === 'spark') {
      e.x += e.vx;
      if (e.x <= 0 || e.x + e.w >= LEVEL_WIDTH * TILE) { e.vx *= -1; e.x = Math.max(0, Math.min(e.x, LEVEL_WIDTH * TILE - e.w)); }
      const frontX = e.x + (e.vx > 0 ? e.w : 0);
      if (isSolid(getTile(frontX, e.y + e.h / 2))) e.vx *= -1;
    } else if (e.type === 'welder') {
      e.flyPhase += 0.04; e.y = e.baseY + Math.sin(e.flyPhase) * 30; e.x += e.vx; e.shootTimer--;
      if (e.shootTimer <= 0) { e.shootTimer = 90 + Math.random() * 60; const dir = e.vx > 0 ? 1 : -1; e.projectiles.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: dir * 3, vy: 0.5, life: 60 }); }
      for (let i = e.projectiles.length - 1; i >= 0; i--) {
        const proj = e.projectiles[i]; proj.x += proj.vx; proj.y += proj.vy; proj.life--;
        if (proj.life <= 0) { e.projectiles.splice(i, 1); continue; }
        if (rectIntersect(player, { x: proj.x - 4, y: proj.y - 4, w: 8, h: 8 }) && player.invincible <= 0) { playerDie(); e.projectiles.splice(i, 1); }
      }
    } else e.x += e.vx;
    if (e.x <= 0 || e.x + e.w >= LEVEL_WIDTH * TILE) { e.vx *= -1; e.x = Math.max(0, Math.min(e.x, LEVEL_WIDTH * TILE - e.w)); if (e.type === 'hunter') e.originalVx = e.vx; return; }
    if (e.type !== 'fly' && e.type !== 'welder') {
      const frontX = e.x + (e.vx > 0 ? e.w : 0);
      const groundAhead = getTile(frontX, e.y + e.h + 4);
      const wallAhead = getTile(frontX, e.y + e.h / 2);
      if ((!isSolid(groundAhead) && e.type !== 'fly') || isSolid(wallAhead)) { e.vx *= -1; if (e.type === 'hunter') e.originalVx = e.vx; }
    }
    if (rectIntersect(player, e) && player.invincible <= 0) {
      const stompFromAbove = player.vy > 0 && player.y + player.h < e.y + e.h / 2 + 8;
      if (e.type === 'rusty' && e.frontShield) { const playerFromFront = (e.vx > 0 && player.x > e.x) || (e.vx < 0 && player.x < e.x); if (playerFromFront && !stompFromAbove) { playerDie(); return; } }
      if (stompFromAbove && e.canStomp) { e.dead = true; player.vy = JUMP_FORCE * 0.7; score += 200; spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#ff0040', 12); updateUI(); audioManager.play('stomp'); }
      else playerDie();
    }
  });
}

function updateMovingPlatforms() {
  if (currentLevelTheme !== 'factory') return;
  movingPlatforms.forEach(mp => {
    mp.x += mp.vx;
    if (mp.x <= mp.minX || mp.x + mp.w >= mp.maxX) { mp.vx *= -1; mp.x = Math.max(mp.minX, Math.min(mp.x, mp.maxX - mp.w)); }
  });
}

function updateCoins() {
  coins.forEach(c => {
    if (c.collected) return;
    c.bob += 0.08;
    const bobY = Math.sin(c.bob) * 4;
    const coinRect = { x: c.x, y: c.y + bobY, w: c.w, h: c.h };
    if (rectIntersect(player, coinRect)) {
      c.collected = true; score += 50; spawnParticles(c.x + 8, c.y + 8, '#ffd700', 6);
      if (c.type === 'prispas') { prispasCollected++; if (prispasCollected >= 3) { prispasCollected = 0; lives++; audioManager.playOneUp(); spawnParticles(c.x + 8, c.y + 8, '#00ff88', 20); } }
      const allCollected = coins.every(coin => coin.collected);
      if (allCollected && !allCoinsBonusGiven) { allCoinsBonusGiven = true; lives++; audioManager.playOneUp(); spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#00ff88', 30); }
      updateUI();
    }
  });
}

function updateCamera() {
  const targetX = player.x - canvas.width / 3;
  cameraX += (targetX - cameraX) * 0.1;
  cameraX = Math.max(0, Math.min(cameraX, LEVEL_WIDTH * TILE - canvas.width));
}

// ---------- MUERTE ----------
function playerDie(fellInGap = false) {
  if (player.invincible > 0) return;
  lives--; updateUI();
  spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ff0040', 20);
  audioManager.play('death');
  if (lives <= 0) { gameOver(); return; }
  
  player.invincible = 180;
  player.vy = JUMP_FORCE;
  player.celebrating = false;
  player.celebrateTimer = 0;
  player.onMovingPlatform = null;

  // Reaparición en posición segura[cite: 1]
  player.x = lastPosition.x;
  player.y = fellInGap ? Math.min(lastPosition.y, GROUND_Y - player.h - 20) : lastPosition.y;
  player.vy = 0;
  player.vx = 0;
}

// ---------- UI Y RESTO ----------
function updateUI() {
  document.getElementById('score').textContent = score;
  document.getElementById('lives').textContent = lives;
  document.getElementById('time').textContent = timeLeft;
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameState === 'playing') { timeLeft--; updateUI(); if (timeLeft <= 0) gameOver(); }
  }, 1000);
}

function beginGame() {
  audioManager.init(); audioManager.resumeContext();
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('win-screen').classList.add('hidden');
  document.getElementById('menu-button').classList.remove('hidden');
  document.getElementById('mobile-controls').classList.remove('hidden');
  document.getElementById('mobile-controls').style.display = 'flex';
  document.getElementById('game-wrapper').classList.add('mobile-mode');

  score = 0; lives = 3; timeLeft = 300; cameraX = 0;
  prispasCollected = 0; allCoinsBonusGiven = false;
  player.x = 64; player.y = GROUND_Y - player.h;
  // Resetear checkpoint al iniciar[cite: 1]
  lastPosition = { x: 64, y: GROUND_Y - player.h };
  
  player.vx = 0; player.vy = 0; player.invincible = 0;
  player.onGround = true; player.celebrating = false; player.celebrateTimer = 0; player.onMovingPlatform = null;
  if (animator) animator.setStaticFrame('run', 6);

  if (currentLevelId === 2) levelMap = generateFactoryLevel();
  else levelMap = generateLevel();
  enemies = createEnemies(currentLevelTheme);
  coins = createCoins(currentLevelTheme);
  particles = []; fireworks = [];

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  gameState = 'playing'; updateUI(); startTimer();
  animationFrameId = requestAnimationFrame(gameLoop);
  audioManager.stopAll(); audioManager.playMusic('gameAdventure');
}

function gameLoop() {
  animationFrameId = requestAnimationFrame(gameLoop);
  if (gameState !== 'playing') return;
  updatePlayer(); updateAnimations(); updateEnemies(); updateMovingPlatforms(); updateCoins(); updateParticles(); updateCamera(); draw();
}

spriteLoader.onComplete = () => {
  animator = new Animator(spriteLoader);
  drawMenu(); drawTomyPreview(); drawAranaPreview(); requestAnimationFrame(updateMenuPreview);
};
spriteLoader.load();