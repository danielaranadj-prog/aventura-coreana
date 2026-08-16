// ============================================================
// CONFIGURACIÓN DE SPRITES TOMY + ARANA
// ============================================================
const SPRITE_CONFIG = {
  files: {
    run: {
      src: 'assets/TOMY-run.png',
      frames: 36,
      speed: 3,
      cols: 6,
      rows: 6,
      frameWidth: 464,
      frameHeight: 660,
      scale: 0.09,
      offsetX: -28,
      offsetY: -60,
    },
    celebrate: {
      src: 'assets/TOMY-celebrate.png',
      frames: 36,
      speed: 3,
      cols: 6,
      rows: 6,
      frameWidth: 408,
      frameHeight: 717,
      scale: 0.08,
      offsetX: -22,
      offsetY: -58,
    },
    ready: {
      src: 'assets/TOMY-ready.png',
      frames: 36,
      speed: 2,
      cols: 6,
      rows: 6,
      frameWidth: 372,
      frameHeight: 709,
      scale: 0.08,
      offsetX: -22,
      offsetY: -58,
    },
    'arana-ready': {
      src: 'assets/arana-ready.png',
      frames: 16,
      speed: 3,
      cols: 4,
      rows: 4,
      frameWidth: 447,
      frameHeight: 664,
      scale: 0.085,
      offsetX: -24,
      offsetY: -58,
    },
    prispas: {
      src: 'assets/prispas.webp',
      frames: 1,
      speed: 1,
      cols: 1,
      rows: 1,
      frameWidth: 637,
      frameHeight: 1000,
    },
  },
};

// ============================================================
// CONFIGURACIÓN DE AUDIO
// ============================================================
const AUDIO_CONFIG = {
  selectPlayer: { src: 'assets/select-player.mp3', loop: true, volume: 0.6 },
  gameStart:    { src: 'assets/game-start.mp3',    loop: false, volume: 0.7 },
  gameAdventure:{ src: 'assets/game-adventure.mp3', loop: true, volume: 0.5 },
  death:        { src: 'assets/death.mp3',         loop: false, volume: 0.8 },
  fail:         { src: 'assets/fail.mp3',          loop: false, volume: 0.8 },
};

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
        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
        audio.addEventListener('error', () => {
          console.warn('No se pudo cargar audio:', info.src);
          resolve();
        }, { once: true });
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
}

const audioManager = new AudioManager(AUDIO_CONFIG);

// ============================================================
// CONFIGURACIÓN DEL JUEGO — VERTICAL RESPONSIVO
// ============================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const TILE = 32;
const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const SPEED = 4;
const FRICTION = 0.85;

// ============================================================
// ESTADO
// ============================================================
let gameState = 'loading';
let score = 0;
let lives = 3;
let timeLeft = 300;
let cameraX = 0;
let timerInterval = null;
let selectedCharacter = 'tomy';
let menuPreviewFrame = 0;
let menuPreviewTimer = 0;
let aranaPreviewFrame = 0;
let winPreviewFrame = 0;
let winPreviewTimer = 0;

// ============================================================
// CARGADOR DE SPRITES
// ============================================================
class SpriteLoader {
  constructor(config) {
    this.config = config;
    this.images = {};
    this.loaded = 0;
    this.total = Object.keys(config.files).length;
    this.onComplete = null;
  }

  load() {
    const promises = [];
    for (const [name, fileInfo] of Object.entries(this.config.files)) {
      const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.images[name] = {
            image: img,
            frames: fileInfo.frames,
            speed: fileInfo.speed,
            cols: fileInfo.cols,
            rows: fileInfo.rows,
            frameWidth: fileInfo.frameWidth,
            frameHeight: fileInfo.frameHeight,
            scale: fileInfo.scale,
            offsetX: fileInfo.offsetX,
            offsetY: fileInfo.offsetY,
          };
          this.loaded++;
          this.updateLoadingUI();
          resolve();
        };
        img.onerror = () => reject(new Error(`No se pudo cargar: ${fileInfo.src}`));
        img.src = fileInfo.src;
      });
      promises.push(promise);
    }

    Promise.all(promises)
      .then(() => {
        return audioManager.loadAll();
      })
      .then(() => {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        gameState = 'menu';
        audioManager.init();
        audioManager.playMusic('selectPlayer');
        if (this.onComplete) this.onComplete();
      })
      .catch(err => {
        document.getElementById('loading').innerHTML =
          '<span style="color:#ff0040;font-size:16px">❌ Error cargando sprites</span><br><br>' +
          '<span style="font-size:13px;color:#ff69b4">' + err.message + '</span><br><br>' +
          '<span style="font-size:13px;color:#64748b">Asegúrate de que los archivos estén en la carpeta assets/</span>';
      });
  }

  updateLoadingUI() {
    const fill = document.getElementById('loading-fill');
    if (fill) {
      const pct = (this.loaded / this.total) * 100;
      fill.style.width = pct + '%';
    }
  }

  get(name) { return this.images[name]; }
}

