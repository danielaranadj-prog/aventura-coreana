// ============================================================
// ENEMIGOS AVANZADOS — NIVEL 2
// ============================================================

import { TILE } from '../config.js';
import { Enemy } from './Enemy.js';

// --- PROJECTILES (balas de enemigos shooter) ---
export class Projectile {
  constructor(x, y, vx, vy, color = '#ff0000') {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.w = 8; this.h = 8; this.color = color;
    this.active = true; this.life = 120;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.vy += 0.05; // ligera gravedad
    this.life--;
    if (this.life <= 0) this.active = false;
  }
  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.shadowColor = this.color; ctx.shadowBlur = 8;
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(this.x + 4, this.y + 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  getBounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}

// --- ENEMIGO JUMPER (salta periódicamente) ---
export class JumperEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 'jumper', {
      w: 28, h: 28, vx: 0.8 + Math.random() * 0.4,
      canStomp: true,
      color: '#32cd32', eyeColor: '#ffff00', hornColor: '#006400'
    });
    this.jumpTimer = 30 + Math.floor(Math.random() * 60);
    this.jumpForce = -10 - Math.random() * 4;
    this.onGround = true;
  }

  update(dt, player, level) {
    if (this.dead) return;
    super.update(dt, player, level);

    this.jumpTimer -= dt * 60;
    if (this.jumpTimer <= 0 && this.onGround) {
      this.vy = this.jumpForce;
      this.onGround = false;
      this.jumpTimer = 40 + Math.floor(Math.random() * 80);
    }

    this.vy += 0.6; // gravedad
    this.y += this.vy;

    // Colisión con suelo
    const groundTile = level.getTile(this.x + this.w / 2, this.y + this.h + 2);
    if (level.isSolid(groundTile)) {
      this.y = (Math.floor((this.y + this.h) / TILE)) * TILE - this.h;
      this.vy = 0;
      this.onGround = true;
    }
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.save();
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;

    // Cuerpo verde con forma de rana
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.w / 2, this.h / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Piernas (se estiran al saltar)
    const legStretch = Math.max(0, -this.vy * 2);
    ctx.strokeStyle = '#006400'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.x + 6, this.y + this.h - 4); ctx.lineTo(this.x + 2, this.y + this.h + legStretch);
    ctx.moveTo(this.x + this.w - 6, this.y + this.h - 4); ctx.lineTo(this.x + this.w - 2, this.y + this.h + legStretch);
    ctx.stroke();

    // Ojos grandes
    const eyeOffset = this.vx > 0 ? 3 : -3;
    ctx.fillStyle = this.eyeColor;
    ctx.shadowColor = this.eyeColor; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(cx - 5 + eyeOffset, cy - 4, 5, 0, Math.PI * 2); ctx.arc(cx + 5 + eyeOffset, cy - 4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(cx - 5 + eyeOffset + (this.vx > 0 ? 1 : -1), cy - 4, 2.5, 0, Math.PI * 2); ctx.arc(cx + 5 + eyeOffset + (this.vx > 0 ? 1 : -1), cy - 4, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}

// --- ENEMIGO TANK (lento, inmune a saltos) ---
export class TankEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 'tank', {
      w: 52, h: 44, vx: 0.25 + Math.random() * 0.15,
      canStomp: false,
      color: '#2f4f4f', eyeColor: '#ff4500', hornColor: '#1a1a1a'
    });
    this.hp = 3; // requiere 3 golpes (si implementamos sistema de golpes)
    this.armorFlash = 0;
  }

  update(dt, player, level) {
    if (this.dead) return;
    super.update(dt, player, level);
    if (this.armorFlash > 0) this.armorFlash -= dt * 60;
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.save();
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;

    // Cuerpo blindado (rectángulo redondeado)
    ctx.fillStyle = this.armorFlash > 0 ? '#ff4500' : this.color;
    ctx.beginPath();
    ctx.roundRect(this.x + 2, this.y + 4, this.w - 4, this.h - 8, 8);
    ctx.fill();

    // Blindaje decorativo
    ctx.strokeStyle = '#708090'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(this.x + 6, this.y + 8, this.w - 12, this.h - 16, 4); ctx.stroke();
    ctx.fillStyle = '#708090';
    ctx.fillRect(this.x + 10, this.y + 12, 6, 6); ctx.fillRect(this.x + this.w - 16, this.y + 12, 6, 6);

    // Ojos rojos amenazantes
    const eyeOffset = this.vx > 0 ? 4 : -4;
    ctx.fillStyle = this.eyeColor;
    ctx.shadowColor = this.eyeColor; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(cx - 10 + eyeOffset, cy - 2, 6, 0, Math.PI * 2); ctx.arc(cx + 10 + eyeOffset, cy - 2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath(); ctx.arc(cx - 10 + eyeOffset + (this.vx > 0 ? 1.5 : -1.5), cy - 2, 3, 0, Math.PI * 2); ctx.arc(cx + 10 + eyeOffset + (this.vx > 0 ? 1.5 : -1.5), cy - 2, 3, 0, Math.PI * 2); ctx.fill();

    // Indicador de "NO SALTAR" (cruz roja)
    ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(this.x + this.w - 12, this.y + 4); ctx.lineTo(this.x + this.w - 4, this.y + 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(this.x + this.w - 4, this.y + 4); ctx.lineTo(this.x + this.w - 12, this.y + 12); ctx.stroke();

    ctx.restore();
  }
}

// --- ENEMIGO SHOOTER (dispara proyectiles) ---
export class ShooterEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 'shooter', {
      w: 32, h: 32, vx: 0.4 + Math.random() * 0.3,
      canStomp: true,
      color: '#8a2be2', eyeColor: '#00ff00', hornColor: '#4b0082'
    });
    this.shootTimer = 60 + Math.floor(Math.random() * 60);
    this.projectiles = [];
  }

  update(dt, player, level) {
    if (this.dead) return;
    super.update(dt, player, level);

    this.shootTimer -= dt * 60;
    if (this.shootTimer <= 0) {
      // Disparar hacia el jugador
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 250 && dist > 20) {
        const speed = 3.5;
        this.projectiles.push(new Projectile(
          this.x + this.w / 2, this.y + this.h / 2,
          (dx / dist) * speed, (dy / dist) * speed - 1,
          '#ff0040'
        ));
      }
      this.shootTimer = 80 + Math.floor(Math.random() * 100);
    }

    // Actualizar proyectiles
    for (const p of this.projectiles) p.update();
    this.projectiles = this.projectiles.filter(p => p.active);
  }

  draw(ctx) {
    if (this.dead) return;
    super.draw(ctx);
    for (const p of this.projectiles) p.draw(ctx);
  }

  checkProjectileCollision(player) {
    const pb = player.getBounds();
    for (const p of this.projectiles) {
      if (!p.active) continue;
      const b = p.getBounds();
      if (b.x < pb.x + pb.w && b.x + b.w > pb.x && b.y < pb.y + pb.h && b.y + b.h > pb.y) {
        p.active = false;
        return true;
      }
    }
    return false;
  }
}

