// ============================================================
// SISTEMA DE AUDIO
// ============================================================
class AudioManager {
  constructor(config) {
    this.config = config;
    this.sounds = {};
    this.audioCtx = null;
    this.masterGain = null;
    this.initialized = false;
    this.currentMusic = null;
  }

  init() {
    if (this.initialized) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.audioCtx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API no disponible');
    }
  }

  loadAll() {
    const promises = [];
    for (const [name, info] of Object.entries(this.config)) {
      const promise = new Promise((resolve) => {
        const audio = new Audio();
        audio.src = info.src;
        audio.loop = info.loop;
        audio.volume = info.volume;
        audio.preload = 'auto';
        let resolved = false;
        const done = () => { if (!resolved) { resolved = true; resolve(); } };
        audio.addEventListener('canplaythrough', done, { once: true });
        audio.addEventListener('error', () => {
          console.warn('No se pudo cargar audio:', info.src);
          done();
        }, { once: true });
        setTimeout(done, 4000);
        audio.load();
        this.sounds[name] = audio;
      });
      promises.push(promise);
    }
    return Promise.all(promises);
  }

  resumeContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  play(name) {
    this.resumeContext();
    const sound = this.sounds[name];
    if (!sound) return;
    sound.currentTime = 0;
    const playPromise = sound.play();
    if (playPromise) playPromise.catch(() => {});
  }

  stop(name) {
    const sound = this.sounds[name];
    if (!sound) return;
    sound.pause();
    sound.currentTime = 0;
  }

  pause(name) {
    const sound = this.sounds[name];
    if (!sound) return;
    sound.pause();
  }

  playMusic(name) {
    if (this.currentMusic && this.currentMusic !== name) {
      this.stop(this.currentMusic);
    }
    this.currentMusic = name;
    this.play(name);
  }

  stopAll() {
    for (const name in this.sounds) {
      this.stop(name);
    }
    this.currentMusic = null;
  }

  playVictoryFanfare() {
    if (!this.audioCtx) this.init();
    if (!this.audioCtx) return;
    this.resumeContext();
    const now = this.audioCtx.currentTime;
    const notes = [
      { f: 523.25, t: 0.0, d: 0.25 },
      { f: 659.25, t: 0.15, d: 0.25 },
      { f: 783.99, t: 0.30, d: 0.25 },
      { f: 1046.50, t: 0.45, d: 0.6 },
    ];
    notes.forEach(n => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.15, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
    const chord = [261.63, 329.63, 392.00];
    chord.forEach((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  playOneUp() {
    if (!this.audioCtx) this.init();
    if (!this.audioCtx) return;
    this.resumeContext();
    const now = this.audioCtx.currentTime;
    const notes = [
      { f: 987.77, t: 0.0, d: 0.12 },
      { f: 1318.51, t: 0.12, d: 0.4 },
    ];
    notes.forEach(n => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.12, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
  }
}

const audioManager = new AudioManager(AUDIO_CONFIG);
