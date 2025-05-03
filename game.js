/* Space Invaders v7 – Desktop & Mobile mit Fullscreen, Pause & Sound */
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

/* === DOM === */
const overlay         = document.getElementById('overlay');
const waveOverlay     = document.getElementById('waveOverlay');
const waveMsg         = document.getElementById('waveMsg');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const winOverlay      = document.getElementById('winOverlay');

const startBtn        = document.getElementById('startBtn');
const restartBtn      = document.getElementById('restartBtn');
const restartWinBtn   = document.getElementById('restartWinBtn');

const scoreLabel      = document.getElementById('scoreLabel');
const livesLabel      = document.getElementById('livesLabel');
const levelLabel      = document.getElementById('levelLabel');

const btnLeft         = document.getElementById('btnLeft');
const btnRight        = document.getElementById('btnRight');
const btnFire         = document.getElementById('btnFire');

const fsBtn           = document.getElementById('fsBtn');
const exitFsBtn       = document.getElementById('exitFsBtn');
const pauseBtn        = document.getElementById('pauseBtn');
const soundBtn        = document.getElementById('soundBtn');   // <-- NEU

/* === Sounds === */
const bgMusic    = new Audio('assets/8-bit.mp3');
bgMusic.loop     = true;
bgMusic.volume   = 0.4;          // etwas leiser

const laserPlayer = () => new Audio('assets/laser.mp3');
const laserAlien  = () => new Audio('assets/laser-alien.mp3');

let soundEnabled  = true;

/* === Sprites === */
const PLAYER_SPRITE = ['0011100','0111110','1111111','1111111','0111110'];
const ENEMY_SPRITE  = ['00100','01110','11111','10101','01010'];
const PIXEL = 4;

/* === Konstanten === */
const PLAYER_WIDTH  = PLAYER_SPRITE[0].length * PIXEL;
const PLAYER_HEIGHT = PLAYER_SPRITE.length      * PIXEL;
const ENEMY_WIDTH   = ENEMY_SPRITE[0].length  * PIXEL;
const ENEMY_HEIGHT  = ENEMY_SPRITE.length      * PIXEL;

const PLAYER_SPEED  = 4;
const BULLET_WIDTH  = 2 * PIXEL;
const BULLET_HEIGHT = 5 * PIXEL;
const BULLET_SPEED  = 7;

const ENEMY_ROWS_BASE = 4;
const ENEMY_COLS_BASE = 8;
const ENEMY_H_SPACING = 10;
const ENEMY_V_SPACING = 20;
const ENEMY_START_Y   = 60;
const ENEMY_STEP_DOWN = 20;
const ENEMY_BULLET_SPEED = 3;

let ENEMY_SPEED_X_BASE      = 1;
let ENEMY_SHOOT_CHANCE_BASE = 0.002;

/* === Game-State === */
let level, player, bullets, enemyBullets, enemies;
let keys, score, lives, gameOver, gameWin;
let hitFlash, invincible, paused;

/* === Init === */
function init(){
  player       = { x:canvas.width/2-PLAYER_WIDTH/2,
                   y:canvas.height-PLAYER_HEIGHT-10 };
  bullets      = [];
  enemyBullets = [];
  enemies      = [];
  keys         = {};
  score = 0; lives = 3; level = 1;
  gameOver = gameWin = false;
  hitFlash = 0; invincible = false; paused = false;
  pauseBtn.textContent = 'pause';
  if (soundEnabled) bgMusic.play().catch(() => {});
  spawnWave(); updateHUD();
}

/* === Wellen-Generator === */
function spawnWave(){
  enemies = [];
  const rows   = ENEMY_ROWS_BASE + Math.floor(level/3);
  const speed  = ENEMY_SPEED_X_BASE + (level-1)*0.3;
  const shootC = ENEMY_SHOOT_CHANCE_BASE * (1+(level-1)*0.4);

  for(let r=0;r<rows;r++){
    for(let c=0;c<ENEMY_COLS_BASE;c++){
      enemies.push({
        x:40 + c*(ENEMY_WIDTH+ENEMY_H_SPACING),
        y:ENEMY_START_Y + r*(ENEMY_HEIGHT+ENEMY_V_SPACING),
        alive:true
      });
    }
  }
  enemies.speedX = speed;
  enemies.shootChance = shootC;
}

