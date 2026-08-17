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

  // Plataformas móviles (fábrica)
  if (currentLevelTheme === 'factory' && player.onMovingPlatform) {
    player.x += player.onMovingPlatform.vx;
  }

  player.x += player.vx;
  if (player.x < 0) { player.x = 0; player.vx = 0; }
  if (player.x > LEVEL_WIDTH * TILE - player.w) { player.x = LEVEL_WIDTH * TILE - player.w; }

  // Colisión horizontal
  const left = Math.floor(player.x / TILE), right = Math.floor((player.x + player.w - 1) / TILE);
  const top = Math.floor(player.y / TILE), bottom = Math.floor((player.y + player.h - 1) / TILE);
  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (isSolid(levelMap[ty][tx])) {
        if (player.vx > 0) { player.x = tx * TILE - player.w - 0.1; player.vx = 0; }
        else if (player.vx < 0) { player.x = (tx + 1) * TILE + 0.1; player.vx = 0; }
      }
    }
  }

  // Colisión vertical
  player.y += player.vy; player.onGround = false;
  const left2 = Math.floor(player.x / TILE), right2 = Math.floor((player.x + player.w - 1) / TILE);
  const top2 = Math.floor(player.y / TILE), bottom2 = Math.floor((player.y + player.h - 1) / TILE);
  for (let ty = top2; ty <= bottom2; ty++) {
    for (let tx = left2; tx <= right2; tx++) {
      const tile = levelMap[ty][tx];
      if (isSolid(tile)) {
        if (player.vy > 0) {
          player.y = ty * TILE - player.h - 0.1; player.vy = 0; player.onGround = true;
          // Verificar si aterrizó en plataforma móvil
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

  // Colisión con plataformas móviles (por abajo o lateral)
  if (currentLevelTheme === 'factory') {
    movingPlatforms.forEach(mp => {
      if (rectIntersect(player, mp)) {
        if (player.vy > 0 && player.y + player.h < mp.y + mp.h / 2) {
          player.y = mp.y - player.h - 0.1;
          player.vy = 0;
          player.onGround = true;
          player.onMovingPlatform = mp;
        }
      }
    });
  }

  // Peligros (fábrica)
  if (currentLevelTheme === 'factory') {
    hazardZones.forEach(h => {
      if (h.type === 'acid') {
        if (player.x + player.w > h.x && player.x < h.x + h.w &&
            player.y + player.h > h.y && player.y < h.y + h.h) {
          if (player.invincible <= 0) playerDie(true);
        }
      } else if (h.type === 'press') {
        const pressY = h.y + Math.sin(Date.now() / (500 / h.speed)) * (h.h / 2);
        const pressRect = { x: h.x, y: pressY, w: h.w, h: h.h / 2 };
        if (rectIntersect(player, pressRect) && player.invincible <= 0) {
          playerDie();
        }
      }
    });
  }

  // Caída al vacío
  const tileBelowLeft = getTile(player.x + 4, player.y + player.h + 2);
  const tileBelowRight = getTile(player.x + player.w - 4, player.y + player.h + 2);
  const isOverGap = (tileBelowLeft === 0 && tileBelowRight === 0 && player.y >= GROUND_Y - 10);

  if (player.y > LEVEL_HEIGHT * TILE + 20 || (isOverGap && currentLevelTheme !== 'factory')) {
    if (player.invincible <= 0) {
      playerDie(true);
    } else {
      player.x = 64;
      player.y = GROUND_Y - player.h + 2;
      player.vy = 0;
      player.vx = 0;
      player.onGround = true;
    }
    return;
  }

  if (player.invincible > 0) player.invincible--;
}

function updateAnimations() {
  const hasInput = isKeyDown('ArrowLeft') || isKeyDown('KeyA') ||
                   isKeyDown('ArrowRight') || isKeyDown('KeyD');
  const isMoving = Math.abs(player.vx) > 0.1;
  if (player.onGround && !hasInput && !isMoving) {
    player.vx = 0;
    animator.setStaticFrame('run', 6);
  } else {
    animator.setAnimation('run', 6);
    animator.update();
  }
}

// ---------- ENEMIGOS ----------
function updateEnemies() {
  enemies.forEach(e => {
    if (e.dead) return;

    if (e.type === 'fly') {
      e.flyPhase += 0.05;
      e.y = e.baseY + Math.sin(e.flyPhase) * 40;
      e.x += e.vx;
    } else if (e.type === 'hunter') {
      const distX = Math.abs(player.x - e.x);
      const sameLevel = Math.abs(player.y - e.y) < 100;
      if (distX < 120 && sameLevel) {
        const dir = player.x > e.x ? 1 : -1;
        e.vx = dir * e.huntSpeed;
      } else {
        if (Math.abs(e.vx) > Math.abs(e.originalVx)) e.vx = e.originalVx;
      }
      e.x += e.vx;
    } else if (e.type === 'spark') {
      // Rebote en paredes
      e.x += e.vx;
      if (e.x <= 0 || e.x + e.w >= LEVEL_WIDTH * TILE) {
        e.vx *= -1;
        e.x = Math.max(0, Math.min(e.x, LEVEL_WIDTH * TILE - e.w));
      }
      const frontX = e.x + (e.vx > 0 ? e.w : 0);
      if (isSolid(getTile(frontX, e.y + e.h / 2))) {
        e.vx *= -1;
      }
    } else if (e.type === 'welder') {
      // Dron: vuela en onda + dispara
      e.flyPhase += 0.04;
      e.y = e.baseY + Math.sin(e.flyPhase) * 30;
      e.x += e.vx;
      e.shootTimer--;
      if (e.shootTimer <= 0) {
        e.shootTimer = 90 + Math.random() * 60;
        const dir = e.vx > 0 ? 1 : -1;
        e.projectiles.push({
          x: e.x + e.w / 2, y: e.y + e.h / 2,
          vx: dir * 3, vy: 0.5,
          life: 60,
        });
      }
      // Actualizar proyectiles
      for (let i = e.projectiles.length - 1; i >= 0; i--) {
        const proj = e.projectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.life--;
        if (proj.life <= 0) { e.projectiles.splice(i, 1); continue; }
        if (rectIntersect(player, { x: proj.x - 4, y: proj.y - 4, w: 8, h: 8 }) && player.invincible <= 0) {
          playerDie();
          e.projectiles.splice(i, 1);
        }
      }
    } else {
      e.x += e.vx;
    }

    // Rebote bordes nivel
    if (e.x <= 0 || e.x + e.w >= LEVEL_WIDTH * TILE) {
      e.vx *= -1;
      e.x = Math.max(0, Math.min(e.x, LEVEL_WIDTH * TILE - e.w));
      if (e.type === 'hunter') e.originalVx = e.vx;
      return;
    }

    // Lógica suelo/pared
    if (e.type !== 'fly' && e.type !== 'welder') {
      if (e.onPlatform) {
        const frontX = e.x + (e.vx > 0 ? e.w : 0);
        const groundBelow = getTile(frontX, e.y + e.h + 4);
        const wallAhead = getTile(frontX, e.y + e.h / 2);
        if (!isSolid(groundBelow) || isSolid(wallAhead)) {
          e.vx *= -1;
        }
      } else {
        const frontX = e.x + (e.vx > 0 ? e.w : 0);
        const groundAhead = getTile(frontX, e.y + e.h + 4);
        const wallAhead = getTile(frontX, e.y + e.h / 2);
        if ((!isSolid(groundAhead) && e.type !== 'fly') || isSolid(wallAhead)) {
          e.vx *= -1;
          if (e.type === 'hunter') e.originalVx = e.vx;
        }
      }
    }

    // Colisión con jugador
    if (rectIntersect(player, e) && player.invincible <= 0) {
      const stompFromAbove = player.vy > 0 && player.y + player.h < e.y + e.h / 2 + 8;

      // Soldado Oxidado: invulnerable por el frente
      if (e.type === 'rusty' && e.frontShield) {
        const playerFromFront = (e.vx > 0 && player.x > e.x) || (e.vx < 0 && player.x < e.x);
        if (playerFromFront && !stompFromAbove) {
          playerDie();
          return;
        }
      }

      if (stompFromAbove && e.canStomp) {
        e.dead = true;
        player.vy = JUMP_FORCE * 0.7;
        score += 200;
        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#ff0040', 12);
        updateUI();
        audioManager.play('stomp');
      } else {
        playerDie();
      }
    }

    // Proyectiles del welder (ya manejados arriba, pero dibujarlos)
    if (e.type === 'welder' && e.projectiles) {
      e.projectiles.forEach(proj => {
        ctx.fillStyle = '#ff4500';
        ctx.shadowColor = '#ff4500';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(proj.x - cameraX, proj.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }
  });
}

// ---------- PLATAFORMAS MÓVILES ----------
function updateMovingPlatforms() {
  if (currentLevelTheme !== 'factory') return;
  movingPlatforms.forEach(mp => {
    mp.x += mp.vx;
    if (mp.x <= mp.minX || mp.x + mp.w >= mp.maxX) {
      mp.vx *= -1;
      mp.x = Math.max(mp.minX, Math.min(mp.x, mp.maxX - mp.w));
    }
  });
}

// ---------- MONEDAS ----------
function updateCoins() {
  coins.forEach(c => {
    if (c.collected) return;
    c.bob += 0.08;
    const bobY = Math.sin(c.bob) * 4;
    const coinRect = { x: c.x, y: c.y + bobY, w: c.w, h: c.h };
    if (rectIntersect(player, coinRect)) {
      c.collected = true;
      score += 50;
      spawnParticles(c.x + 8, c.y + 8, '#ffd700', 6);
      if (c.type === 'prispas') {
        prispasCollected++;
        if (prispasCollected >= 3) {
          prispasCollected = 0;
          lives++;
          audioManager.playOneUp();
          spawnParticles(c.x + 8, c.y + 8, '#00ff88', 20);
        }
      }
      const allCollected = coins.every(coin => coin.collected);
      if (allCollected && !allCoinsBonusGiven) {
        allCoinsBonusGiven = true;
        lives++;
        audioManager.playOneUp();
        spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#00ff88', 30);
      }
      updateUI();
    }
  });
}

// ---------- CÁMARA ----------
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
  if (lives <= 0) gameOver();
  else {
    player.invincible = 300;
    player.vy = JUMP_FORCE;
    player.x = Math.max(64, player.x - 200);
    if (fellInGap) {
      player.y = GROUND_Y - player.h + 2;
      player.vy = 0;
    } else {
      player.y = 200;
    }
  }
}

// ---------- UI ----------
function updateUI() {
  document.getElementById('score').textContent = score;
  document.getElementById('lives').textContent = lives;
  document.getElementById('time').textContent = timeLeft;
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameState === 'playing') {
      timeLeft--;
      updateUI();
      if (timeLeft <= 0) gameOver();
    }
  }, 1000);
}

// ---------- INICIO / REINICIO ----------
function startGame() {
  audioManager.init();
  audioManager.resumeContext();
  audioManager.play('gameStart');
  document.getElementById('start-screen').classList.add('hidden');
  const levelLoading = document.getElementById('level-loading');
  const levelFill = document.getElementById('level-loading-fill');
  const levelTitle = levelLoading.querySelector('.level-loading-title');
  if (levelTitle) levelTitle.textContent = currentLevelId === 2 ? 'LEVEL 2' : 'LEVEL 1';
  levelLoading.classList.remove('hidden');

  let progress = 0;
  const duration = 2000;
  const intervalTime = 40;
  const increment = 100 / (duration / intervalTime);

  const loadInterval = setInterval(() => {
    progress += increment;
    if (progress >= 100) {
      progress = 100;
      levelFill.style.width = '100%';
      clearInterval(loadInterval);
      setTimeout(() => {
        levelLoading.classList.add('hidden');
        levelFill.style.width = '0%';
        beginGame();
      }, 150);
    } else {
      levelFill.style.width = progress + '%';
    }
  }, intervalTime);
}

function beginGame() {
  audioManager.init();
  audioManager.resumeContext();
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('win-screen').classList.add('hidden');
  document.getElementById('menu-button').classList.remove('hidden');
  const mc = document.getElementById('mobile-controls');
  mc.classList.remove('hidden');
  mc.style.display = 'flex';
  document.getElementById('game-wrapper').classList.add('mobile-mode');

  score = 0; lives = 3; timeLeft = 300; cameraX = 0;
  prispasCollected = 0; allCoinsBonusGiven = false;
  player.x = 64; player.y = GROUND_Y - player.h;
  player.vx = 0; player.vy = 0; player.invincible = 0;
  player.onGround = true;
  player.celebrating = false; player.celebrateTimer = 0;
  player.onMovingPlatform = null;
  if (animator) animator.setStaticFrame('run', 6);

  if (currentLevelId === 2) {
    levelMap = generateFactoryLevel();
  } else {
    levelMap = generateLevel();
  }
  enemies = createEnemies(currentLevelTheme);
  coins = createCoins(currentLevelTheme);
  particles = []; fireworks = [];

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  gameState = 'playing';
  updateUI();
  startTimer();
  animationFrameId = requestAnimationFrame(gameLoop);
  audioManager.stopAll();
  audioManager.playMusic('gameAdventure');
}

function restartGame() { beginGame(); }

function returnToMenu() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  player.vx = 0; player.vy = 0; player.celebrating = false; player.celebrateTimer = 0;
  player.onMovingPlatform = null;
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  gameState = 'menu';
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('win-screen').classList.add('hidden');
  document.getElementById('menu-button').classList.add('hidden');
  const mc2 = document.getElementById('mobile-controls');
  mc2.classList.add('hidden');
  mc2.style.display = 'none';
  document.getElementById('game-wrapper').classList.remove('mobile-mode');
  document.getElementById('start-screen').classList.remove('hidden');
  audioManager.stopAll();
  audioManager.playMusic('selectPlayer');
  drawMenu(); drawTomyPreview(); drawAranaPreview();
  requestAnimationFrame(updateMenuPreview);
}

function gameOver() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  gameState = 'gameover';
  if (timerInterval) clearInterval(timerInterval);
  document.getElementById('final-score').textContent = score;
  document.getElementById('gameover-screen').classList.remove('hidden');
  const mc2 = document.getElementById('mobile-controls');
  mc2.classList.add('hidden');
  mc2.style.display = 'none';
  document.getElementById('game-wrapper').classList.remove('mobile-mode');
  audioManager.stopAll();
  audioManager.play('fail');
}

