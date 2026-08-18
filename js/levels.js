// ============================================================
// SISTEMA DE NIVELES — Nivel 1 (Nebulosa) + Nivel 2 (Fábrica)
// ============================================================
let levelFromJSON = false;
let levelMap = [];
let enemies = [];
let coins = [];

// Zonas de peligro para el nivel 2 (ácido, prensas, etc.)
let hazardZones = [];
// Plataformas móviles
let movingPlatforms = [];

async function loadLevelFromJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('No se encontró el archivo');
    const data = await res.json();
    const map = [];
    const h = data.height || LEVEL_HEIGHT;
    const w = data.width || LEVEL_WIDTH;
    for (let y = 0; y < h; y++) {
      map[y] = [];
      for (let x = 0; x < w; x++) map[y][x] = 0;
    }
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
    levelFromJSON = true;
    return map;
  } catch (e) {
    console.warn('No se pudo cargar el nivel JSON:', e.message);
    console.warn('Usando nivel generado por código.');
    levelFromJSON = false;
    return generateLevel();
  }
}

// ============================================================
// NIVEL 1 — NEBULOSA (original)
// ============================================================
function generateLevel() {
  currentLevelTheme = 'nebula';
  const map = [];
  for (let y = 0; y < LEVEL_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < LEVEL_WIDTH; x++) map[y][x] = 0;
  }

  const gaps = [];
  const gapCount = 4;
  const safeStart = 10;
  const safeEnd = LEVEL_WIDTH - 10;

  for (let i = 0; i < gapCount; i++) {
    let attempts = 0;
    let placed = false;
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

  function plat(x, y, w, t = 2) {
    for (let i = 0; i < w; i++) if (x + i < LEVEL_WIDTH) map[y][x + i] = t;
  }

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

  hazardZones = [];
  movingPlatforms = [];
  return map;
}