const spriteLoader = new SpriteLoader(SPRITE_CONFIG);

// ============================================================
// SISTEMA DE ANIMACIÓN
// ============================================================
class Animator {
  constructor(loader) {
    this.loader = loader;
    this.currentAnim = 'ready';
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.facing = 1;
    this.isStatic = false;
    this.staticFrame = 0;
  }

  setAnimation(name) {
    if (this.currentAnim !== name || this.isStatic) {
      this.currentAnim = name;
      this.currentFrame = 0;
      this.frameTimer = 0;
      this.isStatic = false;
    }
  }

  setStaticFrame(name, frameIndex) {
    if (this.currentAnim !== name || !this.isStatic || this.staticFrame !== frameIndex) {
      this.currentAnim = name;
      this.staticFrame = frameIndex;
      this.currentFrame = frameIndex;
      this.frameTimer = 0;
      this.isStatic = true;
    }
  }

  update() {
    if (this.isStatic) return;
    const spriteData = this.loader.get(this.currentAnim);
    if (!spriteData) return;
    this.frameTimer++;
    if (this.frameTimer >= spriteData.speed) {
      this.frameTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % spriteData.frames;
    }
  }

  draw(ctx, x, y, facing, playerW, playerH) {
    const spriteData = this.loader.get(this.currentAnim);
    if (!spriteData) return;

    const img = spriteData.image;
    const fw = spriteData.frameWidth;
    const fh = spriteData.frameHeight;
    const cols = spriteData.cols;
    const scale = spriteData.scale;
    const offX = spriteData.offsetX;
    const offY = spriteData.offsetY;

    const col = this.currentFrame % cols;
    const row = Math.floor(this.currentFrame / cols);

    const bleed = 0.5;
    const sx = col * fw + bleed;
    const sy = row * fh + bleed;
    const sfw = fw - bleed * 2;
    const sfh = fh - bleed * 2;

    const dw = sfw * scale;
    const dh = sfh * scale;

    ctx.save();
    ctx.translate(x + playerW / 2 + offX, y + playerH + offY);

    if (facing < 0) {
      ctx.scale(-1, 1);
      ctx.translate(-dw, 0);
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, sy, sfw, sfh, 0, 0, dw, dh);
    ctx.imageSmoothingEnabled = true;

    ctx.restore();
  }
}

let animator = null;

// ============================================================
// MAPA — NIVEL AJUSTADO PARA VERTICAL
// ============================================================
const LEVEL_WIDTH = 120;
const LEVEL_HEIGHT = 20;

function generateLevel() {
  const map = [];
  for (let y = 0; y < LEVEL_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < LEVEL_WIDTH; x++) map[y][x] = 0;
  }
  for (let x = 0; x < LEVEL_WIDTH; x++) {
    map[LEVEL_HEIGHT - 1][x] = 1;
    map[LEVEL_HEIGHT - 2][x] = 1;
  }
  function plat(x, y, w, t = 2) {
    for (let i = 0; i < w; i++) if (x + i < LEVEL_WIDTH) map[y][x + i] = t;
  }
  plat(3, 16, 4); plat(10, 14, 3); plat(16, 12, 2, 3); plat(22, 15, 3);
  plat(28, 11, 4); plat(35, 13, 2, 3); plat(40, 10, 3); plat(46, 14, 2);
  plat(50, 8, 4); plat(57, 12, 2, 3); plat(62, 9, 3); plat(68, 13, 2);
  plat(72, 7, 4); plat(78, 11, 2, 3); plat(83, 8, 3); plat(88, 12, 2);
  plat(92, 6, 4); plat(98, 10, 2, 3); plat(103, 7, 3); plat(108, 11, 2);
  plat(112, 5, 4); plat(5, 9, 3); plat(12, 7, 2); plat(18, 5, 3);
  plat(25, 8, 2); plat(32, 4, 4); plat(38, 6, 2, 3); plat(44, 3, 3);
  plat(52, 5, 2); plat(58, 2, 4); plat(64, 4, 2, 3); plat(70, 1, 3);
  map[LEVEL_HEIGHT - 3][LEVEL_WIDTH - 5] = 5;
  map[LEVEL_HEIGHT - 4][LEVEL_WIDTH - 5] = 5;
  map[LEVEL_HEIGHT - 5][LEVEL_WIDTH - 5] = 5;
  map[LEVEL_HEIGHT - 6][LEVEL_WIDTH - 5] = 5;
  map[LEVEL_HEIGHT - 3][LEVEL_WIDTH - 4] = 5;
  return map;
}
let levelMap = generateLevel();

