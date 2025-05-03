/* Space Invaders – Vanilla JS */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const overlay = document.getElementById('overlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const winOverlay = document.getElementById('winOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const restartWinBtn = document.getElementById('restartWinBtn');
const scoreLabel = document.getElementById('scoreLabel');
const livesLabel = document.getElementById('livesLabel');

// Game constants
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 4;

const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 10;
const BULLET_SPEED = 6;

const ENEMY_ROWS = 4;
const ENEMY_COLS = 8;
const ENEMY_WIDTH = 30;
const ENEMY_HEIGHT = 20;
const ENEMY_H_SPACING = 10;
const ENEMY_V_SPACING = 20;
const ENEMY_START_Y = 60;
let ENEMY_SPEED_X = 1;   // horizontal speed (changes dir)
const ENEMY_STEP_DOWN = 20;

const ENEMY_BULLET_SPEED = 3;
const ENEMY_SHOOT_CHANCE = 0.002; // probability per frame per enemy

// Game state
let player;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let keys = {};
let score = 0;
let lives = 3;
let gameOver = false;
let gameWin = false;

function init() {
  player = {
    x: canvas.width / 2 - PLAYER_WIDTH / 2,
    y: canvas.height - PLAYER_HEIGHT - 10,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT
  };
  bullets = [];
  enemyBullets = [];
  enemies = [];
  score = 0;
  lives = 3;
  gameOver = false;
  gameWin = false;
  ENEMY_SPEED_X = 1;
  // Create enemies
  for (let row = 0; row < ENEMY_ROWS; row++) {
    for (let col = 0; col < ENEMY_COLS; col++) {
      enemies.push({
        x: 40 + col * (ENEMY_WIDTH + ENEMY_H_SPACING),
        y: ENEMY_START_Y + row * (ENEMY_HEIGHT + ENEMY_V_SPACING),
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        alive: true
      });
    }
  }
  updateHUD();
}

function updateHUD() {
  scoreLabel.textContent = `SCORE: ${score}`;
  livesLabel.textContent = `LIVES: ${lives}`;
}

function drawPlayer() {
  ctx.fillStyle = '#33ff33';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawEnemies() {
  ctx.fillStyle = '#33ff33';
  enemies.forEach(e => {
    if (e.alive) ctx.fillRect(e.x, e.y, e.width, e.height);
  });
}

function drawBullets() {
  ctx.fillStyle = '#33ff33';
  bullets.forEach(b => ctx.fillRect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT));
  enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT));
}

function movePlayer() {
  if (keys['ArrowLeft']) player.x -= PLAYER_SPEED;
  if (keys['ArrowRight']) player.x += PLAYER_SPEED;
  // Boundaries
  player.x = Math.max(0, Math.min(canvas.width - PLAYER_WIDTH, player.x));
}

function moveBullets() {
  bullets.forEach(b => b.y -= BULLET_SPEED);
  bullets = bullets.filter(b => b.y + BULLET_HEIGHT > 0);
  enemyBullets.forEach(b => b.y += ENEMY_BULLET_SPEED);
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height);
}

function moveEnemies() {
  let hitEdge = false;
  enemies.forEach(e => {
    if (!e.alive) return;
    e.x += ENEMY_SPEED_X;
    if (e.x <= 0 || e.x + ENEMY_WIDTH >= canvas.width) hitEdge = true;
  });
  if (hitEdge) {
    ENEMY_SPEED_X *= -1;
    enemies.forEach(e => {
      e.y += ENEMY_STEP_DOWN;
      // Check reach bottom
      if (e.alive && e.y + ENEMY_HEIGHT >= player.y) {
        gameOver = true;
      }
    });
  }
}

function enemyActions() {
  enemies.forEach(e => {
    if (!e.alive) return;
    if (Math.random() < ENEMY_SHOOT_CHANCE) {
      enemyBullets.push({
        x: e.x + ENEMY_WIDTH / 2 - BULLET_WIDTH / 2,
        y: e.y + ENEMY_HEIGHT
      });
    }
  });
}

function collisions() {
  // Player bullets vs enemies
  bullets.forEach(b => {
    enemies.forEach(e => {
      if (e.alive && rectIntersect(b, BULLET_WIDTH, BULLET_HEIGHT, e, ENEMY_WIDTH, ENEMY_HEIGHT)) {
        e.alive = false;
        b.hit = true;
        score += 100;
      }
    });
  });
  bullets = bullets.filter(b => !b.hit);

  // Enemy bullets vs player
  enemyBullets.forEach(b => {
    if (rectIntersect(b, BULLET_WIDTH, BULLET_HEIGHT, player, PLAYER_WIDTH, PLAYER_HEIGHT)) {
      b.hit = true;
      lives--;
      if (lives <= 0) gameOver = true;
    }
  });
  enemyBullets = enemyBullets.filter(b => !b.hit);
}

function rectIntersect(a, aw, ah, b, bw, bh) {
  return a.x < b.x + bw &&
         a.x + aw > b.x &&
         a.y < b.y + bh &&
         a.y + ah > b.y;
}

function fireBullet() {
  bullets.push({
    x: player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
    y: player.y - BULLET_HEIGHT
  });
}

function checkWin() {
  if (enemies.every(e => !e.alive)) {
    gameWin = true;
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  movePlayer();
  moveBullets();
  moveEnemies();
  enemyActions();
  collisions();
  checkWin();
  updateHUD();

  drawPlayer();
  drawEnemies();
  drawBullets();

  if (gameOver) {
    gameOverOverlay.classList.remove('hidden');
    return;
  }
  if (gameWin) {
    winOverlay.classList.remove('hidden');
    return;
  }

  requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (e.key === ' ') {
    e.preventDefault();
    fireBullet();
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

startBtn.addEventListener('click', () => {
  overlay.classList.add('hidden');
  init();
  requestAnimationFrame(gameLoop);
});

restartBtn.addEventListener('click', () => {
  gameOverOverlay.classList.add('hidden');
  init();
  requestAnimationFrame(gameLoop);
});
restartWinBtn.addEventListener('click', () => {
  winOverlay.classList.add('hidden');
  init();
  requestAnimationFrame(gameLoop);
});