// ============================================================
// NIVEL 2 — FÁBRICA DE PESADILLAS
// ============================================================
function generateFactoryLevel() {
  currentLevelTheme = 'factory';
  const map = [];
  for (let y = 0; y < LEVEL_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < LEVEL_WIDTH; x++) map[y][x] = 0;
  }

  // Suelo metálico con más huecos (fábrica deteriorada)
  const gaps = [];
  const gapCount = 6;
  const safeStart = 8;
  const safeEnd = LEVEL_WIDTH - 8;

  for (let i = 0; i < gapCount; i++) {
    let attempts = 0;
    let placed = false;
    while (attempts < 50 && !placed) {
      const gx = safeStart + Math.floor(Math.random() * (safeEnd - safeStart - 4));
      const gw = 2 + Math.floor(Math.random() * 4); // 2-5 tiles
      let overlaps = false;
      for (const g of gaps) {
        if (gx < g.x + g.w + 3 && gx + gw + 3 > g.x) { overlaps = true; break; }
      }
      if (!overlaps) { gaps.push({ x: gx, w: gw }); placed = true; }
      attempts++;
    }
  }

  // Dibujar suelo metálico respetando huecos (ácido abajo)
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

  function plat(x, y, w, t = 2) {
    for (let i = 0; i < w; i++) if (x + i < LEVEL_WIDTH) map[y][x + i] = t;
  }

  // Plataformas industriales (más verticales y retadoras)
  plat(4, 14, 3);   plat(9, 12, 2);   plat(14, 10, 3);  plat(20, 13, 2);
  plat(25, 9, 4);   plat(32, 11, 2, 3); plat(38, 8, 3);  plat(44, 12, 2);
  plat(48, 7, 4);   plat(55, 10, 2, 3); plat(60, 6, 3);  plat(66, 11, 2);
  plat(70, 5, 4);   plat(77, 9, 2, 3);  plat(82, 7, 3);  plat(88, 10, 2);
  plat(92, 4, 4);   plat(99, 8, 2, 3);  plat(104, 6, 3); plat(110, 9, 2);
  plat(114, 5, 4);  plat(7, 9, 2);    plat(12, 7, 3);   plat(18, 6, 2);
  plat(24, 8, 2);   plat(30, 5, 4);   plat(36, 6, 2, 3); plat(42, 4, 3);
  plat(50, 6, 2);   plat(56, 3, 4);   plat(62, 5, 2, 3); plat(68, 4, 3);

  // Tuberías verticales (obstáculos tipo tubo tile=4)
  plat(28, 15, 1, 4); plat(28, 14, 1, 4);
  plat(75, 15, 1, 4); plat(75, 14, 1, 4);
  plat(95, 15, 1, 4); plat(95, 14, 1, 4);

  // Escaleras de rescate
  plat(52, 16, 3);  plat(55, 15, 2);  plat(57, 14, 2);
  plat(100, 16, 3); plat(103, 15, 2); plat(105, 14, 2);

  // Meta: compuerta industrial
  map[LEVEL_HEIGHT - 3][LEVEL_WIDTH - 6] = 5;
  map[LEVEL_HEIGHT - 3][LEVEL_WIDTH - 5] = 5;
  map[LEVEL_HEIGHT - 3][LEVEL_WIDTH - 4] = 5;

  // Zonas de ácido (daño continuo)
  hazardZones = [];
  gaps.forEach(g => {
    hazardZones.push({
      x: g.x * TILE,
      y: (LEVEL_HEIGHT - 1) * TILE + 8,
      w: g.w * TILE,
      h: 40,
      type: 'acid',
      damage: 1,
    });
  });

  // Prensa: bloques que caen desde arriba (zonas de daño)
  const pressZones = [
    { x: 35 * TILE, y: 4 * TILE, w: TILE * 2, h: TILE * 3, type: 'press', speed: 2, timer: 0 },
    { x: 80 * TILE, y: 3 * TILE, w: TILE * 2, h: TILE * 3, type: 'press', speed: 1.5, timer: 60 },
    { x: 115 * TILE, y: 2 * TILE, w: TILE * 2, h: TILE * 4, type: 'press', speed: 2.5, timer: 30 },
  ];
  hazardZones = hazardZones.concat(pressZones);

  // Plataformas móviles (entidades separadas)
  movingPlatforms = [
    { x: 45 * TILE, y: 10 * TILE, w: 3 * TILE, h: TILE, vx: 1.2, minX: 43 * TILE, maxX: 50 * TILE },
    { x: 90 * TILE, y: 8 * TILE, w: 2 * TILE, h: TILE, vx: -1.5, minX: 87 * TILE, maxX: 95 * TILE },
    { x: 65 * TILE, y: 12 * TILE, w: 3 * TILE, h: TILE, vx: 1.0, minX: 62 * TILE, maxX: 72 * TILE },
  ];

  return map;
}