/* === HUD === */
const updateHUD = () => {
  scoreLabel.textContent = `SCORE: ${score}`;
  livesLabel.textContent = `LIVES: ${lives}`;
  levelLabel.textContent = `WAVE ${level}`;
};

/* === Drawing === */
function drawPixelSprite(sprite,x,y){
  ctx.fillStyle='#33ff33';
  sprite.forEach((row,ry)=>[...row].forEach((b,cx)=>b==='1'&&ctx.fillRect(x+cx*PIXEL,y+ry*PIXEL,PIXEL,PIXEL)));
}
const drawPlayer  = () => { if(!invincible || Math.floor(hitFlash/4)%2) drawPixelSprite(PLAYER_SPRITE,player.x,player.y); };
const drawEnemies = () => enemies.forEach(e=>e.alive&&drawPixelSprite(ENEMY_SPRITE,e.x,e.y));
function drawBullets(){
  ctx.fillStyle='#33ff33';
  bullets.forEach(b=>ctx.fillRect(b.x,b.y,BULLET_WIDTH,BULLET_HEIGHT));
  enemyBullets.forEach(b=>ctx.fillRect(b.x,b.y,BULLET_WIDTH,BULLET_HEIGHT));
}

/* === Mechanics === */
const rectI = (a,aw,ah,b,bw,bh)=>a.x<b.x+bw&&a.x+aw>b.x&&a.y<b.y+bh&&a.y+ah>b.y;

function fireBullet(){
  bullets.push({ x:player.x+PLAYER_WIDTH/2-BULLET_WIDTH/2,
                 y:player.y-BULLET_HEIGHT });
  if(soundEnabled) laserPlayer().play();
}
function movePlayer(){
  if(keys['ArrowLeft'])  player.x-=PLAYER_SPEED;
  if(keys['ArrowRight']) player.x+=PLAYER_SPEED;
  player.x = Math.max(0,Math.min(canvas.width-PLAYER_WIDTH,player.x));
}
function moveBullets(){
  bullets.forEach(b=>b.y-=BULLET_SPEED);
  bullets = bullets.filter(b=>b.y+BULLET_HEIGHT>0);
  enemyBullets.forEach(b=>b.y+=ENEMY_BULLET_SPEED);
  enemyBullets = enemyBullets.filter(b=>b.y<canvas.height);
}
function moveEnemies(){
  let edge=false;
  enemies.forEach(e=>{
    if(!e.alive) return;
    e.x+=enemies.speedX;
    if(e.x<=0||e.x+ENEMY_WIDTH>=canvas.width) edge=true;
  });
  if(edge){
    enemies.speedX*=-1;
    enemies.forEach(e=>{
      e.y+=ENEMY_STEP_DOWN;
      if(e.alive&&e.y+ENEMY_HEIGHT>=player.y) gameOver=true;
    });
  }
}
function enemyActions(){
  enemies.forEach(e=>{
    if(!e.alive) return;
    if(Math.random()<enemies.shootChance){
      enemyBullets.push({x:e.x+ENEMY_WIDTH/2-BULLET_WIDTH/2,
                         y:e.y+ENEMY_HEIGHT});
      if(soundEnabled) laserAlien().play();
    }
  });
}
function collisions(){
  bullets.forEach(b=>enemies.forEach(e=>{
    if(e.alive&&rectI(b,BULLET_WIDTH,BULLET_HEIGHT,e,ENEMY_WIDTH,ENEMY_HEIGHT)){
      e.alive=false; b.hit=true; score+=100;
    }
  }));
  bullets = bullets.filter(b=>!b.hit);

  if(!invincible){
    enemyBullets.forEach(b=>{
      if(rectI(b,BULLET_WIDTH,BULLET_HEIGHT,player,PLAYER_WIDTH,PLAYER_HEIGHT)){
        b.hit=true; lives--; invincible=true; hitFlash=60;
        if(lives<=0) gameOver=true;
      }
    });
  }
  enemyBullets = enemyBullets.filter(b=>!b.hit);
}
function handleBlink(){ if(invincible && --hitFlash<=0) invincible=false; }
function checkWaveClear(){
  if(enemies.every(e=>!e.alive)){
    level++; if(level>15){gameWin=true;return;}
    waveMsg.textContent=`WAVE ${level}`;
    waveOverlay.classList.remove('hidden');
    setTimeout(()=>waveOverlay.classList.add('hidden'),1200);
    spawnWave();
  }
}

