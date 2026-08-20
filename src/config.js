// ============================================================
// CONFIGURACIÓN GLOBAL
// ============================================================

export const TILE = 32;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -13;
export const SPEED = 4;
export const RUN_SPEED = 7;
export const FRICTION = 0.88;
export const LEVEL_WIDTH = 120;
export const LEVEL_HEIGHT = 20;

// Resuelve la ruta base de assets usando la ubicación REAL de este módulo
// import.meta.url = https://tusitio.com/aventura-coreana/src/config.js
// new URL('../assets/', import.meta.url) = https://tusitio.com/aventura-coreana/assets/
const ASSETS_BASE = new URL('../assets/', import.meta.url).href;

function asset(path) {
  return ASSETS_BASE + path;
}

export const SPRITE_CONFIG = {
  files: {
    run: {
      src: asset('TOMY-run.png'),
      frames: 36, speed: 3, cols: 6, rows: 6,
      frameWidth: 464, frameHeight: 660,
      scale: 0.09, offsetX: -28, offsetY: -60,
    },
    celebrate: {
      src: asset('TOMY-celebrate.png'),
      frames: 36, speed: 3, cols: 6, rows: 6,
      frameWidth: 408, frameHeight: 717,
      scale: 0.08, offsetX: -22, offsetY: -58,
    },
    ready: {
      src: asset('TOMY-ready.png'),
      frames: 36, speed: 2, cols: 6, rows: 6,
      frameWidth: 372, frameHeight: 709,
      scale: 0.08, offsetX: -22, offsetY: -58,
    },
    'arana-ready': {
      src: asset('arana-ready.png'),
      frames: 16, speed: 3, cols: 4, rows: 4,
      frameWidth: 447, frameHeight: 664,
      scale: 0.085, offsetX: -24, offsetY: -58,
    },
    'arana-run': {
      src: asset('arana-run.png'),
      frames: 16, speed: 3, cols: 4, rows: 4,
      frameWidth: 101, frameHeight: 131,
      scale: 0.42, offsetX: -21, offsetY: -52,
    },
    'arana-celebrate': {
      src: asset('arana-celebrate.png'),
      frames: 16, speed: 3, cols: 4, rows: 4,
      frameWidth: 134, frameHeight: 229,
      scale: 0.25, offsetX: -17, offsetY: -56,
    },
    prispas: {
      src: asset('prispas.webp'),
      frames: 1, speed: 1, cols: 1, rows: 1,
      frameWidth: 637, frameHeight: 1000,
    },
    item: {
      src: asset('item.png'),
      frames: 1, speed: 1, cols: 1, rows: 1,
      frameWidth: 128, frameHeight: 128,
    },
  },
};

export const AUDIO_CONFIG = {
  selectPlayer: { src: asset('select-player.mp3'), loop: true,  volume: 0.6 },
  gameStart:    { src: asset('game-start.mp3'),    loop: false, volume: 0.7 },
  gameAdventure:{ src: asset('game-adventure.mp3'), loop: true,  volume: 0.5 },
  death:        { src: asset('death.mp3'),         loop: false, volume: 0.8 },
  fail:         { src: asset('fail.mp3'),          loop: false, volume: 0.8 },
  jump:         { src: asset('jump.mp3'),          loop: false, volume: 0.25 },
  stomp:        { src: asset('stomp.mp3'),         loop: false, volume: 0.35 },
  victory:      { src: asset('victory.mp3'),       loop: false, volume: 0.7 },
};

export const TILE_MAP = {
  0: 1,   // suelo
  1: 2,   // plataforma
  2: 3,   // bloque moneda
  3: 4,   // tubo
  4: 5,   // bandera
};