// ============================================================
// ENEMIGOS
// ============================================================
function createEnemies(theme = 'nebula') {
  const enemies = [];

  if (theme === 'factory') {
    // --- FÁBRICA: enemigos industriales ---
    const groundCount = 8 + Math.floor(Math.random() * 6);
    const factoryTypes = ['goomba', 'big', 'fast', 'spark', 'rusty', 'welder'];
    for (let i = 0; i < groundCount; i++) {
      const tileX = 15 + Math.floor(Math.random() * (LEVEL_WIDTH - 25));
      const x = tileX * TILE;
      let type;
      const rand = Math.random();
      if (rand < 0.20) type = 'goomba';
      else if (rand < 0.35) type = 'big';
      else if (rand < 0.50) type = 'fast';
      else if (rand < 0.70) type = 'spark';
      else if (rand < 0.85) type = 'rusty';
      else type = 'welder';
      const enemy = makeEnemy(type, x, GROUND_Y);
      if (enemy) enemies.push(enemy);
    }
  } else {
    // --- NEBULOSA: enemigos originales ---
    const groundCount = 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i < groundCount; i++) {
      const tileX = 15 + Math.floor(Math.random() * (LEVEL_WIDTH - 25));
      const x = tileX * TILE;
      let availableTypes = [];
      if (tileX < 40) availableTypes = ['goomba', 'fast'];
      else if (tileX < 80) availableTypes = ['goomba', 'big', 'fast', 'hunter'];
      else availableTypes = ['goomba', 'big', 'fast', 'fly', 'hunter'];
      let type;
      const rand = Math.random();
      if (rand < 0.40) type = 'goomba';
      else if (rand < 0.60) type = 'big';
      else if (rand < 0.80) type = 'fast';
      else if (rand < 0.90) type = 'fly';
      else type = 'hunter';
      if (!availableTypes.includes(type)) type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      const enemy = makeEnemy(type, x, GROUND_Y);
      if (enemy) enemies.push(enemy);
    }
  }

  // Plataformas azules (tile=2) — común a ambos niveles
  const platforms = [];
  for (let y = 0; y < LEVEL_HEIGHT; y++) {
    let startX = -1;
    for (let x = 0; x < LEVEL_WIDTH; x++) {
      if (levelMap[y][x] === 2) {
        if (startX === -1) startX = x;
      } else {
        if (startX !== -1) {
          const width = x - startX;
          if (width >= 2) platforms.push({ x: startX, y: y, w: width });
          startX = -1;
        }
      }
    }
    if (startX !== -1) {
      const width = LEVEL_WIDTH - startX;
      if (width >= 2) platforms.push({ x: startX, y: y, w: width });
    }
  }

  const shuffled = platforms.sort(() => Math.random() - 0.5);
  const platformCount = Math.max(1, Math.floor(platforms.length * (0.35 + Math.random() * 0.30)));
  const selectedPlatforms = shuffled.slice(0, platformCount);
  const platformTypes = theme === 'factory'
    ? ['goomba', 'fast', 'spark', 'welder']
    : ['goomba', 'fast', 'fly'];

  selectedPlatforms.forEach(p => {
    const offsetX = 1 + Math.floor(Math.random() * (p.w - 2));
    const x = (p.x + offsetX) * TILE;
    const groundY = p.y * TILE;
    const type = platformTypes[Math.floor(Math.random() * platformTypes.length)];
    const enemy = makeEnemy(type, x, groundY, true);
    if (enemy) enemies.push(enemy);
  });

  return enemies;
}

