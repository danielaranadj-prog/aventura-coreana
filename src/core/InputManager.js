// ============================================================
// INPUT — TECLADO + TÁCTIL
// ============================================================

export class InputManager {
  constructor() {
    this.keys = {};
    this.touchKeys = {};
    this._handlers = [];
    this._setupKeyboard();
  }

  _setupKeyboard() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });
  }

  setupTouch(btnId, keyCode) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const setKey = (val) => { this.touchKeys[keyCode] = val; };

    const prevent = (e) => { e.preventDefault(); };
    btn.addEventListener('touchstart', (e) => { prevent(e); setKey(true); }, { passive: false });
    btn.addEventListener('touchend',   (e) => { prevent(e); setKey(false); }, { passive: false });
    btn.addEventListener('touchcancel',(e) => { prevent(e); setKey(false); }, { passive: false });
    btn.addEventListener('mousedown',  (e) => { prevent(e); setKey(true); });
    btn.addEventListener('mouseup',    (e) => { prevent(e); setKey(false); });
    btn.addEventListener('mouseleave', (e) => { prevent(e); setKey(false); });
  }

  isDown(code) {
    return !!this.keys[code] || !!this.touchKeys[code];
  }

  setupAllTouch() {
    this.setupTouch('btn-left',  'ArrowLeft');
    this.setupTouch('btn-right', 'ArrowRight');
    this.setupTouch('btn-up',    'ArrowUp');
    this.setupTouch('btn-down',  'ArrowDown');
    this.setupTouch('btn-jump',  'ArrowUp');
    this.setupTouch('btn-run',   'ShiftLeft');
  }
}
