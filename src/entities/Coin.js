// ============================================================
// MONEDAS / ITEMS / PRISPAS — Generación dinámica por nivel
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

  // Genera monedas dinámicamente según el mapa del nivel
  static createForLevel(levelMap, levelWidth, levelHeight, isLevel2 = false) {
    const coins = [];
    const placed = new Set(); // evitar duplicados

    // 1. Colocar monedas sobre plataformas azules (tile === 2)
    for (let y = 0; y < levelHeight; y++) {
      for (let x = 0; x < levelWidth; x++) {
        if (levelMap[y][x] === 2) {
          // Verificar que hay espacio libre arriba de la plataforma
          if (y > 0 && levelMap[y - 1][x] === 0) {
            const key = `${x},${y - 1}`;
            if (!placed.has(key)) {
              coins.push(new Coin(x, y - 1, 'item'));
              placed.add(key);
            }
          }
        }
      }
    }

    // 2. Colocar monedas en "arcos" sobre huecos del suelo (saltos desafiantes)
    const groundY = levelHeight - 3;
    for (let x = 10; x < levelWidth - 10; x += 8 + Math.floor(Math.random() * 6)) {
      // Solo si hay hueco debajo
      if (levelMap[levelHeight - 1][x] === 0) {
        const key = `${x},${groundY - 3}`;
        if (!placed.has(key)) {
          coins.push(new Coin(x, groundY - 3, 'item'));
          placed.add(key);
        }
      }
    }

    // 3. Monedas en lugares altos (recompensa por exploración)
    for (let x = 15; x < levelWidth - 5; x += 20 + Math.floor(Math.random() * 15)) {
      for (let y = 3; y < 8; y++) {
        const key = `${x},${y}`;
        if (!placed.has(key) && levelMap[y][x] === 0) {
          // Verificar que no hay tile sólido encima
          let clear = true;
          for (let dy = y; dy < levelHeight - 2; dy++) {
            if (levelMap[dy][x] !== 0 && levelMap[dy][x] !== 5) {
              // Hay algo debajo, ok
              break;
            }
          }
          coins.push(new Coin(x, y, 'item'));
          placed.add(key);
          break; // solo una por sección
        }
      }
    }

    // 4. Prispas (3 especiales) — colocarlas en lugares difíciles de alcanzar
    const prispasCount = 3;
    const prispasPositions = [];

    // Encontrar plataformas altas y aisladas para prispas
    for (let y = 2; y < levelHeight - 5; y++) {
      for (let x = 10; x < levelWidth - 10; x++) {
        if (levelMap[y][x] === 2) {
          // Verificar si es una plataforma aislada (difícil)
          let isolated = true;
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0) continue;
            if (x + dx >= 0 && x + dx < levelWidth && levelMap[y][x + dx] === 2) {
              isolated = false;
              break;
            }
          }
          if (isolated && levelMap[y - 1][x] === 0) {
            prispasPositions.push({ x, y: y - 1 });
          }
        }
      }
    }

    // Si no hay suficientes plataformas aisladas, usar posiciones altas aleatorias
    while (prispasPositions.length < prispasCount) {
      const px = 20 + Math.floor(Math.random() * (levelWidth - 40));
      const py = 2 + Math.floor(Math.random() * 5);
      if (levelMap[py][px] === 0) {
        prispasPositions.push({ x: px, y: py });
      }
    }

    // Barajar y seleccionar 3
    const shuffled = prispasPositions.sort(() => Math.random() - 0.5).slice(0, prispasCount);
    shuffled.forEach(pos => {
      const key = `${pos.x},${pos.y}`;
      // Reemplazar moneda existente o añadir nueva
      const existing = coins.find(c => Math.floor(c.x / TILE) === pos.x && Math.floor(c.y / TILE) === pos.y);
      if (existing) {
        existing.type = 'prispas';
      } else {
        coins.push(new Coin(pos.x, pos.y, 'prispas'));
        placed.add(key);
      }
    });

    // 5. Si el nivel 1 quiere mantener sus posiciones clásicas, usar fallback
    if (!isLevel2 && coins.length < 20) {
      // Fallback: posiciones clásicas del nivel 1
      const classicPos = [
        [4,12],[5,12],[6,12],[11,11],[12,11],[17,10],[18,7],[29,9],[30,9],[31,9],
        [36,10],[37,10],[41,9],[42,9],[51,8],[52,8],[53,8],[58,10],[59,10],[63,8],
        [64,3],[69,10],[73,7],[74,7],[75,7],[79,9],[80,9],[84,8],[85,8],[89,10],
        [93,6],[94,6],[95,6],[99,9],[100,9],[104,7],[105,7],[109,9],[113,6],[114,6],
        [115,6],[6,9],[7,9],[13,8],[19,7],[26,8],[27,8],[33,6],[34,6],[39,7],
        [40,7],[45,5],[46,5],[47,5],[53,7],[54,7],[59,4],[60,4],[65,6],[66,6],
        [71,4],[72,4]
      ];
      const prispasIndices = [6, 20, 40];
      classicPos.forEach(([cx, cy], index) => {
        const key = `${cx},${cy}`;
        if (!placed.has(key) && cx < levelWidth && cy < levelHeight) {
          coins.push(new Coin(cx, cy, prispasIndices.includes(index) ? 'prispas' : 'item'));
          placed.add(key);
        }
      });
    }

    return coins;
  }

  // Método legacy para compatibilidad
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