// ============================================================
// JUGADOR
// ============================================================
const GROUND_Y = (LEVEL_HEIGHT - 2) * TILE;
const player = {
  x: 64,
  y: GROUND_Y - 48,
  w: 28,
  h: 48,
  vx: 0,
  vy: 0,
  onGround: true,
  facing: 1,
  invincible: 0,
  celebrating: false,
  celebrateTimer: 0,
};

// ============================================================
// ENEMIGOS
// ============================================================
function createEnemies() {
  return [
    {x:250,y:GROUND_Y-28,w:28,h:28,vx:1.2,type:'goomba',dead:false},
    {x:450,y:GROUND_Y-28,w:28,h:28,vx:-1.2,type:'goomba',dead:false},
    {x:700,y:GROUND_Y-28,w:28,h:28,vx:1.2,type:'goomba',dead:false},
    {x:1000,y:GROUND_Y-28,w:28,h:28,vx:-1.2,type:'goomba',dead:false},
    {x:1300,y:GROUND_Y-28,w:28,h:28,vx:1.2,type:'goomba',dead:false},
    {x:1600,y:GROUND_Y-28,w:28,h:28,vx:-1.2,type:'goomba',dead:false},
    {x:1900,y:GROUND_Y-28,w:28,h:28,vx:1.2,type:'goomba',dead:false},
    {x:2200,y:GROUND_Y-28,w:28,h:28,vx:-1.2,type:'goomba',dead:false},
    {x:2500,y:GROUND_Y-28,w:28,h:28,vx:1.2,type:'goomba',dead:false},
    {x:2800,y:GROUND_Y-28,w:28,h:28,vx:-1.2,type:'goomba',dead:false},
    {x:3100,y:GROUND_Y-28,w:28,h:28,vx:1.2,type:'goomba',dead:false},
    {x:3400,y:GROUND_Y-28,w:28,h:28,vx:-1.2,type:'goomba',dead:false},
  ];
}
let enemies = [];

// ============================================================
// MONEDAS
// ============================================================
function createCoins() {
  const coins = [];
  const pos = [
    [4,15],[5,15],[6,15],[11,13],[12,13],[17,11],[18,11],[29,10],[30,10],[31,10],
    [36,12],[37,12],[41,9],[42,9],[51,7],[52,7],[53,7],[58,11],[59,11],
    [63,8],[64,8],[69,12],[73,6],[74,6],[75,6],[79,10],[80,10],[84,7],[85,7],
    [89,11],[93,5],[94,5],[95,5],[99,9],[100,9],[104,6],[105,6],[109,10],
    [113,4],[114,4],[115,4],[6,8],[7,8],[13,6],[19,4],[26,7],[27,7],
    [33,3],[34,3],[39,5],[40,5],[45,2],[46,2],[47,2],[53,4],[54,4],
    [59,1],[60,1],[65,3],[66,3],[71,0],[72,0],
  ];
  pos.forEach(([cx,cy]) => {
    coins.push({x:cx*TILE+8,y:cy*TILE+8,w:16,h:16,collected:false,bob:Math.random()*Math.PI*2});
  });
  return coins;
}
let coins = [];

// ============================================================
// PARTÍCULAS
// ============================================================
let particles = [];
function spawnParticles(x,y,color,count=8) {
  for(let i=0;i<count;i++){
    particles.push({x,y,vx:(Math.random()-0.5)*6,vy:(Math.random()-1)*6,life:30+Math.random()*20,color,size:3+Math.random()*4});
  }
}

// ============================================================
// INPUT — TECLADO + TÁCTIL
// ============================================================
const keys={};
window.addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(e.code==='KeyR'&&(gameState==='playing'||gameState==='gameover'||gameState==='win'))restartGame();
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
});
window.addEventListener('keyup',e=>{keys[e.code]=false;});

const touchKeys={};
function setupTouch(btnId,keyCode){
  const btn=document.getElementById(btnId);
  if(!btn) return;
  const setKey = (val) => { touchKeys[keyCode] = val; };

  btn.addEventListener('touchstart',e=>{e.preventDefault();setKey(true);}, {passive:false});
  btn.addEventListener('touchend',e=>{e.preventDefault();setKey(false);}, {passive:false});
  btn.addEventListener('touchcancel',e=>{e.preventDefault();setKey(false);}, {passive:false});
  btn.addEventListener('mousedown',e=>{e.preventDefault();setKey(true);});
  btn.addEventListener('mouseup',e=>{e.preventDefault();setKey(false);});
  btn.addEventListener('mouseleave',e=>{e.preventDefault();setKey(false);});
}
setupTouch('btn-left','ArrowLeft');
setupTouch('btn-right','ArrowRight');
setupTouch('btn-jump','ArrowUp');

