// ============================================================
// GESTIÓN DE PANTALLAS
// ============================================================

export class Screens {
  constructor(assetManager, audioManager) {
    this.assetManager = assetManager;
    this.audioManager = audioManager;
    this.rafId = null;
    this.menuPreviewFrame = 0;
    this.menuPreviewTimer = 0;
    this.aranaPreviewFrame = 0;
    this.winPreviewFrame = 0;
    this.winPreviewTimer = 0;
    this.fireworkSystem = null;
  }

  hideAll() {
    ['loading','start-screen','level-loading','gameover-screen','win-screen'].forEach(id => {
      document.getElementById(id)?.classList.add('hidden');
    });
  }

  showLoading() {
    this.hideAll();
    document.getElementById('loading').classList.remove('hidden');
  }

  updateLoading(loaded, total) {
    const pct = Math.floor((loaded / total) * 100);
    const fill = document.getElementById('loading-fill');
    const percent = document.getElementById('loading-percent');
    if (fill) fill.style.width = pct + '%';
    if (percent) percent.textContent = pct + '%';
  }

  showMenu() {
    this.hideAll();
    document.getElementById('start-screen').classList.remove('hidden');
    this.audioManager.playMusic('selectPlayer');
    this._startMenuPreview();
  }

  _startMenuPreview() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    const loop = () => {
      this.menuPreviewTimer++;
      if (this.menuPreviewTimer >= 6) {
        this.menuPreviewTimer = 0;
        const tomyData = this.assetManager.get('ready');
        const aranaData = this.assetManager.get('arana-ready');
        if (tomyData) this.menuPreviewFrame = (this.menuPreviewFrame + 1) % tomyData.frames;
        if (aranaData) this.aranaPreviewFrame = (this.aranaPreviewFrame + 1) % aranaData.frames;
        this._drawTomyPreview();
        this._drawAranaPreview();
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stopMenuPreview() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  _drawTomyPreview() {
    const preview = document.getElementById('character-preview');
    const spriteData = this.assetManager.get('ready');
    if (!preview || !spriteData) return;
    const ctx = preview.getContext('2d');
    const col = this.menuPreviewFrame % spriteData.cols;
    const row = Math.floor(this.menuPreviewFrame / spriteData.cols);
    ctx.clearRect(0, 0, preview.width, preview.height);

    // Escalar para llenar el canvas de 180x240
    const fw = spriteData.frameWidth;
    const fh = spriteData.frameHeight;
    const aspect = fw / fh;
    let h = preview.height * 0.9;
    let w = h * aspect;
    if (w > preview.width * 0.9) {
      w = preview.width * 0.9;
      h = w / aspect;
    }
    const x = (preview.width - w) / 2;
    const y = (preview.height - h) / 2;

    ctx.drawImage(spriteData.image, col * fw, row * fh, fw, fh, x, y, w, h);
  }

  _drawAranaPreview() {
    const preview = document.getElementById('arana-preview');
    const spriteData = this.assetManager.get('arana-ready');
    if (!preview || !spriteData) return;
    const ctx = preview.getContext('2d');
    const col = this.aranaPreviewFrame % spriteData.cols;
    const row = Math.floor(this.aranaPreviewFrame / spriteData.cols);
    ctx.clearRect(0, 0, preview.width, preview.height);

    const fw = spriteData.frameWidth;
    const fh = spriteData.frameHeight;
    const aspect = fw / fh;
    let h = preview.height * 0.9;
    let w = h * aspect;
    if (w > preview.width * 0.9) {
      w = preview.width * 0.9;
      h = w / aspect;
    }
    const x = (preview.width - w) / 2;
    const y = (preview.height - h) / 2;

    ctx.drawImage(spriteData.image, col * fw, row * fh, fw, fh, x, y, w, h);
  }

  showLevelLoading(level = 1) {
    this.hideAll();
    const el = document.getElementById('level-loading');
    const title = el?.querySelector('.level-loading-title');
    if (title) title.textContent = 'LEVEL ' + level;
    el?.classList.remove('hidden');
    const fill = document.getElementById('level-loading-fill');
    if (fill) fill.style.width = '0%';
  }

  updateLevelLoading(progress) {
    const fill = document.getElementById('level-loading-fill');
    if (fill) fill.style.width = progress + '%';
  }

  showGameOver(score) {
    this.hideAll();
    document.getElementById('gameover-screen').classList.remove('hidden');
    const fs = document.getElementById('final-score');
    if (fs) fs.textContent = score;
    this.audioManager.stopAll();
    this.audioManager.play('fail');
  }

  showWin(score, selectedCharacter, fireworkSystem) {
    this.hideAll();
    document.getElementById('win-screen').classList.remove('hidden');
    const ws = document.getElementById('win-score');
    if (ws) ws.textContent = score;
    this.audioManager.stopAll();
    this.audioManager.playMusic('victory');
    this.fireworkSystem = fireworkSystem;
    this.winPreviewFrame = 0;
    this.winPreviewTimer = 0;
    this._startWinPreview(selectedCharacter);
    for (let i = 0; i < 3; i++) {
      setTimeout(() => fireworkSystem.spawn(), i * 400);
    }
  }

  _startWinPreview(selectedCharacter) {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    const loop = () => {
      this.winPreviewTimer++;
      if (this.winPreviewTimer >= 5) {
        this.winPreviewTimer = 0;
        const animName = selectedCharacter === 'tomy' ? 'celebrate' : 'arana-celebrate';
        const celData = this.assetManager.get(animName);
        if (celData) {
          this.winPreviewFrame = (this.winPreviewFrame + 1) % celData.frames;
          this._drawWinCharacter(selectedCharacter);
        }
      }
      if (this.winPreviewTimer === 0 && Math.random() < 0.15 && this.fireworkSystem) {
        this.fireworkSystem.spawn();
      }
      if (this.fireworkSystem) {
        this.fireworkSystem.update();
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  _drawWinCharacter(selectedCharacter) {
    const preview = document.getElementById('win-character-preview');
    const animName = selectedCharacter === 'tomy' ? 'celebrate' : 'arana-celebrate';
    const spriteData = this.assetManager.get(animName);
    if (!preview || !spriteData) return;
    const ctx = preview.getContext('2d');
    const col = this.winPreviewFrame % spriteData.cols;
    const row = Math.floor(this.winPreviewFrame / spriteData.cols);
    ctx.clearRect(0, 0, preview.width, preview.height);
    const fw = spriteData.frameWidth;
    const fh = spriteData.frameHeight;
    const aspect = fw / fh;
    let rw = preview.width * 0.8;
    let rh = rw / aspect;
    if (rh > preview.height * 0.9) { rh = preview.height * 0.9; rw = rh * aspect; }
    const rx = (preview.width - rw) / 2;
    const ry = (preview.height - rh) / 2;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spriteData.image, col * fw, row * fh, fw, fh, rx, ry, rw, rh);
    ctx.imageSmoothingEnabled = true;
  }

  stopWinPreview() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
}