function makeEnemy(type, x, groundY, onPlatform = false) {
  let w, h, vx, vy = 0, startY;
  let canStomp = true;
  let color, eyeColor, hornColor;

  switch (type) {
    case 'goomba':
      w = 28; h = 28;
      vx = 0.5 + Math.random() * 0.4;
      startY = groundY - h;
      color = '#dc143c'; eyeColor = '#ffff00'; hornColor = '#8b0000';
      break;
    case 'big':
      w = 44; h = 44;
      vx = 0.3 + Math.random() * 0.2;
      startY = groundY - h;
      canStomp = false;
      color = '#8b0000'; eyeColor = '#ffcc00'; hornColor = '#4a0000';
      break;
    case 'fast':
      w = 22; h = 22;
      vx = 1.0 + Math.random() * 0.5;
      startY = groundY - h;
      color = '#00ffff'; eyeColor = '#ffffff'; hornColor = '#008b8b';
      break;
    case 'fly':
      w = 28; h = 28;
      vx = 0.5 + Math.random() * 0.3;
      startY = groundY - 80 - Math.random() * 60;
      color = '#ff69b4'; eyeColor = '#00ffff'; hornColor = '#ff00ff';
      break;
    case 'hunter':
      w = 28; h = 28;
      vx = 0.5 + Math.random() * 0.3;
      startY = groundY - h;
      color = '#9932cc'; eyeColor = '#ff00ff'; hornColor = '#4b0082';
      break;
    // === NUEVOS ENEMIGOS FÁBRICA ===
    case 'spark':
      w = 24; h = 24;
      vx = 1.2 + Math.random() * 1.0;
      startY = groundY - h;
      canStomp = true;
      color = '#ffaa00'; eyeColor = '#ffffff'; hornColor = '#ff4500';
      break;
    case 'rusty':
      w = 36; h = 40;
      vx = 0.4 + Math.random() * 0.2;
      startY = groundY - h;
      canStomp = true; // se le puede saltar encima
      color = '#5a5a5a'; eyeColor = '#ff4500'; hornColor = '#3a3a3a';
      break;
    case 'welder':
      w = 32; h = 32;
      vx = 0.8 + Math.random() * 0.4;
      startY = groundY - 60 - Math.random() * 40;
      canStomp = true;
      color = '#00ff88'; eyeColor = '#ffffff'; hornColor = '#008b45';
      break;
    default:
      return null;
  }

  if (Math.random() < 0.5) vx = -vx;

  return {
    x, y: startY, w, h, vx, vy,
    type, dead: false,
    canStomp,
    color, eyeColor, hornColor,
    baseY: startY,
    flyPhase: Math.random() * Math.PI * 2,
    huntSpeed: 1.5,
    originalVx: vx,
    onPlatform: onPlatform,
    platformLeft: onPlatform ? x - 40 : null,
    platformRight: onPlatform ? x + 40 : null,
    // Extras para fábrica
    shootTimer: type === 'welder' ? 60 + Math.random() * 60 : 0,
    projectiles: [],
    frontShield: type === 'rusty', // invulnerable por el frente
    shieldAngle: vx > 0 ? 0 : Math.PI,
  };
}

// ============================================================
// MONEDAS / ITEMS / PRISPAS
// ============================================================
function createCoins(theme = 'nebula') {
  const coins = [];
  let pos;
  if (theme === 'factory') {
    pos = [
      [5,13],[6,13],[7,13],[12,11],[13,11],[18,9],[19,6],[30,8],[31,8],[32,8],
      [37,10],[38,10],[42,7],[43,7],[51,6],[52,6],[53,6],[58,9],[59,9],[64,5],
      [65,2],[70,9],[74,6],[75,6],[76,6],[80,8],[81,8],[85,6],[86,6],[90,9],
      [94,5],[95,5],[96,5],[100,8],[101,8],[105,5],[106,5],[110,8],[115,5],[116,5],
      [117,5],[8,8],[9,8],[14,7],[20,6],[27,7],[28,7],[34,5],[35,5],[40,6],
      [41,6],[46,4],[47,4],[48,4],[54,6],[55,6],[60,3],[61,3],[66,5],[67,5],
      [72,3],[73,3]
    ];
  } else {
    pos = [
      [4,12],[5,12],[6,12],[11,11],[12,11],[17,10],[18,7],[29,9],[30,9],[31,9],
      [36,10],[37,10],[41,9],[42,9],[51,8],[52,8],[53,8],[58,10],[59,10],[63,8],
      [64,3],[69,10],[73,7],[74,7],[75,7],[79,9],[80,9],[84,8],[85,8],[89,10],
      [93,6],[94,6],[95,6],[99,9],[100,9],[104,7],[105,7],[109,9],[113,6],[114,6],
      [115,6],[6,9],[7,9],[13,8],[19,7],[26,8],[27,8],[33,6],[34,6],[39,7],
      [40,7],[45,5],[46,5],[47,5],[53,7],[54,7],[59,4],[60,4],[65,6],[66,6],
      [71,4],[72,4]
    ];
  }

  const prispasIndices = [6, 20, 40];
  pos.forEach(([cx, cy], index) => {
    const isPrispas = prispasIndices.includes(index);
    coins.push({
      x: cx * TILE + 8,
      y: cy * TILE + 8,
      w: 16,
      h: 16,
      collected: false,
      bob: Math.random() * Math.PI * 2,
      type: isPrispas ? 'prispas' : 'item',
    });
  });
  return coins;
}
