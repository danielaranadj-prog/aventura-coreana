// ============================================================
// MONEDAS / ITEMS / PRISPAS
// ============================================================

import { TILE } from '../config.js';

export class Coin {
  constructor(cx, cy, type = 'item') {
    this.x = cx * TILE + 8;
    this.y = cy * TILE + 8;
    this.w = 16;
    this.h = 16;
    this.collected = false;
    this.bob = Math.random() * Math.PI * 2;
    this.type = type;
  }

  update(dt) {
    if (this.collected) return;
    this.bob += 0.08;
  }

  getBounds() {
    const bobY = Math.sin(this.bob) * 4;
    return { x: this.x, y: this.y + bobY, w: this.w, h: this.h };
  }

  draw(ctx, assetManager) {
    if (this.collected) return;
    const bobY = Math.sin(this.bob) * 4;
    if (this.type === 'prispas') {
      const prispas = assetManager.get('prispas');
      if (prispas) ctx.drawImage(prispas.image, this.x - 1, this.y + 2 + bobY, 18, 28);
    } else {
      const item = assetManager.get('item');
      if (item) {
        const pulse = 1 + Math.sin(this.bob * 0.7) * 0.12;
        const size = 18 * pulse;
        const offset = (18 - size) / 2;
        ctx.save();
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 8 + Math.sin(this.bob) * 4;
        ctx.drawImage(item.image, this.x + offset, this.y + offset + bobY, size, size);
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }
  }

  static createAll() {
    const pos = [
      [4,12],[5,12],[6,12],[11,11],[12,11],[17,10],[18,7],[29,9],[30,9],[31,9],
      [36,10],[37,10],[41,9],[42,9],[51,8],[52,8],[53,8],[58,10],[59,10],[63,8],
      [64,3],[69,10],[73,7],[74,7],[75,7],[79,9],[80,9],[84,8],[85,8],[89,10],
      [93,6],[94,6],[95,6],[99,9],[100,9],[104,7],[105,7],[109,9],[113,6],[114,6],
      [115,6],[6,9],[7,9],[13,8],[19,7],[26,8],[27,8],[33,6],[34,6],[39,7],
      [40,7],[45,5],[46,5],[47,5],[53,7],[54,7],[59,4],[60,4],[65,6],[66,6],
      [71,4],[72,4]
    ];
    const prispasIndices = [6, 20, 40];
    return pos.map(([cx, cy], index) => new Coin(cx, cy, prispasIndices.includes(index) ? 'prispas' : 'item'));
  }
}
