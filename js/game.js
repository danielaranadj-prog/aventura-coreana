// ============================================================
// CONFIGURACIÓN DE SPRITES TOMY — CON CUADRÍCULA (GRID)
// Solo se usan dos hojas: celebrate (quieto/celebración) y run (movimiento/salto).
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
      scale: 0.10,
      offsetX: -32,
      // Ancla los pies en la base del collider del jugador.
      offsetY: -66,
    },
    celebrate: {
      src: 'assets/TOMY-celebrate.png',
      frames: 36,
      speed: 3,
      cols: 6,
      rows: 6,
      frameWidth: 408,
      frameHeight: 717,
      scale: 0.09,
      offsetX: -24,
      // El frame 1 (quieto) mide ~129 px tras aplicar la escala.
      offsetY: -64.5,
    },
    ready: {
      src: 'assets/TOMY-ready.png',
      frames: 36,
      // Avanza a 30 fps: la postura lista se percibe como animación continua.
      speed: 2,
      cols: 6,
      rows: 6,
      frameWidth: 372,
      frameHeight: 709,
      scale: 0.09,
      offsetX: -25,
      offsetY: -64.5,
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
// CONFIGURACIÓN DEL JUEGO
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
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        gameState = 'menu';
        if (this.onComplete) this.onComplete();
      })
      .catch(err => {
        document.getElementById('loading').innerHTML = 
          '<span style="color:#ef4444;font-size:16px">❌ Error cargando sprites</span><br><br>' +
          '<span style="font-size:13px;color:#64748b">' + err.message + '</span><br><br>' +
          '<span style="font-size:13px;color:#94a3b8">Asegúrate de que los archivos estén en la carpeta assets/</span>';
      });
  }

  updateLoadingUI() {
    const status = document.getElementById('loading-status');
    if (status) status.textContent = this.loaded + ' / ' + this.total + ' archivos cargados';
  }

  get(name) { return this.images[name]; }
}

const spriteLoader = new SpriteLoader(SPRITE_CONFIG);

// ============================================================
// SISTEMA DE ANIMACIÓN CON MODO ESTÁTICO Y ANTI-BLEEDING
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

    // Anti-bleeding: recortamos 0.5px por lado para no tomar píxeles del frame vecino
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

    // Desactivar suavizado para evitar interpolación entre frames
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, sy, sfw, sfh, 0, 0, dw, dh);
    ctx.imageSmoothingEnabled = true;

    ctx.restore();
  }
}

let animator = null;

// ============================================================
// MAPA
// ============================================================
const LEVEL_WIDTH = 200;
const LEVEL_HEIGHT = 15;

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
  plat(5, 10, 3); plat(12, 9, 2, 3); plat(18, 8, 4); plat(25, 10, 2, 3); plat(30, 7, 3);
  plat(38, 9, 3); plat(45, 7, 2); plat(50, 5, 4); plat(58, 8, 2, 3); plat(65, 6, 3);
  plat(72, 9, 2); plat(78, 7, 4); plat(85, 11, 2, 4); plat(92, 10, 2, 4); plat(100, 9, 2, 4);
  plat(108, 10, 3); plat(115, 7, 2, 3); plat(120, 5, 5);
  plat(130, 9, 2); plat(135, 7, 3); plat(142, 5, 2, 3); plat(148, 8, 4); plat(155, 6, 2);
  plat(160, 9, 3); plat(168, 7, 4); plat(175, 5, 3); plat(182, 8, 2, 3); plat(188, 6, 4);
  map[LEVEL_HEIGHT - 3][LEVEL_WIDTH - 5] = 5;
  map[LEVEL_HEIGHT - 4][LEVEL_WIDTH - 5] = 5;
  map[LEVEL_HEIGHT - 5][LEVEL_WIDTH - 5] = 5;
  map[LEVEL_HEIGHT - 6][LEVEL_WIDTH - 5] = 5;
  map[LEVEL_HEIGHT - 7][LEVEL_WIDTH - 5] = 5;
  map[LEVEL_HEIGHT - 8][LEVEL_WIDTH - 5] = 5;
  map[LEVEL_HEIGHT - 3][LEVEL_WIDTH - 4] = 5;
  return map;
}
let levelMap = generateLevel();

