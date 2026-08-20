// ============================================================
// PUNTO DE ENTRADA
// ============================================================

import { Game } from './core/Game.js';
import { AssetManager } from './core/AssetManager.js';
import { AudioManager } from './core/AudioManager.js';
import { InputManager } from './core/InputManager.js';
import { Screens } from './ui/Screens.js';
import { HUD } from './ui/HUD.js';
import { SPRITE_CONFIG, AUDIO_CONFIG } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const assetManager = new AssetManager(SPRITE_CONFIG);
const audioManager = new AudioManager(AUDIO_CONFIG);
const inputManager = new InputManager();
const screens = new Screens(assetManager, audioManager);
const hud = new HUD();

const game = new Game(canvas, ctx, assetManager, audioManager, inputManager, screens, hud);

// Estado del selector de personajes
let currentCharIndex = 0;
const characters = ['tomy', 'arana'];

function updateSmashCards() {
  characters.forEach((char, index) => {
    const card = document.getElementById('smash-card-' + char);
    if (!card) return;
    card.classList.remove('active', 'prev', 'next');
    if (index === currentCharIndex) {
      card.classList.add('active');
    } else if (index === (currentCharIndex - 1 + characters.length) % characters.length) {
      card.classList.add('prev');
    } else if (index === (currentCharIndex + 1) % characters.length) {
      card.classList.add('next');
    }
  });
  // Actualizar personaje en el juego
  game.selectCharacter(characters[currentCharIndex]);
}

window.selectCharacter = (name) => {
  const idx = characters.indexOf(name);
  if (idx !== -1) {
    currentCharIndex = idx;
    updateSmashCards();
  }
};

window.prevCharacter = () => {
  currentCharIndex = (currentCharIndex - 1 + characters.length) % characters.length;
  updateSmashCards();
};

window.nextCharacter = () => {
  currentCharIndex = (currentCharIndex + 1) % characters.length;
  updateSmashCards();
};

window.selectLevel = (lvl) => {
  game.selectedLevel = lvl;
  document.querySelectorAll('.smash-level-btn').forEach(btn => btn.classList.remove('selected'));
  const btn = document.getElementById('level-' + lvl);
  if (btn) btn.classList.add('selected');
};

window.startGame = () => game.startGame();
window.restartGame = () => game.restartGame();
window.returnToMenu = () => {
  currentCharIndex = 0;
  updateSmashCards();
  game.returnToMenu();
};

// Tecla R para reiniciar
window.addEventListener('keydown', e => {
  if (e.code === 'KeyR' && (game.state === 'PLAYING' || game.state === 'GAMEOVER' || game.state === 'WIN')) {
    game.restartGame();
  }
  // Navegación con flechas en el menú
  if (game.state === 'MENU') {
    if (e.code === 'ArrowLeft') prevCharacter();
    if (e.code === 'ArrowRight') nextCharacter();
    if (e.code === 'ArrowUp') selectLevel(Math.max(1, game.selectedLevel - 1));
    if (e.code === 'ArrowDown') selectLevel(Math.min(2, game.selectedLevel + 1));
    if (e.code === 'Enter' || e.code === 'Space') startGame();
  }
});

inputManager.setupAllTouch();
game.init().then(() => {
  updateSmashCards();
});
