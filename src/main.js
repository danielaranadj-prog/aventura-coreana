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

// Exponer funciones para los onclick del HTML
window.selectCharacter = (name) => game.selectCharacter(name);
window.startGame = () => game.startGame();
window.restartGame = () => game.restartGame();
window.returnToMenu = () => game.returnToMenu();

// Tecla R para reiniciar
window.addEventListener('keydown', e => {
  if (e.code === 'KeyR' && (game.state === 'PLAYING' || game.state === 'GAMEOVER' || game.state === 'WIN')) {
    game.restartGame();
  }
});

inputManager.setupAllTouch();
game.init();
