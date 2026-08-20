// ============================================================
// HUD — UI SUPERIOR
// ============================================================

export class HUD {
  constructor() {
    this.scoreEl = document.getElementById('score');
    this.livesEl = document.getElementById('lives');
    this.timeEl = document.getElementById('time');
    this.menuBtn = document.getElementById('menu-button');
  }

  update(score, lives, timeLeft) {
    if (this.scoreEl) this.scoreEl.textContent = score;
    if (this.livesEl) this.livesEl.textContent = lives;
    if (this.timeEl) this.timeEl.textContent = timeLeft;
  }

  show() {
    document.getElementById('ui-overlay').classList.remove('hidden');
    if (this.menuBtn) this.menuBtn.classList.remove('hidden');
  }

  hide() {
    document.getElementById('ui-overlay').classList.add('hidden');
    if (this.menuBtn) this.menuBtn.classList.add('hidden');
  }

  showMobileControls() {
    const mc = document.getElementById('mobile-controls');
    mc.classList.remove('hidden');
    mc.style.display = 'flex';
    document.getElementById('game-wrapper').classList.add('mobile-mode');
  }

  hideMobileControls() {
    const mc = document.getElementById('mobile-controls');
    mc.classList.add('hidden');
    mc.style.display = 'none';
    document.getElementById('game-wrapper').classList.remove('mobile-mode');
  }
}
