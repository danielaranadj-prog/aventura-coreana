// ============================================================
// GAME — ORQUESTADOR PRINCIPAL CON DELTA TIME Y MÚLTIPLES NIVELES
// ============================================================

import { TILE, LEVEL_WIDTH, LEVEL_HEIGHT, JUMP_FORCE } from '../config.js';
import { Player } from '../entities/Player.js';
import { createEnemies } from '../entities/Enemy.js';
import { Coin } from '../entities/Coin.js';
import { ParticleSystem } from '../entities/Particle.js';
import { FireworkSystem } from '../entities/Firework.js';
import { Level } from '../world/Level.js';
import { Level2, LEVEL2_WIDTH, LEVEL2_HEIGHT } from '../world/Level2.js';
import { Camera } from '../core/Camera.js';
import { Animator } from './Animator.js';

export class Game {
  constructor(canvas, ctx, assetManager, audioManager, inputManager, screens, hud) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.assets = assetManager;
    this.audio = audioManager;
    this.input = inputManager;
    this.screens = screens;
    this.hud = hud;

    this.state = 'LOADING';
    this.rafId = null;
    this.lastTime = 0;

    this.score = 0;
    this.lives = 3;
    this.timeLeft = 300;
    this.timerInterval = null;
    this.selectedCharacter = 'tomy';
    this.selectedLevel = 1;
    this.prispasCollected = 0;
    this.allCoinsBonusGiven = false;