// --- ENEMIGO TELEPORTER (se teletransporta cerca del jugador) ---
export class TeleporterEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 'teleporter', {
      w: 26, h: 26, vx: 0,
      canStomp: true,
      color: '#00ced1', eyeColor: '#ffffff', hornColor: '#008b8b'
    });
    this.teleportTimer = 90 + Math.floor(Math.random() * 60);
    this.teleporting = false;
    this.teleportAlpha = 1;
    this.targetX = x;
    this.targetY = y;
  }

  update(dt, player, level) {
    if (this.dead) return;

    this.teleportTimer -= dt * 60;

    if (this.teleporting) {
      this.teleportAlpha -= 0.08;
      if (this.teleportAlpha <= 0) {
        // Teletransportar
        const offsetX = (Math.random() - 0.5) * 120;
        const newX = Math.max(20, Math.min(level.width * TILE - this.w - 20, player.x + offsetX));
        this.x = newX;
        this.y = player.y - 40 - Math.random() * 60;
        this.teleporting = false;
      }
    } else if (this.teleportAlpha < 1) {
      this.teleportAlpha += 0.08;
      if (this.teleportAlpha >= 1) this.teleportAlpha = 1;
    }

    if (this.teleportTimer <= 0 && !this.teleporting && this.teleportAlpha >= 1) {
      this.teleporting = true;
      this.teleportTimer = 100 + Math.floor(Math.random() * 80);
    }
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.save();
    ctx.globalAlpha = this.teleportAlpha;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;

    // Aura de teleportación
    ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15 * this.teleportAlpha;

    // Cuerpo circular con efecto de "fase"
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(cx, cy, this.w / 2, 0, Math.PI * 2); ctx.fill();

    // Ojos brillantes
    ctx.fillStyle = this.eyeColor;
    ctx.shadowColor = this.eyeColor; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(cx - 5, cy - 2, 3.5, 0, Math.PI * 2); ctx.arc(cx + 5, cy - 2, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Partículas de teleportación
    if (this.teleporting || this.teleportAlpha < 1) {
      ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
      for (let i = 0; i < 4; i++) {
        const angle = (Date.now() / 200) + (i * Math.PI / 2);
        const px = cx + Math.cos(angle) * (this.w * 0.8);
        const py = cy + Math.sin(angle) * (this.h * 0.8);
        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
      }
    }

    ctx.restore();
  }
}

// --- ENEMIGO SPLITTER (se divide al morir) ---
export class SplitterEnemy extends Enemy {
  constructor(x, y, size = 1) {
    const scale = size === 1 ? 1 : (size === 2 ? 0.6 : 0.35);
    super(x, y, 'splitter', {
      w: Math.floor(36 * scale), h: Math.floor(36 * scale),
      vx: (0.6 + Math.random() * 0.5) * (size === 1 ? 1 : 1.4),
      canStomp: true,
      color: size === 1 ? '#ff8c00' : (size === 2 ? '#ffa500' : '#ffcc00'),
      eyeColor: '#000000', hornColor: '#8b4500'
    });
    this.size = size; // 1 = grande, 2 = mediano, 3 = pequeño
    this.splitChildren = [];
  }

