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

// NOTA: como este archivo está en src/config.js, las rutas deben subir un nivel (../)
// para llegar a la carpeta assets/ que está al mismo nivel que index.html
export const SPRITE_CONFIG = {
  files: {
    run: {
      src: '../assets/TOMY-run.png',
      frames: 36, speed: 3, cols: 6, rows: 6,
      frameWidth: 464, frameHeight: 660,
      scale: 0.09, offsetX: -28, offsetY: -60,
    },
    celebrate: {
      src: '../assets/TOMY-celebrate.png',
      frames: 36, speed: 3, cols: 6, rows: 6,
      frameWidth: 408, frameHeight: 717,
      scale: 0.08, offsetX: -22, offsetY: -58,
    },
    ready: {
      src: '../assets/TOMY-ready.png',
      frames: 36, speed: 2, cols: 6, rows: 6,
      frameWidth: 372, frameHeight: 709,
      scale: 0.08, offsetX: -22, offsetY: -58,
    },
    'arana-ready': {
      src: '../assets/arana-ready.png',
      frames: 16, speed: 3, cols: 4, rows: 4,
      frameWidth: 447, frameHeight: 664,
      scale: 0.085, offsetX: -24, offsetY: -58,
    },
    'arana-run': {
      src: '../assets/arana-run.png',
      frames: 16, speed: 3, cols: 4, rows: 4,
      frameWidth: 101, frameHeight: 131,
      scale: 0.42, offsetX: -21, offsetY: -52,
    },
    'arana-celebrate': {
      src: '../assets/arana-celebrate.png',
      frames: 16, speed: 3, cols: 4, rows: 4,
      frameWidth: 134, frameHeight: 229,
      scale: 0.25, offsetX: -17, offsetY: -56,
    },
    prispas: {
      src: '../assets/prispas.webp',
      frames: 1, speed: 1, cols: 1, rows: 1,
      frameWidth: 637, frameHeight: 1000,
    },
    item: {
      src: '../assets/item.png',
      frames: 1, speed: 1, cols: 1, rows: 1,
      frameWidth: 128, frameHeight: 128,
    },
  },
};

export const AUDIO_CONFIG = {
  selectPlayer: { src: '../assets/select-player.mp3', loop: true,  volume: 0.6 },
  gameStart:    { src: '../assets/game-start.mp3',    loop: false, volume: 0.7 },
  gameAdventure:{ src: '../assets/game-adventure.mp3', loop: true,  volume: 0.5 },
  death:        { src: '../assets/death.mp3',         loop: false, volume: 0.8 },
  fail:         { src: '../assets/fail.mp3',          loop: false, volume: 0.8 },
  jump:         { src: '../assets/jump.mp3',          loop: false, volume: 0.25 },
  stomp:        { src: '../assets/stomp.mp3',         loop: false, volume: 0.35 },
  victory:      { src: '../assets/victory.mp3',       loop: false, volume: 0.7 },
};

export const TILE_MAP = {
  0: 1,   // suelo
  1: 2,   // plataforma
  2: 3,   // bloque moneda
  3: 4,   // tubo
  4: 5,   // bandera
};
