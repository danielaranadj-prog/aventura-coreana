// ============================================================
// ENEMIGOS
// ============================================================

import { TILE } from '../config.js';

export class Enemy {
  constructor(x, y, type, config = {}) {
    this.x = x;
    this.y = y;
    this.w = config.w || 28;
    this.h = config.h || 28;
    this.vx = config.vx || 1;
    this.vy = 0;
    this.type = type;
    this.dead = false;
    this.canStomp = config.canStomp !== false;
    this.color = config.color || '#dc143c';
    this.eyeColor = config.eyeColor || '#ffff00';
    this.hornColor = config.hornColor || '#8b0000';
    this.baseY = y;
    this.flyPhase = Math.random() * Math.PI * 2;
    this.huntSpeed = config.huntSpeed || 1.5;
    this.originalVx = this.vx;
    this.onPlatform = config.onPlatform || false;
    this.platformLeft = config.platformLeft || null;
    this.platformRight = config.platformRight || null;
  }

  update(dt, player, level) {
    if (this.dead) return;

    if (this.type === 'fly') {
      this.flyPhase += 0.05;
      this.y = this.baseY + Math.sin(this.flyPhase) * 40;
      this.x += this.vx;
    } else if (this.type === 'hunter') {
      const distX = Math.abs(player.x - this.x);
      const sameLevel = Math.abs(player.y - this.y) < 100;
      if (distX < 120 && sameLevel) {
        const dir = player.x > this.x ? 1 : -1;
        this.vx = dir * this.huntSpeed;
      } else {
        if (Math.abs(this.vx) > Math.abs(this.originalVx)) {
          this.vx = this.originalVx;
        }
      }
      this.x += this.vx;
    } else {
      this.x += this.vx;
    }

    // Rebote en bordes del nivel
    if (this.x <= 0 || this.x + this.w >= level.width * TILE) {
      this.vx *= -1;
      this.x = Math.max(0, Math.min(this.x, level.width * TILE - this.w));
      if (this.type === 'hunter') this.originalVx = this.vx;
      return;
    }

    // Lógica de suelo/pared
    if (this.type !== 'fly') {
      const frontX = this.x + (this.vx > 0 ? this.w : 0);
      const groundBelow = level.getTile(frontX, this.y + this.h + 4);
      const wallAhead = level.getTile(frontX, this.y + this.h / 2);
      if (!level.isSolid(groundBelow) || level.isSolid(wallAhead)) {
        this.vx *= -1;
        if (this.type === 'hunter') this.originalVx = this.vx;
      }
    }
  }