function winGame() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  gameState = 'win';
  if (timerInterval) clearInterval(timerInterval);
  score += timeLeft * 10;
  player.celebrating = true;
  player.celebrateTimer = 180;
  winPreviewFrame = 0; winPreviewTimer = 0;
  fireworks = [];
  for (let i = 0; i < 3; i++) {
    setTimeout(() => spawnFirework(), i * 400);
  }
  drawWinCharacter();
  requestAnimationFrame(updateWinPreview);
  document.getElementById('win-score').textContent = score;
  document.getElementById('win-screen').classList.remove('hidden');
  const mc2 = document.getElementById('mobile-controls');
  mc2.classList.add('hidden');
  mc2.style.display = 'none';
  document.getElementById('game-wrapper').classList.remove('mobile-mode');
  spawnParticles(player.x + player.w / 2, player.y, '#ffd700', 30);
  audioManager.stopAll();
  audioManager.playMusic('victory');
}

// ---------- GAME LOOP ----------
function gameLoop() {
  animationFrameId = requestAnimationFrame(gameLoop);
  if (gameState !== 'playing') return;
  updatePlayer();
  updateAnimations();
  updateEnemies();
  updateMovingPlatforms();
  updateCoins();
  updateParticles();
  updateCamera();
  draw();
}

// ---------- INICIALIZACIÓN ----------
spriteLoader.onComplete = () => {
  animator = new Animator(spriteLoader);
  drawMenu();
  drawTomyPreview();
  drawAranaPreview();
  requestAnimationFrame(updateMenuPreview);
};

spriteLoader.load();