// ============================================================
// JUGADOR
// ============================================================
const player = {
  x: 64, y: 320, w: 28, h: 48,
  vx: 0, vy: 0, onGround: false,
  facing: 1, invincible: 0,
  celebrating: false,
  celebrateTimer: 0,
};

// ============================================================
// ENEMIGOS
// ============================================================
function createEnemies() {
  return [
    {x:300,y:384,w:28,h:28,vx:1.5,type:'goomba',dead:false},
    {x:500,y:384,w:28,h:28,vx:-1.5,type:'goomba',dead:false},
    {x:750,y:384,w:28,h:28,vx:1.5,type:'goomba',dead:false},
    {x:1100,y:384,w:28,h:28,vx:-1.5,type:'goomba',dead:false},
    {x:1400,y:384,w:28,h:28,vx:1.5,type:'goomba',dead:false},
    {x:1700,y:384,w:28,h:28,vx:-1.5,type:'goomba',dead:false},
    {x:2000,y:384,w:28,h:28,vx:1.5,type:'goomba',dead:false},
    {x:2500,y:384,w:28,h:28,vx:-1.5,type:'goomba',dead:false},
    {x:2800,y:384,w:28,h:28,vx:1.5,type:'goomba',dead:false},
    {x:3200,y:384,w:28,h:28,vx:-1.5,type:'goomba',dead:false},
    {x:3500,y:384,w:28,h:28,vx:1.5,type:'goomba',dead:false},
    {x:4000,y:384,w:28,h:28,vx:-1.5,type:'goomba',dead:false},
    {x:4500,y:384,w:28,h:28,vx:1.5,type:'goomba',dead:false},
    {x:5000,y:384,w:28,h:28,vx:-1.5,type:'goomba',dead:false},
    {x:5500,y:384,w:28,h:28,vx:1.5,type:'goomba',dead:false},
  ];
}
let enemies = [];

// ============================================================
// MONEDAS
// ============================================================
function createCoins() {
  const coins = [];
  const pos = [
    [6,9],[7,9],[8,9],[12,8],[13,8],[19,7],[20,7],[21,7],[25,9],[26,9],
    [31,6],[32,6],[39,8],[40,8],[46,6],[47,6],[51,4],[52,4],[53,4],[59,7],[60,7],
    [66,5],[67,5],[73,8],[74,8],[79,6],[80,6],[81,6],[109,9],[110,9],[116,6],[117,6],
    [121,4],[122,4],[123,4],[124,4],[131,8],[132,8],[136,6],[137,6],[143,4],[144,4],
    [149,7],[150,7],[151,7],[156,5],[157,5],[161,8],[162,8],[169,6],[170,6],[171,6],
    [176,4],[177,4],[183,7],[184,7],[189,5],[190,5],[191,5],
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
// INPUT
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
  btn.addEventListener('touchstart',e=>{e.preventDefault();touchKeys[keyCode]=true;});
  btn.addEventListener('touchend',e=>{e.preventDefault();touchKeys[keyCode]=false;});
  btn.addEventListener('mousedown',e=>{touchKeys[keyCode]=true;});
  btn.addEventListener('mouseup',e=>{touchKeys[keyCode]=false;});
}
setupTouch('btn-left','ArrowLeft');
setupTouch('btn-right','ArrowRight');
setupTouch('btn-jump','ArrowUp');

function isKeyDown(code){return keys[code]||touchKeys[code];}

// ============================================================
// SELECTOR DE PERSONAJE
// ============================================================
function selectCharacter(name) {
  if (name !== 'tomy') return; // El segundo espacio queda preparado para otro personaje.
  selectedCharacter = name;
  const tomyCard = document.getElementById('character-tomy');
  tomyCard.classList.add('selected');
  tomyCard.setAttribute('aria-pressed', 'true');
}

function drawCharacterPreview() {
  const preview = document.getElementById('character-preview');
  const spriteData = spriteLoader.get('ready');
  if (!preview || !spriteData) return;

  const previewCtx = preview.getContext('2d');
  const col = menuPreviewFrame % spriteData.cols;
  const row = Math.floor(menuPreviewFrame / spriteData.cols);
  const dw = 91;
  const dh = 174;
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
    menuPreviewFrame = (menuPreviewFrame + 1) % spriteLoader.get('ready').frames;
    drawCharacterPreview();
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
  const dh = 170;
  const dw = 97;
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
    spawnParticles(player.x+player.w/2,player.y+player.h,'#fbbf24',5);
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
        else if(player.vy<0){player.y=(ty+1)*TILE+0.1;player.vy=0;if(tile===3){levelMap[ty][tx]=0;score+=100;spawnParticles(tx*TILE+16,ty*TILE+16,'#fbbf24',10);updateUI();}}
      }
      if(tile===5)winGame();
    }
  }

  if(player.y>LEVEL_HEIGHT*TILE+200)playerDie();
  if(player.invincible>0)player.invincible--;

  // === LÓGICA DE ANIMACIÓN ===
  const movingWithKeyboard =
    isKeyDown('ArrowLeft') || isKeyDown('KeyA') ||
    isKeyDown('ArrowRight') || isKeyDown('KeyD');

  if (!player.onGround || movingWithKeyboard) {
    animator.setAnimation('run');
  } else {
    // Se mantiene en loop mientras el jugador está quieto.
    animator.setAnimation('ready');
  }
  animator.update();
}

