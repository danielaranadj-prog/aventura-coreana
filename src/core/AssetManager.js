// ============================================================
// CARGADOR DE SPRITES
// ============================================================

export class AssetManager {
  constructor(config) {
    this.config = config;
    this.images = {};
    this.loaded = 0;
    this.total = Object.keys(config.files).length;
    this.onProgress = null;
    this.onComplete = null;
  }

  load() {
    const promises = [];
    for (const [name, fileInfo] of Object.entries(this.config.files)) {
      const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.images[name] = {
            image: img,
            frames: fileInfo.frames,
            speed: fileInfo.speed,
            cols: fileInfo.cols,
            rows: fileInfo.rows,
            frameWidth: fileInfo.frameWidth,
            frameHeight: fileInfo.frameHeight,
            scale: fileInfo.scale,
            offsetX: fileInfo.offsetX,
            offsetY: fileInfo.offsetY,
          };
          this.loaded++;
          if (this.onProgress) this.onProgress(this.loaded, this.total);
          resolve();
        };
        img.onerror = () => reject(new Error(`No se pudo cargar: ${fileInfo.src}`));
        img.src = fileInfo.src;
      });
      promises.push(promise);
    }

    return Promise.all(promises)
      .then(() => {
        if (this.onComplete) this.onComplete();
      })
      .catch(err => {
        console.error('Error en carga:', err);
        if (this.onComplete) this.onComplete();
      });
  }

  get(name) { return this.images[name]; }
}

// ============================================================
// SISTEMA DE ANIMACIÓN
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
    if (!spriteData) return;

    const img = spriteData.image;
    const fw = spriteData.frameWidth;
    const fh = spriteData.frameHeight;
    const cols = spriteData.cols;
    const scale = spriteData.scale;
    const offX = spriteData.offsetX;
    const offY = spriteData.offsetY;

    const col = this.currentFrame % cols;
    const row = Math.floor(this.currentFrame / cols);

    const bleed = 0.5;
    const sx = col * fw + bleed;
    const sy = row * fh + bleed;
    const sfw = fw - bleed * 2;
    const sfh = fh - bleed * 2;

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