function isKeyDown(code){return keys[code]||touchKeys[code];}

// ============================================================
// SELECTOR DE PERSONAJE
// ============================================================
function selectCharacter(name) {
  if (name !== 'tomy') return;
  selectedCharacter = name;
  const tomyCard = document.getElementById('character-tomy');
  tomyCard.classList.add('selected');
  tomyCard.setAttribute('aria-pressed', 'true');
}

// ============================================================
// PREVIEWS DEL MENÚ
// ============================================================
function drawTomyPreview() {
  const preview = document.getElementById('character-preview');
  const spriteData = spriteLoader.get('ready');
  if (!preview || !spriteData) return;
  const previewCtx = preview.getContext('2d');
  const col = menuPreviewFrame % spriteData.cols;
  const row = Math.floor(menuPreviewFrame / spriteData.cols);
  const dw = 80;
  const dh = 153;
  previewCtx.clearRect(0, 0, preview.width, preview.height);
  previewCtx.imageSmoothingEnabled = true;
  previewCtx.drawImage(
    spriteData.image,
    col * spriteData.frameWidth, row * spriteData.frameHeight,
    spriteData.frameWidth, spriteData.frameHeight,
    (preview.width - dw) / 2, 0, dw, dh,
  );
}

function drawAranaPreview() {
  const preview = document.getElementById('arana-preview');
  const spriteData = spriteLoader.get('arana-ready');
  if (!preview || !spriteData) return;
  const previewCtx = preview.getContext('2d');
  const col = aranaPreviewFrame % spriteData.cols;
  const row = Math.floor(aranaPreviewFrame / spriteData.cols);
  const dw = 80;
  const dh = 153;
  previewCtx.clearRect(0, 0, preview.width, preview.height);
  previewCtx.imageSmoothingEnabled = true;
  previewCtx.drawImage(
    spriteData.image,
    col * spriteData.frameWidth, row * spriteData.frameHeight,
    spriteData.frameWidth, spriteData.frameHeight,
    (preview.width - dw) / 2, 0, dw, dh,
  );
}

function updateMenuPreview() {
  if (gameState !== 'menu') return;
  menuPreviewTimer++;
  if (menuPreviewTimer >= 6) {
    menuPreviewTimer = 0;
    const tomyData = spriteLoader.get('ready');
    const aranaData = spriteLoader.get('arana-ready');
    if (tomyData) menuPreviewFrame = (menuPreviewFrame + 1) % tomyData.frames;
    if (aranaData) aranaPreviewFrame = (aranaPreviewFrame + 1) % aranaData.frames;
    drawTomyPreview();
    drawAranaPreview();
  }
  requestAnimationFrame(updateMenuPreview);
}

function drawWinCharacter() {
  const preview = document.getElementById('win-character-preview');
  const spriteData = spriteLoader.get('celebrate');
  if (!preview || !spriteData) return;
  const previewCtx = preview.getContext('2d');
  const col = winPreviewFrame % spriteData.cols;
  const row = Math.floor(winPreviewFrame / spriteData.cols);
  const dh = 150;
  const dw = 86;
  previewCtx.clearRect(0, 0, preview.width, preview.height);
  previewCtx.drawImage(
    spriteData.image,
    col * spriteData.frameWidth, row * spriteData.frameHeight,
    spriteData.frameWidth, spriteData.frameHeight,
    (preview.width - dw) / 2, 0, dw, dh,
  );
}

function updateWinPreview() {
  if (gameState !== 'win') return;
  winPreviewTimer++;
  if (winPreviewTimer >= 5) {
    winPreviewTimer = 0;
    winPreviewFrame = (winPreviewFrame + 1) % spriteLoader.get('celebrate').frames;
    drawWinCharacter();
  }
  requestAnimationFrame(updateWinPreview);
}

// ============================================================
// FÍSICA
// ============================================================
function getTile(x,y){
  const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
  if(ty<0||ty>=LEVEL_HEIGHT||tx<0||tx>=LEVEL_WIDTH)return 0;
  return levelMap[ty][tx];
}
function isSolid(tile){return tile===1||tile===2||tile===3||tile===4;}
function rectIntersect(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}