    this.player = null;
    this.level = null;
    this.camera = null;
    this.enemies = [];
    this.coins = [];
    this.particles = new ParticleSystem();
    this.fireworks = new FireworkSystem();
    this.animator = null;
    this.projectiles = []; // para proyectiles de shooters
  }

  async init() {
    this.screens.showLoading();
    this.assets.onProgress = (loaded, total) => this.screens.updateLoading(loaded, total);
    await this.assets.load();
    await Promise.race([this.audio.loadAll(), new Promise(r => setTimeout(r, 6000))]);
    this.audio.init();

    this.animator = new Animator(this.assets, this.selectedCharacter);
    this.screens.showMenu();
    this.state = 'MENU';

    const resumeAudio = () => {
      this.audio.resumeContext();
      if (this.audio.currentMusic !== 'selectPlayer') {
        this.audio.playMusic('selectPlayer');
      }
    };
    document.addEventListener('touchstart', resumeAudio, { once: true });
    document.addEventListener('click', resumeAudio, { once: true });
  }

  selectCharacter(name) {
    this.selectedCharacter = name;
    if (this.animator) this.animator.setCharacter(name);
  }

  startGame() {
    this.audio.init();
    this.audio.resumeContext();
    this.audio.play('gameStart');
    this.screens.showLevelLoading(this.selectedLevel);
    this.state = 'LEVEL_LOADING';

    let progress = 0;
    const duration = 2000;
    const intervalTime = 40;
    const increment = 100 / (duration / intervalTime);

    const loadInterval = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        progress = 100;
        this.screens.updateLevelLoading(100);
        clearInterval(loadInterval);
        setTimeout(() => this._beginGame(), 150);
      } else {
        this.screens.updateLevelLoading(progress);
      }
    }, intervalTime);
  }

  async _beginGame() {
    this.screens.hideAll();
    this.screens.stopMenuPreview();
    this.hud.show();
    this.hud.showMobileControls();

    this.score = 0; this.lives = 3;
    this.prispasCollected = 0; this.allCoinsBonusGiven = false;
    this.projectiles = [];

    // Configurar según nivel seleccionado
    const isLevel2 = this.selectedLevel === 2;
    const levelWidth = isLevel2 ? LEVEL2_WIDTH : LEVEL_WIDTH;
    const levelHeight = isLevel2 ? LEVEL2_HEIGHT : LEVEL_HEIGHT;
    const timeLimit = isLevel2 ? 250 : 300;
    this.timeLeft = timeLimit;

    if (isLevel2) {
      this.level = new Level2();
    } else {
      this.level = Level.generate();
    }

    this.camera = new Camera(this.canvas.width, levelWidth, TILE);

    const groundY = (levelHeight - 2) * TILE;
    this.player = new Player(64, groundY - 48, levelHeight);

    // Crear enemigos según nivel
    if (isLevel2) {
      // Importar enemigos avanzados dinámicamente
      await this._loadAdvancedEnemies(levelWidth, levelHeight, groundY);
    } else {
      this.enemies = createEnemies(this.level.map, levelWidth, levelHeight);
    }

    this.coins = Coin.createForLevel(this.level.map, levelWidth, levelHeight, isLevel2);
    this.particles = new ParticleSystem();
    this.fireworks = new FireworkSystem();

    this.animator.setCharacter(this.selectedCharacter);
    this.animator.setStaticFrame('run', 6);

    this.lastTime = 0;
    this.state = 'PLAYING';
    this.hud.update(this.score, this.lives, this.timeLeft);
    this._startTimer();

    this.audio.stopAll();
    this.audio.playMusic('gameAdventure');

    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame((t) => this._loop(t));
  }

  async _loadAdvancedEnemies(levelWidth, levelHeight, groundY) {
    try {
      const { createAdvancedEnemies } = await import('../entities/EnemyAdvanced.js');
      this.enemies = createAdvancedEnemies(this.level.map, levelWidth, levelHeight);
    } catch (e) {
      console.warn('No se pudieron cargar enemigos avanzados, usando básicos:', e);
      this.enemies = createEnemies(this.level.map, levelWidth, levelHeight);
    }
  }

  _startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state === 'PLAYING') {
        this.timeLeft--;
        this.hud.update(this.score, this.lives, this.timeLeft);
        if (this.timeLeft <= 0) this._gameOver();
      }
    }, 1000);
  }

  _loop(timestamp) {
    this.rafId = requestAnimationFrame((t) => this._loop(t));
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / (1000 / 60), 3);
    this.lastTime = timestamp;

    if (this.state === 'PLAYING') {
      this._updatePlaying(dt);
      this._drawPlaying();
    }
  }

  _updatePlaying(dt) {
    const result = this.player.update(this.input, this.level, dt, this.audio, this.particles);
    if (result === 'fell') {
      if (this.player.invincible <= 0) { this._playerDie(true); return; }
      else {
        const groundY = (this.level.height - 2) * TILE;
        this.player.respawn(64, groundY - this.player.h + 2, true);
      }
    } else if (result === 'win') {
      this._winGame(); return;
    } else if (typeof result === 'number' && result > 0) {
      this.score += result;
    }

    // Animations
    const hasInput = this.input.isDown('ArrowLeft') || this.input.isDown('KeyA') ||
                     this.input.isDown('ArrowRight') || this.input.isDown('KeyD');
    const isMoving = Math.abs(this.player.vx) > 0.1;
    if (this.player.onGround && !hasInput && !isMoving) {
      this.player.vx = 0;
      this.animator.setStaticFrame('run', 6);
    } else {
      this.animator.setAnimation('run', 6);
      this.animator.update();
    }
    this.animator.facing = this.player.facing;

    this.camera.update(this.player.x);

    // Enemies
    for (const e of this.enemies) {
      e.update(dt, this.player, this.level);

      // Colisión con jugador
      const collision = e.checkCollision(this.player);
      if (collision === 'stomp') {
        // Manejar splitter
        if (e.type === 'splitter' && typeof e.split === 'function') {
          const children = e.split();
          this.enemies.push(...children);
          this.score += 100;
        } else {
          e.dead = true;
          this.score += 200;
        }
        this.player.vy = JUMP_FORCE * 0.7;
        this.particles.spawn(e.x + e.w / 2, e.y + e.h / 2, '#ff0040', 12);
        this.audio.play('stomp');
      } else if (collision === 'hit') {
        this._playerDie(false); return;
      }

      // Proyectiles de shooters
      if (e.type === 'shooter' && typeof e.checkProjectileCollision === 'function') {
        if (e.checkProjectileCollision(this.player)) {
          this._playerDie(false); return;
        }
      }
    }

    // Limpiar enemigos muertos
    this.enemies = this.enemies.filter(e => !e.dead);

    // Coins
    let coinPoints = 0;
    for (const c of this.coins) {
      c.update(dt);
      const b = c.getBounds();
      const pb = this.player.getBounds();
      if (!c.collected && b.x < pb.x + pb.w && b.x + b.w > pb.x && b.y < pb.y + pb.h && b.y + b.h > pb.y) {
        c.collected = true;
        coinPoints += 50;
        this.particles.spawn(c.x + 8, c.y + 8, '#ffd700', 6);
        if (c.type === 'prispas') {
          this.prispasCollected++;
          if (this.prispasCollected >= 3) {
            this.prispasCollected = 0;
            this.lives++;
            this.audio.playOneUp();
            this.particles.spawn(c.x + 8, c.y + 8, '#00ff88', 20);
          }
        }
      }
    }
    if (coinPoints > 0) {
      this.score += coinPoints;
      const allCollected = this.coins.every(c => c.collected);
      if (allCollected && !this.allCoinsBonusGiven) {
        this.allCoinsBonusGiven = true;
        this.lives++;
        this.audio.playOneUp();
        this.particles.spawn(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, '#00ff88', 30);
      }
      this.hud.update(this.score, this.lives, this.timeLeft);
    }

    this.particles.update(dt);
  }

  _drawPlaying() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this._drawBackground(ctx);
    this.camera.apply(ctx);
    this._drawLevel(ctx);
    this._drawFinalStructure(ctx);
    for (const c of this.coins) c.draw(ctx, this.assets);
    for (const e of this.enemies) e.draw(ctx);
    this.particles.draw(ctx);
    this.player.draw(ctx, this.animator);
    this.camera.restore(ctx);
  }

  _drawBackground(ctx) {
    const isLevel2 = this.selectedLevel === 2;
    const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    if (isLevel2) {
      // Fondo más oscuro y amenazante para nivel 2
      grad.addColorStop(0, '#050010');
      grad.addColorStop(0.3, '#1a0000');
      grad.addColorStop(0.6, '#2d0b1e');
      grad.addColorStop(1, '#4a0a1a');
    } else {
      grad.addColorStop(0, '#0d0221');
      grad.addColorStop(0.4, '#1a0a2e');
      grad.addColorStop(0.7, '#2d1b4e');
      grad.addColorStop(1, '#4a1a6b');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this._drawStars(ctx);
    this._drawNebula(ctx);
  }

  _drawStars(ctx) {
    const stars = [
      {x:50,y:30,s:1.5},{x:120,y:80,s:1},{x:200,y:40,s:2},{x:300,y:120,s:1},
      {x:80,y:200,s:1.5},{x:350,y:250,s:1},{x:150,y:350,s:2},{x:280,y:400,s:1},
      {x:60,y:500,s:1},{x:320,y:550,s:1.5},{x:180,y:600,s:1},{x:380,y:50,s:1},
      {x:30,y:300,s:2},{x:370,y:350,s:1},{x:100,y:450,s:1.5},{x:250,y:500,s:1},
    ];
    stars.forEach(s => {
      const parallaxX = (s.x - this.camera.x * 0.1) % (this.level.width * TILE);
      const drawX = parallaxX < -10 ? parallaxX + this.level.width * TILE : parallaxX;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.sin(Date.now() / 500 + s.x) * 0.2) + ')';
      ctx.beginPath(); ctx.arc(drawX, s.y, s.s, 0, Math.PI * 2); ctx.fill();
    });
  }

  _drawNebula(ctx) {
    const nebulas = [
      {x:100,y:150,r:80,c:'rgba(255,0,255,0.08)'},{x:300,y:300,r:100,c:'rgba(0,255,255,0.06)'},
      {x:200,y:500,r:120,c:'rgba(255,105,180,0.07)'},{x:50,y:400,r:60,c:'rgba(138,43,226,0.09)'},
    ];
    nebulas.forEach(n => {
      const parallaxX = (n.x - this.camera.x * 0.05) % (this.level.width * TILE);
      const drawX = parallaxX < -200 ? parallaxX + this.level.width * TILE : parallaxX;
      const grad = ctx.createRadialGradient(drawX, n.y, 0, drawX, n.y, n.r);
      grad.addColorStop(0, n.c);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(drawX, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    });
  }

  _drawLevel(ctx) {
    const startCol = this.camera.getStartCol();
    const endCol = Math.min(this.camera.getEndCol(), this.level.width);
    for (let y = 0; y < this.level.height; y++) {
      for (let x = startCol; x < endCol; x++) {
        const tile = this.level.getTileAt(x, y);
        const px = x * TILE, py = y * TILE;
        if (tile === 1) {
          ctx.fillStyle = '#1a0a2e'; ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = '#ff00ff'; ctx.fillRect(px, py, TILE, 3);
          ctx.fillStyle = '#4a1a6b';
          ctx.fillRect(px + 4, py + 10, 4, 4); ctx.fillRect(px + 20, py + 18, 5, 5); ctx.fillRect(px + 12, py + 24, 3, 3);
          ctx.strokeStyle = 'rgba(255,0,255,0.15)'; ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
        } else if (tile === 2) {
          ctx.fillStyle = '#00b4d8'; ctx.fillRect(px, py, TILE, TILE);
          ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
          ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(px + TILE / 2, py); ctx.lineTo(px + TILE / 2, py + TILE);
          ctx.moveTo(px, py + TILE / 2); ctx.lineTo(px + TILE / 2, py + TILE / 2);
          ctx.moveTo(px + TILE / 2, py + TILE / 4); ctx.lineTo(px + TILE, py + TILE / 4);
          ctx.moveTo(px + TILE / 2, py + TILE * 3 / 4); ctx.lineTo(px + TILE, py + TILE * 3 / 4);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (tile === 3) {
          ctx.fillStyle = '#ffd700'; ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          ctx.strokeStyle = '#ff69b4'; ctx.lineWidth = 2;
          ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
          ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10;
          ctx.fillStyle = '#fff5cc';
          ctx.fillRect(px + 8, py + 8, 6, 6); ctx.fillRect(px + 18, py + 12, 4, 4);
          ctx.shadowBlur = 0;
        } else if (tile === 4) {
          ctx.fillStyle = '#00ff88'; ctx.fillRect(px, py, TILE * 2, TILE * 2);
          ctx.fillStyle = '#00cc6a'; ctx.fillRect(px, py, TILE * 2, 8); ctx.fillRect(px, py + TILE, TILE * 2, 4);
          ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2;
          ctx.strokeRect(px, py, TILE * 2, TILE * 2);
          ctx.fillStyle = '#66ffaa'; ctx.fillRect(px + 4, py + 12, 4, TILE * 2 - 16);
        }
      }
    }
  }

  _drawFinalStructure(ctx) {
    const isLevel2 = this.selectedLevel === 2;
    const centerX = isLevel2 
      ? (this.level.width - 5) * TILE + TILE
      : (LEVEL_WIDTH - 5) * TILE + TILE;
    const baseY = (this.level.height - 2) * TILE;
    const w = isLevel2 ? 140 : 112; // Más ancha en nivel 2
    const x = centerX - w / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(centerX, baseY + 6, w / 2 + 10, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nivel 0
    ctx.fillStyle = '#c4b088'; ctx.fillRect(x, baseY - 32, w, 32);
    ctx.fillStyle = '#a89070'; ctx.fillRect(x + w - 14, baseY - 32, 14, 32);
    ctx.fillStyle = '#e6d5b8'; ctx.fillRect(x, baseY - 34, w, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(x + 8, baseY - 24, 20, 2); ctx.fillRect(x + 44, baseY - 18, 24, 2); ctx.fillRect(x + 84, baseY - 26, 16, 2);

    // Nivel 1
    ctx.fillStyle = '#d4c4a0'; ctx.fillRect(x + 8, baseY - 60, w - 16, 28);
    ctx.fillStyle = '#b8a078'; ctx.fillRect(x + w - 22, baseY - 60, 14, 28);
    ctx.fillStyle = '#e6d5b8'; ctx.fillRect(x + 8, baseY - 62, w - 16, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(x + 18, baseY - 52, 16, 2); ctx.fillRect(x + w / 2 - 10, baseY - 46, 20, 2);

    // Nivel 2
    ctx.fillStyle = '#c4b088'; ctx.fillRect(x + 16, baseY - 84, w - 32, 24);
    ctx.fillStyle = '#a89070'; ctx.fillRect(x + w - 30, baseY - 84, 14, 24);
    ctx.fillStyle = '#d4c4a0'; ctx.fillRect(x + 16, baseY - 86, w - 32, 2);

    // Nivel 3
    ctx.fillStyle = '#d4c4a0'; ctx.fillRect(x + 24, baseY - 106, w - 48, 22);
    ctx.fillStyle = '#b8a078'; ctx.fillRect(x + w - 38, baseY - 106, 14, 22);
    ctx.fillStyle = '#e6d5b8'; ctx.fillRect(x + 24, baseY - 108, w - 48, 2);

    // Nivel 4
    ctx.fillStyle = '#c4b088'; ctx.fillRect(x + 32, baseY - 134, w - 64, 28);
    ctx.fillStyle = '#a89070'; ctx.fillRect(x + w - 46, baseY - 134, 14, 28);
    ctx.fillStyle = '#d4c4a0'; ctx.fillRect(x + 32, baseY - 136, w - 64, 2);

    // Cúspide
    ctx.fillStyle = '#e6d5b8'; ctx.fillRect(x + w / 2 - 12, baseY - 152, 24, 18);
    ctx.fillStyle = '#c4b088'; ctx.fillRect(x + w / 2 + 6, baseY - 152, 6, 18);
    ctx.fillStyle = '#d4c4a0'; ctx.fillRect(x + w / 2 - 12, baseY - 154, 24, 2);

    // Ventanas
    const drawWindow = (wx, wy, lit = false) => {
      ctx.fillStyle = lit ? '#ffd700' : '#3d2b1a';
      ctx.beginPath();
      ctx.moveTo(wx, wy + 10); ctx.quadraticCurveTo(wx + 5, wy - 3, wx + 10, wy + 10);
      ctx.lineTo(wx + 10, wy + 10); ctx.lineTo(wx, wy + 10); ctx.fill();
      if (lit) {
        ctx.save(); ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.moveTo(wx + 1, wy + 9); ctx.quadraticCurveTo(wx + 5, wy - 1, wx + 9, wy + 9); ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(wx, wy + 10); ctx.quadraticCurveTo(wx + 5, wy - 3, wx + 10, wy + 10); ctx.stroke();
    };

    const step = Math.floor(w / 5);
    for (let i = 0; i < 4; i++) {
      drawWindow(x + 14 + i * step, baseY - 30, i % 2 === 0);
    }
    for (let i = 0; i < 3; i++) {
      drawWindow(x + 22 + i * step, baseY - 56, i % 2 !== 0);
    }
    drawWindow(x + w / 2 - 5, baseY - 130, true);

    // Camino
    ctx.fillStyle = '#d4c5a9';
    ctx.beginPath(); ctx.moveTo(x + w, baseY);
    ctx.quadraticCurveTo(x + w + 28, baseY - 50, x + w + 14, baseY - 100);
    ctx.lineTo(x + w + 26, baseY - 100);
    ctx.quadraticCurveTo(x + w + 40, baseY - 50, x + w + 18, baseY);
    ctx.fill();
    ctx.strokeStyle = '#b8a88a'; ctx.lineWidth = 1; ctx.stroke();

    // Brillo
    ctx.save(); ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.beginPath(); ctx.arc(centerX, baseY - 152, 10, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  _playerDie(fellInGap = false) {
    if (this.player.invincible > 0) return;
    this.lives--;
    this.hud.update(this.score, this.lives, this.timeLeft);
    this.particles.spawn(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, '#ff0040', 20);
    this.audio.play('death');
    if (this.lives <= 0) {
      this._gameOver();
    } else {
      const safeGroundY = (this.level.height - 2) * TILE;
      this.player.respawn(Math.max(64, this.player.x - 200), fellInGap ? safeGroundY - this.player.h + 2 : 200, fellInGap);
    }
  }

  _winGame() {
    if (this.state !== 'PLAYING') return;
    this.state = 'WIN';
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.score += this.timeLeft * 10;
    this.player.startCelebration();
    this.particles.spawn(this.player.x + this.player.w / 2, this.player.y, '#ffd700', 30);
    this.screens.showWin(this.score, this.selectedCharacter, this.fireworks);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  _gameOver() {
    if (this.state === 'GAMEOVER') return;
    this.state = 'GAMEOVER';
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.hud.hide();
    this.hud.hideMobileControls();
    this.screens.showGameOver(this.score);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  restartGame() {
    this._beginGame();
  }

  returnToMenu() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.screens.stopWinPreview();
    this.hud.hide();
    this.hud.hideMobileControls();
    this.screens.showMenu();
    this.state = 'MENU';
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.audio.stopAll();
    this.audio.playMusic('selectPlayer');
  }
}
