// ============================================================
// CÁMARA
// ============================================================

export class Camera {
  constructor(canvasWidth, levelWidth, tileSize) {
    this.x = 0;
    this.canvasWidth = canvasWidth;
    this.levelWidth = levelWidth;
    this.tileSize = tileSize;
  }

  update(targetX) {
    const target = targetX - this.canvasWidth / 3;
    this.x += (target - this.x) * 0.1;
    const maxX = this.levelWidth * this.tileSize - this.canvasWidth;
    this.x = Math.max(0, Math.min(this.x, maxX));
  }

  apply(ctx) {
    ctx.save();
    ctx.translate(-Math.floor(this.x), 0);
  }

  restore(ctx) {
    ctx.restore();
  }

  getStartCol() {
    return Math.floor(this.x / this.tileSize);
  }

  getEndCol() {
    return this.getStartCol() + Math.ceil(this.canvasWidth / this.tileSize) + 1;
  }
}