function updatePlayer(){
  if (player.celebrating) {
    player.celebrateTimer--;
    if (player.celebrateTimer <= 0) player.celebrating = false;
    animator.setAnimation('celebrate');
    animator.update();
    return;
  }

  if(isKeyDown('ArrowLeft')||isKeyDown('KeyA')){player.vx-=0.8;player.facing=-1;}
  if(isKeyDown('ArrowRight')||isKeyDown('KeyD')){player.vx+=0.8;player.facing=1;}
  player.vx*=FRICTION;
  player.vx=Math.max(-SPEED,Math.min(SPEED,player.vx));

  if((isKeyDown('ArrowUp')||isKeyDown('KeyW')||isKeyDown('Space'))&&player.onGround){
    player.vy=JUMP_FORCE;player.onGround=false;
    spawnParticles(player.x+player.w/2,player.y+player.h,'#ffd700',5);
  }
  player.vy+=GRAVITY;

  player.x+=player.vx;
  if(player.x<0){player.x=0;player.vx=0;}
  if(player.x>LEVEL_WIDTH*TILE-player.w){player.x=LEVEL_WIDTH*TILE-player.w;}

  const left=Math.floor(player.x/TILE),right=Math.floor((player.x+player.w-1)/TILE);
  const top=Math.floor(player.y/TILE),bottom=Math.floor((player.y+player.h-1)/TILE);
  for(let ty=top;ty<=bottom;ty++){
    for(let tx=left;tx<=right;tx++){
      if(isSolid(levelMap[ty][tx])){
        if(player.vx>0){player.x=tx*TILE-player.w-0.1;player.vx=0;}
        else if(player.vx<0){player.x=(tx+1)*TILE+0.1;player.vx=0;}
      }
    }
  }

  player.y+=player.vy;player.onGround=false;
  const left2=Math.floor(player.x/TILE),right2=Math.floor((player.x+player.w-1)/TILE);
  const top2=Math.floor(player.y/TILE),bottom2=Math.floor((player.y+player.h-1)/TILE);
  for(let ty=top2;ty<=bottom2;ty++){
    for(let tx=left2;tx<=right2;tx++){
      const tile=levelMap[ty][tx];
      if(isSolid(tile)){
        if(player.vy>0){player.y=ty*TILE-player.h-0.1;player.vy=0;player.onGround=true;}
        else if(player.vy<0){player.y=(ty+1)*TILE+0.1;player.vy=0;if(tile===3){levelMap[ty][tx]=0;score+=100;spawnParticles(tx*TILE+16,ty*TILE+16,'#ffd700',10);updateUI();}}
      }
      if(tile===5)winGame();
    }
  }

  if(player.y>LEVEL_HEIGHT*TILE+200)playerDie();
  if(player.invincible>0)player.invincible--;

  const hasInput = isKeyDown('ArrowLeft') || isKeyDown('KeyA') ||
                   isKeyDown('ArrowRight') || isKeyDown('KeyD');
  const isMoving = Math.abs(player.vx) > 0.15;

  if (player.onGround && !hasInput && !isMoving) {
    animator.setAnimation('ready');
  } else {
    animator.setAnimation('run');
  }
  animator.update();
}

function updateEnemies(){
  enemies.forEach(e=>{
    if(e.dead) return;

    e.x += e.vx;

    // Verificar límites del mundo
    if (e.x <= 0 || e.x + e.w >= LEVEL_WIDTH * TILE) {
      e.vx *= -1;
      e.x = Math.max(0, Math.min(e.x, LEVEL_WIDTH * TILE - e.w));
      return;
    }

    const frontX = e.x + (e.vx > 0 ? e.w : 0);
    const groundAhead = getTile(frontX, e.y + e.h + 4);
    const wallAhead   = getTile(frontX, e.y + e.h / 2);

    // Si no hay suelo adelante o hay una pared al frente, invertir dirección
    if (!isSolid(groundAhead) || isSolid(wallAhead)) {
      e.vx *= -1;
    }

    if(rectIntersect(player,e) && player.invincible<=0){
      if(player.vy>0 && player.y+player.h < e.y+e.h/2){
        e.dead=true;
        player.vy=JUMP_FORCE*0.7;
        score+=200;
        spawnParticles(e.x+e.w/2,e.y+e.h/2,'#ff0040',12);
        updateUI();
      } else {
        playerDie();
      }
    }
  });
}

function updateCoins(){
  coins.forEach(c=>{
    if(c.collected)return;
    c.bob+=0.08;
    const coinRect={x:c.x,y:c.y+Math.sin(c.bob)*4,w:c.w,h:c.h};
    if(rectIntersect(player,coinRect)){c.collected=true;score+=50;spawnParticles(c.x+8,c.y+8,'#ffd700',6);updateUI();}
  });
}

