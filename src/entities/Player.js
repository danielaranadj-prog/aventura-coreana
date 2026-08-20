// ============================================================
// JUGADOR
// ============================================================

import { GRAVITY, JUMP_FORCE, SPEED, RUN_SPEED, FRICTION, TILE } from '../config.js';

export class Player {
  constructor(x, y, levelHeight) {
    this.x = x;
    this.y = y;
    this.w = 28;
    this.h = 48;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.facing = 1;
    this.invincible = 0;
    this.celebrating = false;
    this.celebrateTimer = 0;
    // groundY se calcula dinámicamente según la altura del nivel
    this.groundY = (levelHeight - 2) * TILE;
  }

  update(input, level, dt, audioManager, particleSystem) {
    if (this.celebrating) {
      this.celebrateTimer -= dt * 60;
      if (this.celebrateTimer <= 0) this.celebrating = false;
      return;
    }

    const isRunning = input.isDown('ShiftLeft') || input.isDown('ShiftRight') || input.isDown('KeyX');
    const maxSpeed = isRunning ? RUN_SPEED : SPEED;
    const accel = isRunning ? 1.8 : 0.8;
    const jumpForce = isRunning ? JUMP_FORCE * 1.15 : JUMP_FORCE;

    if (input.isDown('ArrowLeft') || input.isDown('KeyA')) { this.vx -= accel; this.facing = -1; }
    if (input.isDown('ArrowRight') || input.isDown('KeyD')) { this.vx += accel; this.facing = 1; }

    this.vx *= FRICTION;
    this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

    if ((input.isDown('ArrowUp') || input.isDown('KeyW') || input.isDown('Space')) && this.onGround) {
      this.vy = jumpForce;
      this.onGround = false;
      particleSystem.spawn(this.x + this.w / 2, this.y + this.h, '#ffd700', 5);
      audioManager.play('jump');
    }

    this.vy += GRAVITY;

    // Movimiento horizontal con colisión
    this.x += this.vx;
    if (this.x < 0) { this.x = 0; this.vx = 0; }
    if (this.x > level.width * TILE - this.w) { this.x = level.width * TILE - this.w; }

    this._resolveHorizontalCollision(level);

    // Movimiento vertical con colisión
    this.y += this.vy;
    this.onGround = false;
    const points = this._resolveVerticalCollision(level, audioManager, particleSystem);
    if (points === 'win') return 'win';
    if (typeof points === 'number') return points;

    // Muerte por caída
    const tileBelowLeft = level.getTile(this.x + 4, this.y + this.h + 2);
    const tileBelowRight = level.getTile(this.x + this.w - 4, this.y + this.h + 2);
    const isOverGap = (tileBelowLeft === 0 && tileBelowRight === 0 && this.y >= this.groundY - 10);

    if (this.y > level.height * TILE + 20 || isOverGap) {
      if (this.invincible <= 0) {
        return 'fell';
      } else {
        // Reposicionar de manera segura
        this.x = 64;
        this.y = this.groundY - this.h + 2;
        this.vy = 0;
        this.vx = 0;
        this.onGround = true;
      }
    }

    if (this.invincible > 0) this.invincible -= dt * 60;

    return null;
  }

  _resolveHorizontalCollision(level) {
    const left = Math.floor(this.x / TILE);
    const right = Math.floor((this.x + this.w - 1) / TILE);
    const top = Math.floor(this.y / TILE);
    const bottom = Math.floor((this.y + this.h - 1) / TILE);

    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        if (level.isSolid(level.getTileAt(tx, ty))) {
          if (this.vx > 0) { this.x = tx * TILE - this.w - 0.1; this.vx = 0; }
          else if (this.vx < 0) { this.x = (tx + 1) * TILE + 0.1; this.vx = 0; }
        }
      }
    }
  }

  _resolveVerticalCollision(level, audioManager, particleSystem) {
    const left = Math.floor(this.x / TILE);
    const right = Math.floor((this.x + this.w - 1) / TILE);
    const top = Math.floor(this.y / TILE);
    const bottom = Math.floor((this.y + this.h - 1) / TILE);

    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        const tile = level.getTileAt(tx, ty);
        if (level.isSolid(tile)) {
          if (this.vy > 0) {
            this.y = ty * TILE - this.h - 0.1;
            this.vy = 0;
            this.onGround = true;
          } else if (this.vy < 0) {
            this.y = (ty + 1) * TILE + 0.1;
            this.vy = 0;
            if (tile === 3) {
              level.setTile(tx, ty, 0);
              particleSystem.spawn(tx * TILE + 16, ty * TILE + 16, '#ffd700', 10);
              audioManager.play('stomp');
              return 100;
            }
          }
        }
        if (tile === 5) return 'win';
      }
    }
    return 0;
  }

  die(audioManager, particleSystem) {
    if (this.invincible > 0) return false;
    particleSystem.spawn(this.x + this.w / 2, this.y + this.h / 2, '#ff0040', 20);
    audioManager.play('death');
    return true;
  }

  respawn(safeX, safeY, fellInGap = false) {
    this.invincible = 300;
    this.vy = fellInGap ? 0 : JUMP_FORCE;
    this.x = safeX;
    this.y = fellInGap ? safeY : 200;
    this.vx = 0;
    this.onGround = fellInGap;
  }

  startCelebration() {
    this.celebrating = true;
    this.celebrateTimer = 180;
  }

  getBounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  draw(ctx, animator) {
    if (this.invincible <= 0 || Math.floor(this.invincible / 4) % 2 === 0) {
      animator.draw(ctx, this.x, this.y, this.facing, this.w, this.h);
    }
  }
}
