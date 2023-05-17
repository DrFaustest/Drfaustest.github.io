
// Test.js
import {GameDisplay} from "./DisplayClass.js";// constructor(gameContext, gameCanvas, scaleFactor), drawStartScreen(), drawHUD(lives, score, startTime), drawGameOverScreen(score)
import {Bullet} from "./BulletClass.js";// constructor(ship, scaleFactor), draw(gameContext), move(), static spawn(ship, scaleFactor)
import {Enemy} from "./EnemyClass.js";// constructor(gameCanvas, scaleFactor, type = Math.random() < 0.7 ? 1 : 2), draw(gameContext), move(), static spawn(gameCanvas, scaleFactor)
import {LifePickup} from "./LivesClass.js";//constructor(x, y, scaleFactor), move(), draw(gameContext), isCollidingWith(ship), static spawnLifePickups(gameCanvas, scaleFactor, spawnX)
import {Ship} from "./ShipClass.js";// constructor(gameCanvas, scaleFactor), draw(gameContext), move(keys)

const gameCanvas = document.getElementById("gameCanvas");
const gameContext = gameCanvas.getContext("2d");
gameCanvas.width = window.innerWidth - (window.innerWidth * 0.1);
gameCanvas.height = window.innerHeight - (window.innerHeight * 0.1);
const baseScreenWidth = 800;
const scaleFactor = Math.max(1, gameCanvas.height / baseScreenWidth);

let gameState = 1;
let score = 0;
let keys = {};
let gameStarted = false;
let gameOver = false;
let autoFireInterval = null;

let display = new GameDisplay(gameContext, gameCanvas, scaleFactor);


let ship = new Ship(gameCanvas, scaleFactor);

const lifePickups = [];
const lives = 3;


const enemies = [];
const bullets = [];

const laserSound = new Audio(
  "../sounds/zapsplat_cartoon_anime_hit_zap_laser.mp3"
);
laserSound.playbackRate = 2;
const destroySound = new Audio(
  "../sounds/esm_8bit_explosion_medium_with_voice_bomb_boom_blast_cannon_retro_old_school_classic_cartoon.mp3"
);

function playDestroySound() {
  destroySound.play();
}

function gameLoop() {
  console.log("gameLoop started");
  if (lives <= 0) {
    gameState = 3;
    gameLoop();
  }
  if (gameState == 1) {
    display.drawStartScreen();
    console.log("gameState is StartScreen");
  } else if (gameState == 2) {
    console.log("gameState is HUD");
    display.clearCanvas();
    display.drawHUD(lives, score, new Date().getTime());
    update();
    requestAnimationFrame(gameLoop);
  } else if (gameState ==3) {
    display.clearCanvas();
    console.log("gameState is GameOverScreen");
    display.drawGameOverScreen(score);
    window.addEventListener("keydown", restartGame);
    window.addEventListener("click", restartGame);
    window.addEventListener("touchstart", restartGame);
  }
}
function restartGame() {
  // Add your restart logic here
  window.removeEventListener("keydown", restartGame);
  window.removeEventListener("click", restartGame);
  window.removeEventListener("touchstart", restartGame);
  gameState = 1;
  lives = 3; // Change `livesRemaining` to `lives`
  score = 0;
  enemies.length = 0;
  bullets.length = 0;
  lifePickups.length = 0;
  ship = new Ship(gameCanvas, scaleFactor);
  gameLoop();
}


function handleStartGame() {
  console.log("handleStartGame called");
  gameStarted = true;
  gameState = 2;
  window.removeEventListener("keydown", handleStartGame);
  window.removeEventListener("click", handleStartGame);
  window.removeEventListener("touchstart", handleStartGame);
  gameLoop();
}

function update(){
  if (gameStarted) {
    assetSpawn();
    updateEnemies();
    updateBullets();
    updateLifePickups();
    checkCollisions();
    ship.draw(gameContext);
  }
}

function updateEnemies(){
  enemies.forEach((enemy, index) => {
    if (enemy.move()) {
      enemies.splice(index, 1);
      lives--;
    } else {
      enemy.draw(gameContext);
    }
  });
}

function updateBullets(){
  bullets.forEach((bullet, index) => {
    bullet.draw(gameContext);
    bullet.move();
    if (bullet.y < 0) {
      bullets.splice(index, 1);
    }
  });
}

function updateLifePickups(){
  lifePickups.forEach((lifePickup, index) => {
    lifePickup.draw(gameContext);
    lifePickup.move();
    if (lifePickup.y > gameCanvas.height) {
      lifePickups.splice(index, 1);
    }
  });
}

function checkCollisions(){
  enemies.forEach((enemy, index) => {
    bullets.forEach((bullet, bulletIndex) => {
      const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
      if (dist - enemy.size - 5 < 1) {
        enemy.hitPoints--; 
        bullets.splice(bulletIndex, 1); 
        if (enemy.hitPoints <= 0) { 
          score += enemy.type === 1 ? 1 : 5; 
          playDestroySound();
          enemies.splice(index, 1);
        }
      }
    });
    const dist = Math.hypot(ship.x - enemy.x, ship.y - enemy.y);
    if (dist - enemy.size - ship.size < 1) {
      playDestroySound();
      enemies.splice(index, 1);
      livesRemaining--;
    }
  });
  lifePickups.forEach((lifePickup, index) => {
    const dist = Math.hypot(ship.x - lifePickup.x, ship.y - lifePickup.y);
    if (dist - lifePickup.size - ship.size < 1) {
      //playLifePickupSound();
      lifePickups.splice(index, 1);
      livesRemaining++;
    }
  });
}

function assetSpawn() {
  if (enemies.length < 10) {
    enemies.push(new Enemy(gameCanvas, scaleFactor));
  }
  if (score % 30 === 0 && score !== 0 && lifePickups.length <= 2) {
    lifePickups.push(new LifePickup(gameCanvas.width / 2, 0, scaleFactor));
  }
}

//Event listeners
function setupEventListeners() {
  document.addEventListener("mousedown", handleStartGame);
  document.addEventListener("touchstart", handleStartGame);

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === " ") {
      bullets.push(fireBullet());
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
    if (e.key === " " && gameOver) {
      gameOver = false;
      score = 0;
      bullets.length = 0;
      enemies.length = 0;
      gameStarted = false;
    }
  });
  window.addEventListener("mousemove", (e) => {
    ship.move(e.clientX - ship.width / 2);
  });
  window.addEventListener("mousedown", (e) => {
    bullets.push(Bullet.spawn(ship, scaleFactor));
  });
  window.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      ship.move(e.touches[0].clientX - ship.width / 2);
    },
    { passive: false }
  );
  window.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      bullets.push(Bullet.spawn(ship, scaleFactor));
      if (!autoFireInterval) {
        autoFireInterval = setInterval(() => bullets.push(Bullet.spawn(ship, scaleFactor)), 500); // Fires every 500ms
      }
    },
    { passive: false }
  );
  window.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault();
      if (autoFireInterval) {
        clearInterval(autoFireInterval);
        autoFireInterval = null;
      }
    },
    { passive: false }
  );
}

// wait for the window to load and than start the game
window.addEventListener("load", () => {
setupEventListeners();
gameLoop();
});