function updateParticles(){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.2;p.life--;
    if(p.life<=0)particles.splice(i,1);
  }
}

function playerDie(){
  if(player.invincible>0)return;
  lives--;updateUI();
  spawnParticles(player.x+player.w/2,player.y+player.h/2,'#ff0040',20);
  audioManager.play('death');
  if(lives<=0)gameOver();
  else{player.invincible=120;player.vy=JUMP_FORCE;player.x=Math.max(64,player.x-200);player.y=200;}
}

// ============================================================
// CÁMARA
// ============================================================
function updateCamera(){
  const targetX=player.x-canvas.width/3;
  cameraX+=(targetX-cameraX)*0.1;
  cameraX=Math.max(0,Math.min(cameraX,LEVEL_WIDTH*TILE-canvas.width));
}

// ============================================================
// DIBUJAR MUNDO — ESTILO ESPACIAL
// ============================================================
function draw(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo espacial: morado profundo → magenta → cian neón
  const grad=ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0,'#0d0221');
  grad.addColorStop(0.4,'#1a0a2e');
  grad.addColorStop(0.7,'#2d1b4e');
  grad.addColorStop(1,'#4a1a6b');
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  drawStars();
  drawNebula();

  ctx.save();
  ctx.translate(-Math.floor(cameraX),0);

  const startCol=Math.floor(cameraX/TILE);
  const endCol=startCol+Math.ceil(canvas.width/TILE)+1;

  for(let y=0;y<LEVEL_HEIGHT;y++){
    for(let x=startCol;x<=endCol&&x<LEVEL_WIDTH;x++){
      const tile=levelMap[y][x];
      const px=x*TILE,py=y*TILE;
      if(tile===1){
        // Suelo espacial: roca oscura con detalles magenta
        ctx.fillStyle='#1a0a2e';
        ctx.fillRect(px,py,TILE,TILE);
        ctx.fillStyle='#ff00ff';
        ctx.fillRect(px,py,TILE,3);
        ctx.fillStyle='#4a1a6b';
        ctx.fillRect(px+4,py+10,4,4);
        ctx.fillRect(px+20,py+18,5,5);
        ctx.fillRect(px+12,py+24,3,3);
        // Brillo neón en bordes
        ctx.strokeStyle='rgba(255,0,255,0.15)';
        ctx.lineWidth=1;
        ctx.strokeRect(px+0.5,py+0.5,TILE-1,TILE-1);
      }else if(tile===2){
        // Plataformas: cian neón
        ctx.fillStyle='#00b4d8';
        ctx.fillRect(px,py,TILE,TILE);
        ctx.strokeStyle='#00ffff';
        ctx.lineWidth=2;
        ctx.strokeRect(px+1,py+1,TILE-2,TILE-2);
        ctx.shadowColor='#00ffff';
        ctx.shadowBlur=8;
        ctx.beginPath();
        ctx.moveTo(px+TILE/2,py);ctx.lineTo(px+TILE/2,py+TILE);
        ctx.moveTo(px,py+TILE/2);ctx.lineTo(px+TILE/2,py+TILE/2);
        ctx.moveTo(px+TILE/2,py+TILE/4);ctx.lineTo(px+TILE,py+TILE/4);
        ctx.moveTo(px+TILE/2,py+TILE*3/4);ctx.lineTo(px+TILE,py+TILE*3/4);
        ctx.stroke();
        ctx.shadowBlur=0;
      }else if(tile===3){
        // Bloques de moneda: dorado/rosa neón
        ctx.fillStyle='#ffd700';
        ctx.fillRect(px+2,py+2,TILE-4,TILE-4);
        ctx.strokeStyle='#ff69b4';
        ctx.lineWidth=2;
        ctx.strokeRect(px+2,py+2,TILE-4,TILE-4);
        ctx.shadowColor='#ffd700';
        ctx.shadowBlur=10;
        ctx.fillStyle='#fff5cc';
        ctx.fillRect(px+8,py+8,6,6);
        ctx.fillRect(px+18,py+12,4,4);
        ctx.shadowBlur=0;
      }else if(tile===4){
        // Tubos: verde neón espacial
        ctx.fillStyle='#00ff88';
        ctx.fillRect(px,py,TILE*2,TILE*2);
        ctx.fillStyle='#00cc6a';
        ctx.fillRect(px,py,TILE*2,8);
        ctx.fillRect(px,py+TILE,TILE*2,4);
        ctx.strokeStyle='#00ffff';
        ctx.lineWidth=2;
        ctx.strokeRect(px,py,TILE*2,TILE*2);
        ctx.fillStyle='#66ffaa';
        ctx.fillRect(px+4,py+12,4,TILE*2-16);
      }else if(tile===5){
        // Bandera final: magenta/rosa
        ctx.fillStyle='#ff00ff';
        ctx.fillRect(px+12,py,4,TILE*6);
        ctx.shadowColor='#ff00ff';
        ctx.shadowBlur=15;
        ctx.fillStyle='#ff69b4';
        ctx.beginPath();ctx.moveTo(px+16,py);ctx.lineTo(px+48,py+16);ctx.lineTo(px+16,py+32);ctx.fill();
        ctx.shadowBlur=0;
      }
    }
  }

  coins.forEach(c=>{
    if(c.collected)return;
    const bobY=Math.sin(c.bob)*4;
    const prispas = spriteLoader.get('prispas');
    if (prispas) {
      ctx.drawImage(prispas.image, c.x - 1, c.y - 7 + bobY, 18, 28);
    }
  });

  enemies.forEach(e=>{
    if(e.dead)return;
    // Demonios rojos estilo portada
    ctx.fillStyle='#dc143c';
    ctx.beginPath();ctx.arc(e.x+e.w/2,e.y+e.h/2,e.w/2,0,Math.PI*2);ctx.fill();
    // Cuernos
    ctx.fillStyle='#8b0000';
    ctx.beginPath();
    ctx.moveTo(e.x+6,e.y+4);ctx.lineTo(e.x+2,e.y-2);ctx.lineTo(e.x+10,e.y+2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.x+e.w-6,e.y+4);ctx.lineTo(e.x+e.w-2,e.y-2);ctx.lineTo(e.x+e.w-10,e.y+2);
    ctx.fill();
    // Ojos brillantes
    const eyeOffset=e.vx>0?4:-4;
    ctx.fillStyle='#ffff00';
    ctx.shadowColor='#ffff00';
    ctx.shadowBlur=6;
    ctx.beginPath();ctx.arc(e.x+e.w/2-6+eyeOffset,e.y+10,4,0,Math.PI*2);ctx.arc(e.x+e.w/2+6+eyeOffset,e.y+10,4,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#ff0000';
    ctx.beginPath();ctx.arc(e.x+e.w/2-6+eyeOffset+(e.vx>0?1:-1),e.y+10,2,0,Math.PI*2);ctx.arc(e.x+e.w/2+6+eyeOffset+(e.vx>0?1:-1),e.y+10,2,0,Math.PI*2);ctx.fill();
    // Cejas demoníacas
    ctx.strokeStyle='#4a0000';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(e.x+4,e.y+4);ctx.lineTo(e.x+12,e.y+6);ctx.moveTo(e.x+e.w-4,e.y+4);ctx.lineTo(e.x+e.w-12,e.y+6);ctx.stroke();
  });

  particles.forEach(p=>{ctx.globalAlpha=p.life/50;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);});
  ctx.globalAlpha=1;

  if(player.invincible<=0||Math.floor(player.invincible/4)%2===0){
    animator.draw(ctx, player.x, player.y, player.facing, player.w, player.h);
  }

  ctx.restore();
}

