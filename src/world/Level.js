// ============================================================
// NIVEL — MAPA Y COLISIONES
// ============================================================

import { TILE, TILE_MAP, LEVEL_WIDTH, LEVEL_HEIGHT } from '../config.js';

export class Level {
  constructor(map) {
    this.map = map;
    this.width = map[0].length;
    this.height = map.length;
  }

  getTile(x, y) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    return this.getTileAt(tx, ty);
  }

  getTileAt(tx, ty) {
    if (ty < 0 || ty >= this.height || tx < 0 || tx >= this.width) return 0;
    return this.map[ty][tx];
  }

  setTile(tx, ty, value) {
    if (ty >= 0 && ty < this.height && tx >= 0 && tx < this.width) {
      this.map[ty][tx] = value;
    }
  }

  isSolid(tile) {
    return tile === 1 || tile === 2 || tile === 3 || tile === 4;
  }

  static async loadFromJSON(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('No se encontró el archivo');
      const data = await res.json();
      const map = Level._parseJSON(data);
      return new Level(map);
    } catch (e) {
      console.warn('No se pudo cargar el nivel JSON:', e.message);
      return Level.generate();
    }
  }

  static _parseJSON(data) {
    const h = data.height || LEVEL_HEIGHT;
    const w = data.width || LEVEL_WIDTH;
    const map = Array.from({ length: h }, () => Array(w).fill(0));

    if (data.layers) {
      data.layers.forEach(layer => {
        if (layer.tiles) {
          layer.tiles.forEach(tile => {
            const gameId = TILE_MAP[tile.id];
            if (gameId !== undefined && tile.y < h && tile.x < w) {
              map[tile.y][tile.x] = gameId;
            }
          });
        }
        if (layer.data && layer.width) {
          for (let i = 0; i < layer.data.length; i++) {
            const tileId = layer.data[i];
            if (tileId > 0) {
              const tx = i % layer.width;
              const ty = Math.floor(i / layer.width);
              const gameId = TILE_MAP[tileId - 1];
              if (gameId !== undefined && ty < h && tx < w) {
                map[ty][tx] = gameId;
              }
            }
          }
        }
      });
    }
    return map;
  }

  static generate() {
    const map = Array.from({ length: LEVEL_HEIGHT }, () => Array(LEVEL_WIDTH).fill(0));
    const gaps = [];
    const gapCount = 4;
    const safeStart = 10;
    const safeEnd = LEVEL_WIDTH - 10;

    for (let i = 0; i < gapCount; i++) {
      let attempts = 0, placed = false;
      while (attempts < 50 && !placed) {
        const gx = safeStart + Math.floor(Math.random() * (safeEnd - safeStart - 4));
        const gw = 2 + Math.floor(Math.random() * 3);
        let overlaps = false;
        for (const g of gaps) {
          if (gx < g.x + g.w + 2 && gx + gw + 2 > g.x) { overlaps = true; break; }
        }
        if (!overlaps) { gaps.push({ x: gx, w: gw }); placed = true; }
        attempts++;
      }
    }

    for (let x = 0; x < LEVEL_WIDTH; x++) {
      let inGap = false;
      for (const g of gaps) {
        if (x >= g.x && x < g.x + g.w) { inGap = true; break; }
      }
      if (!inGap) {
        map[LEVEL_HEIGHT - 1][x] = 1;
        map[LEVEL_HEIGHT - 2][x] = 1;
      }
    }

    const plat = (x, y, w, t = 2) => {
      for (let i = 0; i < w; i++) if (x + i < LEVEL_WIDTH) map[y][x + i] = t;
    };

    plat(3, 14, 4);   plat(10, 13, 3);  plat(16, 11, 2, 3); plat(22, 13, 3);
    plat(28, 11, 4);  plat(35, 11, 2, 3); plat(40, 11, 3);  plat(46, 13, 2);
    plat(50, 10, 4);  plat(57, 11, 2, 3); plat(62, 10, 3);  plat(68, 12, 2);
    plat(72, 9, 4);   plat(78, 10, 2, 3); plat(83, 10, 3);  plat(88, 12, 2);
    plat(92, 8, 4);   plat(98, 10, 2, 3); plat(103, 9, 3);  plat(108, 11, 2);
    plat(112, 8, 4);  plat(5, 11, 3);    plat(12, 10, 2);  plat(18, 9, 3);
    plat(25, 10, 2);  plat(32, 8, 4);   plat(38, 8, 2, 3); plat(44, 7, 3);
    plat(52, 9, 2);   plat(58, 6, 4);   plat(64, 7, 2, 3); plat(70, 6, 3);
    plat(55, 16, 3);  plat(58, 15, 2);  plat(60, 14, 2);
    plat(105, 16, 3); plat(108, 15, 2); plat(110, 14, 2);

    map[LEVEL_HEIGHT - 3][LEVEL_WIDTH - 5] = 5;
    map[LEVEL_HEIGHT - 3][LEVEL_WIDTH - 4] = 5;

    return new Level(map);
  }
}
