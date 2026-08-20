// ============================================================
// NIVEL 2 — INFIERNO COREANO (Doble de difícil)
// ============================================================

import { TILE, TILE_MAP } from '../config.js';

export const LEVEL2_WIDTH = 180;
export const LEVEL2_HEIGHT = 22;

export class Level2 {
  constructor() {
    this.map = this._generate();
    this.width = LEVEL2_WIDTH;
    this.height = LEVEL2_HEIGHT;
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

  _generate() {
    const map = Array.from({ length: LEVEL2_HEIGHT }, () => Array(LEVEL2_WIDTH).fill(0));
    const GROUND_Y = (LEVEL2_HEIGHT - 2) * TILE;

    // --- 1. SUELO CON MUCHOS HUECOS (8 huecos, más anchos) ---
    const gaps = [];
    const gapCount = 8;
    const safeStart = 8;
    const safeEnd = LEVEL2_WIDTH - 8;

    for (let i = 0; i < gapCount; i++) {
      let attempts = 0, placed = false;
      while (attempts < 100 && !placed) {
        const gx = safeStart + Math.floor(Math.random() * (safeEnd - safeStart - 6));
        const gw = 3 + Math.floor(Math.random() * 4); // 3-6 tiles de ancho (más peligrosos)
        let overlaps = false;
        for (const g of gaps) {
          if (gx < g.x + g.w + 3 && gx + gw + 3 > g.x) { overlaps = true; break; }
        }
        if (!overlaps) { gaps.push({ x: gx, w: gw }); placed = true; }
        attempts++;
      }
    }

    // Dibujar suelo respetando huecos
    for (let x = 0; x < LEVEL2_WIDTH; x++) {
      let inGap = false;
      for (const g of gaps) {
        if (x >= g.x && x < g.x + g.w) { inGap = true; break; }
      }
      if (!inGap) {
        map[LEVEL2_HEIGHT - 1][x] = 1;
        map[LEVEL2_HEIGHT - 2][x] = 1;
      }
    }

    // --- 2. PLATAFORMAS AZULES MÁS COMPLEJAS ---
    const plat = (x, y, w, t = 2) => {
      for (let i = 0; i < w; i++) if (x + i < LEVEL2_WIDTH) map[y][x + i] = t;
    };

    // Sección 1: Inicio más desafiante
    plat(5, 15, 3); plat(12, 14, 2); plat(18, 12, 3); plat(25, 13, 2, 3);
    plat(30, 10, 4); plat(38, 11, 2, 3); plat(44, 9, 3); plat(50, 12, 2);
    plat(55, 8, 4); plat(62, 9, 2, 3); plat(68, 8, 3); plat(74, 10, 2);
    plat(78, 7, 4); plat(85, 8, 2, 3); plat(90, 7, 3); plat(96, 9, 2);
    plat(100, 6, 4); plat(107, 7, 2, 3); plat(112, 6, 3); plat(118, 8, 2);
    plat(122, 5, 4); plat(129, 6, 2, 3); plat(134, 5, 3); plat(140, 7, 2);
    plat(144, 4, 4); plat(151, 5, 2, 3); plat(156, 4, 3); plat(162, 6, 2);
    plat(166, 3, 4); plat(173, 4, 2, 3);

    // Plataformas flotantes aisladas (saltos precisos)
    plat(20, 7, 1); plat(45, 5, 1); plat(70, 4, 1); plat(95, 3, 1);
    plat(120, 2, 1); plat(145, 2, 1); plat(160, 3, 1);

    // Escaleras de rescate (menos que en nivel 1)
    plat(80, 16, 2); plat(82, 15, 2); plat(84, 14, 2);
    plat(140, 16, 2); plat(142, 15, 2); plat(144, 14, 2);

    // --- 3. BLOQUES DE MONEDA DIFÍCILES DE ALCANZAR ---
    plat(15, 8, 1, 3); plat(35, 5, 1, 3); plat(60, 4, 1, 3);
    plat(85, 3, 1, 3); plat(110, 2, 1, 3); plat(135, 2, 1, 3);
    plat(155, 3, 1, 3); plat(170, 4, 1, 3);

    // --- 4. TUBOS (obstáculos verticales) ---
    plat(40, LEVEL2_HEIGHT - 4, 2, 4); plat(90, LEVEL2_HEIGHT - 4, 2, 4);
    plat(130, LEVEL2_HEIGHT - 4, 2, 4); plat(165, LEVEL2_HEIGHT - 4, 2, 4);

    // --- 5. ESTRUCTURA FINAL (más alta y defendida) ---
    const finalX = LEVEL2_WIDTH - 8;
    for (let fy = LEVEL2_HEIGHT - 3; fy >= LEVEL2_HEIGHT - 8; fy--) {
      const width = 2 + (LEVEL2_HEIGHT - 3 - fy);
      const startX = finalX - Math.floor(width / 2);
      for (let fx = 0; fx < width; fx++) {
        if (startX + fx < LEVEL2_WIDTH) map[fy][startX + fx] = 5;
      }
    }
    // Bandera en la cúspide
    map[LEVEL2_HEIGHT - 9][finalX] = 5;

    return map;
  }
}