function updateEnemies(){
  enemies.forEach(e=>{
    if(e.dead)return;
    e.x+=e.vx;
    const tx=Math.floor((e.x+(e.vx>0?e.w:0))/TILE);
    const ty2=Math.floor((e.y+e.h+4)/TILE);
    if(!isSolid(levelMap[ty2][tx])||isSolid(levelMap[Math.floor((e.y+e.h)/TILE)][tx]))e.vx*=-1;
    if(rectIntersect(player,e)&&player.invincible<=0){
      if(player.vy>0&&player.y+player.h<e.y+e.h/2){e.dead=true;player.vy=JUMP_FORCE*0.7;score+=200;spawnParticles(e.x+e.w/2,e.y+e.h/2,'#7c3aed',12);updateUI();}
      else playerDie();
    }
  });
}

function updateCoins(){
  coins.forEach(c=>{
    if(c.collected)return;
    c.bob+=0.08;
    const coinRect={x:c.x,y:c.y+Math.sin(c.bob)*4,w:c.w,h:c.h};
    if(rectIntersect(player,coinRect)){c.collected=true;score+=50;spawnParticles(c.x+8,c.y+8,'#fbbf24',6);updateUI();}
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
  spawnParticles(player.x+player.w/2,player.y+player.h/2,'#ef4444',20);
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
// DIBUJAR MUNDO
// ============================================================
function draw(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const grad=ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0,'#0c4a6e');grad.addColorStop(0.5,'#0369a1');grad.addColorStop(1,'#7dd3fc');
  ctx.fillStyle=grad;ctx.fillRect(0,0,canvas.width,canvas.height);

  drawClouds();drawMountains();

  ctx.save();
  ctx.translate(-Math.floor(cameraX),0);

  const startCol=Math.floor(cameraX/TILE);
  const endCol=startCol+Math.ceil(canvas.width/TILE)+1;

  for(let y=0;y<LEVEL_HEIGHT;y++){
    for(let x=startCol;x<=endCol&&x<LEVEL_WIDTH;x++){
      const tile=levelMap[y][x];
      const px=x*TILE,py=y*TILE;
      if(tile===1){
        ctx.fillStyle='#5d4037';ctx.fillRect(px,py,TILE,TILE);
        ctx.fillStyle='#4caf50';ctx.fillRect(px,py,TILE,6);
        ctx.fillStyle='#795548';
        ctx.fillRect(px+4,py+10,4,4);ctx.fillRect(px+20,py+18,5,5);ctx.fillRect(px+12,py+24,3,3);
      }else if(tile===2){
        ctx.fillStyle='#d97706';ctx.fillRect(px,py,TILE,TILE);
        ctx.strokeStyle='#92400e';ctx.lineWidth=2;ctx.strokeRect(px+1,py+1,TILE-2,TILE-2);
        ctx.beginPath();
        ctx.moveTo(px+TILE/2,py);ctx.lineTo(px+TILE/2,py+TILE);
        ctx.moveTo(px,py+TILE/2);ctx.lineTo(px+TILE/2,py+TILE/2);
        ctx.moveTo(px+TILE/2,py+TILE/4);ctx.lineTo(px+TILE,py+TILE/4);
        ctx.moveTo(px+TILE/2,py+TILE*3/4);ctx.lineTo(px+TILE,py+TILE*3/4);
        ctx.stroke();
      }else if(tile===3){
        ctx.fillStyle='#fbbf24';ctx.fillRect(px+2,py+2,TILE-4,TILE-4);
        ctx.strokeStyle='#d97706';ctx.lineWidth=2;ctx.strokeRect(px+2,py+2,TILE-4,TILE-4);
        ctx.fillStyle='#fef3c7';ctx.fillRect(px+8,py+8,6,6);ctx.fillRect(px+18,py+12,4,4);
      }else if(tile===4){
        ctx.fillStyle='#16a34a';ctx.fillRect(px,py,TILE*2,TILE*2);
        ctx.fillStyle='#15803d';ctx.fillRect(px,py,TILE*2,8);ctx.fillRect(px,py+TILE,TILE*2,4);
        ctx.strokeStyle='#14532d';ctx.lineWidth=2;ctx.strokeRect(px,py,TILE*2,TILE*2);
        ctx.fillStyle='#4ade80';ctx.fillRect(px+4,py+12,4,TILE*2-16);
      }else if(tile===5){
        ctx.fillStyle='#71717a';ctx.fillRect(px+12,py,4,TILE*6);
        ctx.fillStyle='#ef4444';
        ctx.beginPath();ctx.moveTo(px+16,py);ctx.lineTo(px+48,py+16);ctx.lineTo(px+16,py+32);ctx.fill();
      }
    }
  }

  coins.forEach(c=>{
    if(c.collected)return;
    const bobY=Math.sin(c.bob)*4;
    const prispas = spriteLoader.get('prispas');
    if (prispas) {
      // Conserva el tamaño del coleccionable, respetando la proporción de la bolsa.
      ctx.drawImage(prispas.image, c.x - 1, c.y - 7 + bobY, 18, 28);
    }
  });

  enemies.forEach(e=>{
    if(e.dead)return;
    ctx.fillStyle='#7c3aed';
    ctx.beginPath();ctx.arc(e.x+e.w/2,e.y+e.h/2,e.w/2,0,Math.PI*2);ctx.fill();
    const eyeOffset=e.vx>0?4:-4;
    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(e.x+e.w/2-6+eyeOffset,e.y+10,4,0,Math.PI*2);ctx.arc(e.x+e.w/2+6+eyeOffset,e.y+10,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#000';
    ctx.beginPath();ctx.arc(e.x+e.w/2-6+eyeOffset+(e.vx>0?1:-1),e.y+10,2,0,Math.PI*2);ctx.arc(e.x+e.w/2+6+eyeOffset+(e.vx>0?1:-1),e.y+10,2,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#4c1d95';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(e.x+4,e.y+4);ctx.lineTo(e.x+12,e.y+6);ctx.moveTo(e.x+e.w-4,e.y+4);ctx.lineTo(e.x+e.w-12,e.y+6);ctx.stroke();
  });

  particles.forEach(p=>{ctx.globalAlpha=p.life/50;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);});
  ctx.globalAlpha=1;

  // === DIBUJAR PERSONAJE TOMY ===
  if(player.invincible<=0||Math.floor(player.invincible/4)%2===0){
    animator.draw(ctx, player.x, player.y, player.facing, player.w, player.h);
  }

  ctx.restore();
}

function drawClouds(){
  const clouds=[
    {x:100,y:60,s:1},{x:350,y:40,s:0.8},{x:600,y:80,s:1.2},{x:900,y:50,s:0.9},
    {x:1200,y:70,s:1},{x:1500,y:45,s:0.7},{x:1800,y:65,s:1.1},{x:2100,y:55,s:0.85},
    {x:2400,y:75,s:1},{x:2700,y:50,s:0.9},{x:3000,y:70,s:1.2},{x:3300,y:60,s:0.8},
    {x:3600,y:80,s:1},{x:3900,y:45,s:0.9},{x:4200,y:65,s:1.1},{x:4500,y:55,s:0.85},
    {x:4800,y:75,s:1},{x:5100,y:50,s:0.9},{x:5400,y:70,s:1.2},{x:5700,y:60,s:0.8},
  ];
  ctx.fillStyle='rgba(255,255,255,0.15)';
  clouds.forEach(c=>{
    const parallaxX=(c.x-cameraX*0.3)%(LEVEL_WIDTH*TILE);
    const drawX=parallaxX<-100?parallaxX+LEVEL_WIDTH*TILE:parallaxX;
    const s=c.s;
    ctx.beginPath();ctx.arc(drawX,c.y,25*s,0,Math.PI*2);
    ctx.arc(drawX+25*s,c.y-8*s,30*s,0,Math.PI*2);ctx.arc(drawX+50*s,c.y,22*s,0,Math.PI*2);ctx.fill();
  });
}

function drawMountains(){
  ctx.fillStyle='rgba(6,182,212,0.2)';
  for(let i=0;i<20;i++){
    const mx=(i*400-cameraX*0.2)%(LEVEL_WIDTH*TILE);
    const drawX=mx<-200?mx+LEVEL_WIDTH*TILE:mx;
    ctx.beginPath();ctx.moveTo(drawX,canvas.height);ctx.lineTo(drawX+100,canvas.height-150);ctx.lineTo(drawX+200,canvas.height);ctx.fill();
  }
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
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('win-screen').classList.add('hidden');
  document.getElementById('menu-button').classList.remove('hidden');
  score=0;lives=3;timeLeft=300;cameraX=0;
  player.x=64;player.y=320;player.vx=0;player.vy=0;player.invincible=0;
  player.celebrating=false;player.celebrateTimer=0;
  levelMap=generateLevel();enemies=createEnemies();coins=createCoins();particles=[];
  gameState='playing';updateUI();startTimer();gameLoop();
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
  document.getElementById('start-screen').classList.remove('hidden');
  drawMenu();drawCharacterPreview();requestAnimationFrame(updateMenuPreview);
}

function gameOver(){
  gameState='gameover';
  if(timerInterval)clearInterval(timerInterval);
  document.getElementById('final-score').textContent=score;
  document.getElementById('gameover-screen').classList.remove('hidden');
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
  spawnParticles(player.x+player.w/2,player.y,'#fbbf24',30);
}

function gameLoop(){
  if(gameState!=='playing')return;
  updatePlayer();updateEnemies();updateCoins();updateParticles();updateCamera();draw();
  requestAnimationFrame(gameLoop);
}

function drawMenu(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad=ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0,'#0c4a6e');grad.addColorStop(0.5,'#0369a1');grad.addColorStop(1,'#7dd3fc');
  ctx.fillStyle=grad;ctx.fillRect(0,0,canvas.width,canvas.height);
  drawClouds();drawMountains();
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
spriteLoader.onComplete = () => {
  animator = new Animator(spriteLoader);
  drawMenu();
  drawCharacterPreview();
  requestAnimationFrame(updateMenuPreview);
};

spriteLoader.load();