  update(dt, player, level) {
    if (this.dead) return;
    super.update(dt, player, level);
    for (const child of this.splitChildren) child.update(dt, player, level);
    this.splitChildren = this.splitChildren.filter(c => !c.dead);
  }

  draw(ctx) {
    if (this.dead) {
      for (const child of this.splitChildren) child.draw(ctx);
      return;
    }
    ctx.save();
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const r = this.w / 2;

    // Cuerpo naranja con "burbujas"
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8b4500'; ctx.lineWidth = 2;
    ctx.stroke();

    // Burbujas internas
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r * 0.2, cy + r * 0.2, r * 0.15, 0, Math.PI * 2); ctx.fill();

    // Ojos
    const eyeOffset = this.vx > 0 ? 2 : -2;
    ctx.fillStyle = this.eyeColor;
    ctx.beginPath(); ctx.arc(cx - 4 + eyeOffset, cy - 1, r * 0.2, 0, Math.PI * 2); ctx.arc(cx + 4 + eyeOffset, cy - 1, r * 0.2, 0, Math.PI * 2); ctx.fill();

    // Boca (más grande = más sonrisa)
    ctx.strokeStyle = '#8b4500'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx + eyeOffset, cy + 2, r * 0.3, 0.2, Math.PI - 0.2); ctx.stroke();

    ctx.restore();

    for (const child of this.splitChildren) child.draw(ctx);
  }

  checkCollision(player) {
    // Revisar hijos primero
    for (const child of this.splitChildren) {
      const result = child.checkCollision(player);
      if (result) return result;
    }
    if (this.dead) return null;
    return super.checkCollision(player);
  }

  split() {
    if (this.size >= 3) return []; // Ya es el más pequeño
    const children = [];
    for (let i = 0; i < 2; i++) {
      const child = new SplitterEnemy(this.x + (i === 0 ? -10 : 10), this.y, this.size + 1);
      child.vx = (i === 0 ? -1 : 1) * Math.abs(this.vx) * 1.3;
      children.push(child);
    }
    this.splitChildren = children;
    this.dead = true; // El padre "muere" visualmente pero los hijos continúan
    return children;
  }
}

// --- FACTORY PARA NIVEL 2 ---
export function createAdvancedEnemies(levelMap, levelWidth, levelHeight) {
  const enemies = [];
  const GROUND_Y = (levelHeight - 2) * TILE;

  // Enemigos en suelo (más cantidad y variedad)
  const groundCount = 12 + Math.floor(Math.random() * 8);
  const types = ['jumper', 'tank', 'shooter', 'teleporter', 'splitter', 'goomba', 'fast', 'hunter'];

  for (let i = 0; i < groundCount; i++) {
    const tileX = 20 + Math.floor(Math.random() * (levelWidth - 30));
    const x = tileX * TILE;
    const type = types[Math.floor(Math.random() * types.length)];

    let enemy;
    switch (type) {
      case 'jumper': enemy = new JumperEnemy(x, GROUND_Y); break;
      case 'tank': enemy = new TankEnemy(x, GROUND_Y); break;
      case 'shooter': enemy = new ShooterEnemy(x, GROUND_Y); break;
      case 'teleporter': enemy = new TeleporterEnemy(x, GROUND_Y); break;
      case 'splitter': enemy = new SplitterEnemy(x, GROUND_Y); break;
      default: {
        // Fallback a enemigos básicos del nivel 1
        const { makeEnemy } = await import('./Enemy.js');
        enemy = makeEnemy(type, x, GROUND_Y);
      }
    }
    if (enemy) enemies.push(enemy);
  }

  // Enemigos en plataformas
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
  const platformCount = Math.max(2, Math.floor(platforms.length * 0.5));
  const selected = shuffled.slice(0, platformCount);
  const platformTypes = ['jumper', 'shooter', 'teleporter', 'fast'];

  selected.forEach(p => {
    const offsetX = 1 + Math.floor(Math.random() * (p.w - 2));
    const x = (p.x + offsetX) * TILE;
    const groundY = p.y * TILE;
    const type = platformTypes[Math.floor(Math.random() * platformTypes.length)];

    let enemy;
    switch (type) {
      case 'jumper': enemy = new JumperEnemy(x, groundY); break;
      case 'shooter': enemy = new ShooterEnemy(x, groundY); break;
      case 'teleporter': enemy = new TeleporterEnemy(x, groundY); break;
      default: {
        const { makeEnemy } = await import('./Enemy.js');
        enemy = makeEnemy(type, x, groundY, true);
      }
    }
    if (enemy) enemies.push(enemy);
  });

  return enemies;
}
