// ============================================================
// ANIMATOR — Sistema de animación de sprites
// ============================================================

export class Animator {
  constructor(loader, selectedCharacter = 'tomy') {
    this.loader = loader;
    this.selectedCharacter = selectedCharacter;
    this.currentAnim = this.resolveAnimName('ready');
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.facing = 1;
    this.isStatic = false;
    this.staticFrame = 0;
  }

  setCharacter(name) {
    this.selectedCharacter = name;
  }

  resolveAnimName(name) {
    if (this.selectedCharacter === 'tomy') return name;
    const map = { 'run': 'arana-run', 'celebrate': 'arana-celebrate', 'ready': 'arana-ready' };
    return map[name] || name;
  }

  setAnimation(name, startFrame = 0) {
    const resolved = this.resolveAnimName(name);
    if (this.currentAnim !== resolved || this.isStatic) {
      this.currentAnim = resolved;
      this.currentFrame = startFrame;
      this.frameTimer = 0;
      this.isStatic = false;
    }
  }

  setStaticFrame(name, frameIndex) {
    const resolved = this.resolveAnimName(name);
    if (this.currentAnim !== resolved || !this.isStatic || this.staticFrame !== frameIndex) {
      this.currentAnim = resolved;
      this.staticFrame = frameIndex;
      this.currentFrame = frameIndex;
      this.frameTimer = 0;
      this.isStatic = true;
    }
  }

  update() {
    if (this.isStatic) return;
    const spriteData = this.loader.get(this.currentAnim);
    if (!spriteData) return;
    this.frameTimer++;
    if (this.frameTimer >= spriteData.speed) {
      this.frameTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % spriteData.frames;
    }
  }

  draw(ctx, x, y, facing, playerW, playerH) {
    const spriteData = this.loader.get(this.currentAnim);

    // DEBUG: log si no encuentra el sprite
    if (!spriteData) {
      console.warn('[Animator] No sprite data for animation:', this.currentAnim, '| loader keys:', Object.keys(this.loader.images || {}));
      // Fallback visual: rectángulo magenta para que el usuario vea que el personaje existe
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(x, y, playerW, playerH);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, playerW, playerH);
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText('?', x + 10, y + 20);
      return;
    }

    const img = spriteData.image;
    if (!img || !img.complete) {
      console.warn('[Animator] Image not ready for:', this.currentAnim);
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(x, y, playerW, playerH);
      return;
    }

    const fw = spriteData.frameWidth;
    const fh = spriteData.frameHeight;
    const cols = spriteData.cols;
    const scale = spriteData.scale || 1;
    const offX = spriteData.offsetX || 0;
    const offY = spriteData.offsetY || 0;

    const col = this.currentFrame % cols;
    const row = Math.floor(this.currentFrame / cols);

    const bleed = 0.5;
    const sx = col * fw + bleed;
    const sy = row * fh + bleed;
    const sfw = Math.max(1, fw - bleed * 2);
    const sfh = Math.max(1, fh - bleed * 2);

    const dw = sfw * scale;
    const dh = sfh * scale;

    ctx.save();
    ctx.translate(x + playerW / 2 + offX, y + playerH + offY);

    if (facing < 0) {
      ctx.scale(-1, 1);
      ctx.translate(-dw, 0);
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, sy, sfw, sfh, 0, 0, dw, dh);
    ctx.imageSmoothingEnabled = true;

    ctx.restore();
  }
}