  checkCollision(player) {
    if (this.dead) return null;
    const a = { x: this.x, y: this.y, w: this.w, h: this.h };
    const b = player.getBounds();
    if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
      const stompFromAbove = player.vy > 0 && player.y + player.h < this.y + this.h / 2 + 8;
      if (stompFromAbove && this.canStomp) {
        return 'stomp';
      }
      return 'hit';
    }
    return null;
  }

  draw(ctx, player) {
    if (this.dead) return;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const r = this.w / 2;

    ctx.save();
    if (this.type === 'big') this._drawBig(ctx, cx, cy, r);
    else if (this.type === 'fast') this._drawFast(ctx, cx, cy, r);
    else if (this.type === 'fly') this._drawFly(ctx, cx, cy, r);
    else if (this.type === 'hunter') this._drawHunter(ctx, cx, cy, r, player);
    else this._drawGoomba(ctx, cx, cy, r);
    ctx.restore();
  }

  _drawGoomba(ctx, cx, cy, r) {
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.hornColor;
    ctx.beginPath();
    ctx.moveTo(this.x + 6, this.y + 4); ctx.lineTo(this.x + 2, this.y - 2); ctx.lineTo(this.x + 10, this.y + 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.x + this.w - 6, this.y + 4); ctx.lineTo(this.x + this.w - 2, this.y - 2); ctx.lineTo(this.x + this.w - 10, this.y + 2);
    ctx.fill();
    const eyeOffset = this.vx > 0 ? 4 : -4;
    ctx.fillStyle = this.eyeColor;
    ctx.shadowColor = this.eyeColor; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(cx - 6 + eyeOffset, cy + 2, 4, 0, Math.PI * 2); ctx.arc(cx + 6 + eyeOffset, cy + 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath(); ctx.arc(cx - 6 + eyeOffset + (this.vx > 0 ? 1 : -1), cy + 2, 2, 0, Math.PI * 2); ctx.arc(cx + 6 + eyeOffset + (this.vx > 0 ? 1 : -1), cy + 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4a0000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(this.x + 4, this.y + 4); ctx.lineTo(this.x + 12, this.y + 6); ctx.moveTo(this.x + this.w - 4, this.y + 4); ctx.lineTo(this.x + this.w - 12, this.y + 6); ctx.stroke();
  }

  _drawBig(ctx, cx, cy, r) {
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4a0000'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = this.hornColor;
    ctx.beginPath();
    ctx.moveTo(this.x + 8, this.y + 6); ctx.lineTo(this.x - 2, this.y - 8); ctx.lineTo(this.x + 14, this.y + 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.x + this.w - 8, this.y + 6); ctx.lineTo(this.x + this.w + 2, this.y - 8); ctx.lineTo(this.x + this.w - 14, this.y + 2);
    ctx.fill();
    const eyeOffset = this.vx > 0 ? 5 : -5;
    ctx.fillStyle = this.eyeColor;
    ctx.shadowColor = this.eyeColor; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(cx - 8 + eyeOffset, cy - 2, 5, 0, Math.PI * 2); ctx.arc(cx + 8 + eyeOffset, cy - 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath(); ctx.arc(cx - 8 + eyeOffset + (this.vx > 0 ? 1 : -1), cy - 2, 2.5, 0, Math.PI * 2); ctx.arc(cx + 8 + eyeOffset + (this.vx > 0 ? 1 : -1), cy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 10, cy - 10); ctx.lineTo(cx + 10, cy - 10); ctx.stroke();
  }

  _drawFast(ctx, cx, cy, r) {
    ctx.fillStyle = this.color;
    const dir = this.vx > 0 ? 1 : -1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.1, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#008b8b'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - r * dir, cy - 4); ctx.lineTo(cx - r * dir - 8 * dir, cy - 4);
    ctx.moveTo(cx - r * dir, cy + 4); ctx.lineTo(cx - r * dir - 8 * dir, cy + 4);
    ctx.stroke();
    const eyeOffset = this.vx > 0 ? 4 : -4;
    ctx.fillStyle = this.eyeColor;
    ctx.shadowColor = this.eyeColor; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(cx - 5 + eyeOffset, cy - 1, 3.5, 0, Math.PI * 2); ctx.arc(cx + 5 + eyeOffset, cy - 1, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#008b8b';
    ctx.beginPath(); ctx.arc(cx - 5 + eyeOffset + (this.vx > 0 ? 0.8 : -0.8), cy - 1, 1.5, 0, Math.PI * 2); ctx.arc(cx + 5 + eyeOffset + (this.vx > 0 ? 0.8 : -0.8), cy - 1, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  _drawFly(ctx, cx, cy, r) {
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    const wingFlap = Math.sin(Date.now() / 100) * 8;
    ctx.fillStyle = 'rgba(255, 105, 180, 0.6)';
    ctx.beginPath(); ctx.ellipse(cx - r, cy - 4 + wingFlap, 10, 6, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + r, cy - 4 - wingFlap, 10, 6, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.hornColor;
    ctx.beginPath();
    ctx.moveTo(this.x + 6, this.y + 4); ctx.lineTo(this.x + 2, this.y - 4); ctx.lineTo(this.x + 10, this.y + 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.x + this.w - 6, this.y + 4); ctx.lineTo(this.x + this.w - 2, this.y - 4); ctx.lineTo(this.x + this.w - 10, this.y + 2);
    ctx.fill();
    const eyeOffset = this.vx > 0 ? 3 : -3;
    ctx.fillStyle = this.eyeColor;
    ctx.shadowColor = this.eyeColor; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(cx - 5 + eyeOffset, cy + 2, 3.5, 0, Math.PI * 2); ctx.arc(cx + 5 + eyeOffset, cy + 2, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  _drawHunter(ctx, cx, cy, r) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(cx, this.y);
    ctx.lineTo(this.x + this.w, cy - 2);
    ctx.lineTo(this.x + this.w, cy + 6);
    ctx.lineTo(cx, this.y + this.h);
    ctx.lineTo(this.x, cy + 6);
    ctx.lineTo(this.x, cy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = this.hornColor;
    ctx.beginPath(); ctx.moveTo(this.x, cy); ctx.lineTo(this.x - 6, cy - 4); ctx.lineTo(this.x, cy + 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(this.x + this.w, cy); ctx.lineTo(this.x + this.w + 6, cy - 4); ctx.lineTo(this.x + this.w, cy + 4); ctx.fill();
    const eyeOffset = this.vx > 0 ? 3 : -3;
    ctx.fillStyle = this.eyeColor;
    ctx.shadowColor = this.eyeColor; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(cx - 5 + eyeOffset, cy + 2, 3.5, 0, Math.PI * 2); ctx.arc(cx + 5 + eyeOffset, cy + 2, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx - 5 + eyeOffset + (this.vx > 0 ? 0.8 : -0.8), cy + 2, 1.5, 0, Math.PI * 2); ctx.arc(cx + 5 + eyeOffset + (this.vx > 0 ? 0.8 : -0.8), cy + 2, 1.5, 0, Math.PI * 2); ctx.fill();
  }
}

export function createEnemies(levelMap, levelWidth, levelHeight) {
  const enemies = [];
  const GROUND_Y = (levelHeight - 2) * TILE;

  // Enemigos en suelo
  const groundCount = 6 + Math.floor(Math.random() * 5);
  for (let i = 0; i < groundCount; i++) {
    const tileX = 15 + Math.floor(Math.random() * (levelWidth - 25));
    const x = tileX * TILE;

    let type;
    const rand = Math.random();
    if (rand < 0.40) type = 'goomba';
    else if (rand < 0.60) type = 'big';
    else if (rand < 0.80) type = 'fast';
    else if (rand < 0.90) type = 'fly';
    else type = 'hunter';

    const enemy = makeEnemy(type, x, GROUND_Y);
    if (enemy) enemies.push(enemy);
  }

  // Plataformas azules (tile=2)
  const platforms = [];
  for (let y = 0; y < levelHeight; y++) {
    let startX = -1;
    for (let x = 0; x < levelWidth; x++) {
      if (levelMap[y][x] === 2) {
        if (startX === -1) startX = x;
      } else {
        if (startX !== -1) {
          const width = x - startX;
          if (width >= 2) platforms.push({ x: startX, y, w: width });
          startX = -1;
        }
      }
    }
    if (startX !== -1) {
      const width = levelWidth - startX;
      if (width >= 2) platforms.push({ x: startX, y, w: width });
    }
  }

  const shuffled = platforms.sort(() => Math.random() - 0.5);
  const platformCount = Math.max(1, Math.floor(platforms.length * (0.35 + Math.random() * 0.30)));
  const selected = shuffled.slice(0, platformCount);
  const platformTypes = ['goomba', 'fast', 'fly'];

  selected.forEach(p => {
    const offsetX = 1 + Math.floor(Math.random() * (p.w - 2));
    const x = (p.x + offsetX) * TILE;
    const groundY = p.y * TILE;
    const type = platformTypes[Math.floor(Math.random() * platformTypes.length)];
    const enemy = makeEnemy(type, x, groundY, true);
    if (enemy) enemies.push(enemy);
  });

  return enemies;
}

function makeEnemy(type, x, groundY, onPlatform = false) {
  let w, h, vx, startY, canStomp = true;
  let color, eyeColor, hornColor;

  switch (type) {
    case 'goomba':
      w = 28; h = 28; vx = 0.5 + Math.random() * 0.4; startY = groundY - h;
      color = '#dc143c'; eyeColor = '#ffff00'; hornColor = '#8b0000';
      break;
    case 'big':
      w = 44; h = 44; vx = 0.3 + Math.random() * 0.2; startY = groundY - h; canStomp = false;
      color = '#8b0000'; eyeColor = '#ffcc00'; hornColor = '#4a0000';
      break;
    case 'fast':
      w = 22; h = 22; vx = 1.0 + Math.random() * 0.5; startY = groundY - h;
      color = '#00ffff'; eyeColor = '#ffffff'; hornColor = '#008b8b';
      break;
    case 'fly':
      w = 28; h = 28; vx = 0.5 + Math.random() * 0.3; startY = groundY - 80 - Math.random() * 60;
      color = '#ff69b4'; eyeColor = '#00ffff'; hornColor = '#ff00ff';
      break;
    case 'hunter':
      w = 28; h = 28; vx = 0.5 + Math.random() * 0.3; startY = groundY - h;
      color = '#9932cc'; eyeColor = '#ff00ff'; hornColor = '#4b0082';
      break;
    default:
      return null;
  }

  if (Math.random() < 0.5) vx = -vx;

  return new Enemy(x, startY, type, {
    w, h, vx, canStomp, color, eyeColor, hornColor,
    onPlatform,
    platformLeft: onPlatform ? x - 40 : null,
    platformRight: onPlatform ? x + 40 : null,
  });
}