// Estrellas del fondo espacial
function drawStars(){
  const stars=[
    {x:50,y:30,s:1.5},{x:120,y:80,s:1},{x:200,y:40,s:2},{x:300,y:120,s:1},
    {x:80,y:200,s:1.5},{x:350,y:250,s:1},{x:150,y:350,s:2},{x:280,y:400,s:1},
    {x:60,y:500,s:1},{x:320,y:550,s:1.5},{x:180,y:600,s:1},{x:380,y:50,s:1},
    {x:30,y:300,s:2},{x:370,y:350,s:1},{x:100,y:450,s:1.5},{x:250,y:500,s:1},
  ];
  stars.forEach(s=>{
    const parallaxX=(s.x-cameraX*0.1)%(LEVEL_WIDTH*TILE);
    const drawX=parallaxX<-10?parallaxX+LEVEL_WIDTH*TILE:parallaxX;
    ctx.fillStyle='rgba(255,255,255,'+(0.3+Math.random()*0.4)+')';
    ctx.beginPath();ctx.arc(drawX,s.y,s.s,0,Math.PI*2);ctx.fill();
  });
}

// Nebulosas de fondo
function drawNebula(){
  const nebulas=[
    {x:100,y:150,r:80,c:'rgba(255,0,255,0.08)'},
    {x:300,y:300,r:100,c:'rgba(0,255,255,0.06)'},
    {x:200,y:500,r:120,c:'rgba(255,105,180,0.07)'},
    {x:50,y:400,r:60,c:'rgba(138,43,226,0.09)'},
  ];
  nebulas.forEach(n=>{
    const parallaxX=(n.x-cameraX*0.05)%(LEVEL_WIDTH*TILE);
    const drawX=parallaxX<-200?parallaxX+LEVEL_WIDTH*TILE:parallaxX;
    const grad=ctx.createRadialGradient(drawX,n.y,0,drawX,n.y,n.r);
    grad.addColorStop(0,n.c);
    grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grad;
    ctx.beginPath();ctx.arc(drawX,n.y,n.r,0,Math.PI*2);ctx.fill();
  });
}