/* === Game-Loop === */
function gameLoop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(!paused){
    movePlayer(); moveBullets(); moveEnemies();
    enemyActions(); collisions(); handleBlink();
    checkWaveClear(); updateHUD();
  }

  drawPlayer(); drawEnemies(); drawBullets();

  if(gameOver){ gameOverOverlay.classList.remove('hidden'); return; }
  if(gameWin){  winOverlay.classList.remove('hidden');   return; }

  requestAnimationFrame(gameLoop);
}

/* === Fullscreen, Pause, Sound === */
function togglePause(){
  paused=!paused;
  pauseBtn.textContent = paused?'play_arrow':'pause';
  if(!paused) requestAnimationFrame(gameLoop);
}
function enterFs(){ if(!document.fullscreenElement) document.documentElement.requestFullscreen(); }
function exitFs(){  if(document.fullscreenElement)   document.exitFullscreen(); }
function toggleSound(){
  soundEnabled=!soundEnabled;
  soundBtn.textContent = soundEnabled?'volume_up':'volume_off';
  if(soundEnabled){ bgMusic.play().catch(()=>{}); }
  else             { bgMusic.pause(); }
}
document.addEventListener('fullscreenchange',()=>{
  const on=!!document.fullscreenElement;
  fsBtn.classList.toggle('hidden',  on);
  exitFsBtn.classList.toggle('hidden', !on);
});
fsBtn.addEventListener('click',enterFs);
exitFsBtn.addEventListener('click',exitFs);
pauseBtn.addEventListener('click',togglePause);
soundBtn.addEventListener('click',toggleSound);

/* === Input === */
keys={};
document.addEventListener('keydown',e=>{
  if(e.key==='p'||e.key==='P'){togglePause();return;}
  if(e.key==='m'||e.key==='M'){toggleSound();return;}
  keys[e.key]=true;
  if(e.key===' '){e.preventDefault();fireBullet();}
});
document.addEventListener('keyup',e=>keys[e.key]=false);

function bind(btn,key){
  btn.addEventListener('pointerdown',e=>{e.preventDefault();keys[key]=true;if(key===' ')fireBullet();});
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,()=>keys[key]=false));
}
bind(btnLeft,'ArrowLeft'); bind(btnRight,'ArrowRight'); bind(btnFire,' ');

/* === Start / Restart === */
const startGame   =()=>{overlay.classList.add('hidden');init();requestAnimationFrame(gameLoop);};
const restartGame =()=>{gameOverOverlay.classList.add('hidden');init();requestAnimationFrame(gameLoop);};
const restartWin  =()=>{winOverlay.classList.add('hidden');init();requestAnimationFrame(gameLoop);};
[startBtn,restartBtn,restartWinBtn].forEach((b,i)=>{
  const fn=[startGame,restartGame,restartWin][i];
  b.addEventListener('click',fn);
  b.addEventListener('pointerdown',fn);
});

/* === Autoplay-Fallback === */
window.addEventListener('load',()=>{ if(soundEnabled) bgMusic.play().catch(()=>{}); });
