// ============================================================
// INPUT — TECLADO + TÁCTIL
// ============================================================
const keys = {};
const touchKeys = {};

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'KeyR' && (gameState === 'playing' || gameState === 'gameover' || gameState === 'win')) restartGame();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function setupTouch(btnId, keyCode) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const setKey = (val) => { touchKeys[keyCode] = val; };
  btn.addEventListener('touchstart', e => { e.preventDefault(); setKey(true); }, { passive: false });
  btn.addEventListener('touchend', e => { e.preventDefault(); setKey(false); }, { passive: false });
  btn.addEventListener('touchcancel', e => { e.preventDefault(); setKey(false); }, { passive: false });
  btn.addEventListener('mousedown', e => { e.preventDefault(); setKey(true); });
  btn.addEventListener('mouseup', e => { e.preventDefault(); setKey(false); });
  btn.addEventListener('mouseleave', e => { e.preventDefault(); setKey(false); });
}

setupTouch('btn-left', 'ArrowLeft');
setupTouch('btn-right', 'ArrowRight');
setupTouch('btn-up', 'ArrowUp');
setupTouch('btn-down', 'ArrowDown');
setupTouch('btn-jump', 'ArrowUp');   // botón A = saltar
setupTouch('btn-run', 'ShiftLeft');    // botón B = correr

function isKeyDown(code) { return keys[code] || touchKeys[code]; }