// ============================================================
// UI Y ESTADOS
// ============================================================
function updateUI(){
  document.getElementById('score').textContent=score;
  document.getElementById('lives').textContent=lives;
  document.getElementById('time').textContent=timeLeft;
}

function startTimer(){
  if(timerInterval)clearInterval(timerInterval);
  timerInterval=setInterval(()=>{
    if(gameState==='playing'){timeLeft--;updateUI();if(timeLeft<=0)gameOver();}
  },1000);
}

function startGame(){
  audioManager.init();
  audioManager.resumeContext();

  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('win-screen').classList.add('hidden');
  document.getElementById('menu-button').classList.remove('hidden');
  document.getElementById('mobile-controls').style.display = 'flex';
  score=0;lives=3;timeLeft=300;cameraX=0;
  player.x=64;player.y=GROUND_Y-player.h;player.vx=0;player.vy=0;player.invincible=0;
  player.onGround=true;
  player.celebrating=false;player.celebrateTimer=0;
  levelMap=generateLevel();enemies=createEnemies();coins=createCoins();particles=[];
  gameState='playing';updateUI();startTimer();gameLoop();

  audioManager.stopAll();
  const startSound = audioManager.sounds['gameStart'];
  if (startSound) {
    startSound.currentTime = 0;
    const p = startSound.play();
    if (p) {
      p.then(() => {
        startSound.onended = () => {
          audioManager.playMusic('gameAdventure');
        };
      }).catch(() => {
        audioManager.playMusic('gameAdventure');
      });
    } else {
      audioManager.playMusic('gameAdventure');
    }
  } else {
    audioManager.playMusic('gameAdventure');
  }
}

function restartGame(){startGame();}

function returnToMenu(){
  if(timerInterval) clearInterval(timerInterval);
  timerInterval=null;
  player.vx=0;player.vy=0;player.celebrating=false;player.celebrateTimer=0;
  gameState='menu';
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('win-screen').classList.add('hidden');
  document.getElementById('menu-button').classList.add('hidden');
  document.getElementById('mobile-controls').style.display = 'none';
  document.getElementById('start-screen').classList.remove('hidden');
  audioManager.stopAll();
  audioManager.playMusic('selectPlayer');
  drawMenu();drawTomyPreview();drawAranaPreview();requestAnimationFrame(updateMenuPreview);
}

function gameOver(){
  gameState='gameover';
  if(timerInterval)clearInterval(timerInterval);
  document.getElementById('final-score').textContent=score;
  document.getElementById('gameover-screen').classList.remove('hidden');
  document.getElementById('mobile-controls').style.display = 'none';
  audioManager.stopAll();
  audioManager.play('fail');
}

function winGame(){
  gameState='win';
  if(timerInterval)clearInterval(timerInterval);
  score+=timeLeft*10;
  player.celebrating=true;
  player.celebrateTimer=180;
  winPreviewFrame=0;winPreviewTimer=0;
  drawWinCharacter();requestAnimationFrame(updateWinPreview);
  document.getElementById('win-score').textContent=score;
  document.getElementById('win-screen').classList.remove('hidden');
  document.getElementById('mobile-controls').style.display = 'none';
  spawnParticles(player.x+player.w/2,player.y,'#ffd700',30);
  audioManager.stopAll();
  audioManager.playVictoryFanfare();
}

function gameLoop(){
  if(gameState!=='playing')return;
  updatePlayer();updateEnemies();updateCoins();updateParticles();updateCamera();draw();
  requestAnimationFrame(gameLoop);
}

function drawMenu(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad=ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0,'#0d0221');
  grad.addColorStop(0.5,'#1a0a2e');
  grad.addColorStop(1,'#2d1b4e');
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  drawStars();
  drawNebula();
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
spriteLoader.onComplete = () => {
  animator = new Animator(spriteLoader);
  drawMenu();
  drawTomyPreview();
  drawAranaPreview();
  requestAnimationFrame(updateMenuPreview);
};

spriteLoader.load();