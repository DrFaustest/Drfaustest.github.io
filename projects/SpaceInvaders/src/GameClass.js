import { GameDisplay } from "./DisplayClass.js";
import { Bullet } from "./BulletClass.js";
import { Enemy } from "./EnemyClass.js";
import { LifePickup } from "./LivesClass.js";
import { Ship } from "./ShipClass.js";


class Game {
  constructor() {
    this.gameCanvas = document.getElementById("gameCanvas");
    this.gameContext = this.gameCanvas.getContext("2d");
    this.gameCanvas.width = window.innerWidth - window.innerWidth * 0.1;
    this.gameCanvas.height = window.innerHeight - window.innerHeight * 0.1;
    this.baseScreenWidth = 800;
    this.scaleFactor = Math.max(1, this.gameCanvas.height / this.baseScreenWidth);

    this.gameState = 1;
    this.score = 0;
    this.keys = {};
    this.gameStarted = false;
    this.gameOver = false;
    this.autoFireInterval = null;
    this.startTime = null;
    this.display = new GameDisplay(this.gameContext, this.gameCanvas, this.scaleFactor);
    this.ship = new Ship(this.gameCanvas, this.scaleFactor);
    this.lifePickups = [];
    this.lives = 3;
    this.extraLivesDropped = 0;
    this.enemies = [];
    this.bullets = [];

    this.laserSound = new Audio("../sounds/zapsplat_cartoon_anime_hit_zap_laser.mp3");
    this.laserSound.playbackRate = 2;
    this.destroySound = new Audio(
      "../sounds/esm_8bit_explosion_medium_with_voice_bomb_boom_blast_cannon_retro_old_school_classic_cartoon.mp3"
    );

    this.setupEventListeners();
    this.gameLoop();
  }

  playDestroySound() {
    this.destroySound.play();
  }

  async gameLoop() {
    console.log("gameLoop started");
  
    const loop = async () => {
      switch(this.gameState) {
        case 1:
          this.display.clearCanvas();
          this.display.drawStartScreen();
          console.log("gameState is StartScreen");
          this.lives = 3;
          await this.waitForStart();
          this.gameState = 2;
          console.log("gameState is HUD");
          this.display.clearCanvas();
          this.startTime = Date.now();
          break;
        case 2:
          this.display.drawHUD(this.lives, this.score, this.startTime);
          this.update();
          if (this.gameOver) {
            this.gameState = 3;
            this.display.clearCanvas();
          }
          break;
        case 3:
          console.log("gameState is GameOverScreen");
          this.display.drawGameOverScreen(this.score);
          await this.waitForRestart();
          this.gameState = 1;
          this.display.clearCanvas();
          break;
      }
  
      // Call loop again on next frame
      requestAnimationFrame(loop);
    }
  
    // Start the loop
    loop();
  }
  
  
  async waitForStart() {
    return new Promise((resolve) => {
      this.waitForStartResolve = resolve;
    });
  }

  async waitForRestart() {
    return new Promise((resolve) => {
      this.waitForRestartResolve = resolve;
    });
  }

  restartGame() {
    console.log("restartGame called");
    this.gameState = 1;
    this.lives = 3;
    this.score = 0;
    this.enemies.length = 0;
    this.bullets.length = 0;
    this.lifePickups.length = 0;
    this.extraLivesDropped = 0;
    this.ship = new Ship(this.gameCanvas, this.scaleFactor);
    this.gameOver = false;
    this.gameStarted = false;
    this.startTime = null;
  }

  handleStartGame() {
    console.log("handleStartGame called");
    this.gameStarted = true;
    this.gameState = 2;
  }

  update() {
    if (this.gameStarted) {
      this.gameContext.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
      this.display.drawHUD(this.lives, this.score, this.startTime);
      this.assetSpawn();
      this.updateEnemies();
      this.updateBullets();
      this.updateLifePickups();
      this.checkCollisions();
      this.ship.draw(this.gameContext);
    }

    if (this.lives <= 0) {
      this.gameOver = true;
    }
  }

  updateEnemies() {
    this.enemies.forEach((enemy, index) => {
      if (enemy.move()) {
        this.enemies.splice(index, 1);
        this.lives--;
      } else {
        enemy.draw(this.gameContext);
      }
    });
  }

  updateBullets() {
    this.bullets.forEach((bullet, index) => {
      bullet.draw(this.gameContext);
      bullet.move();
      if (bullet.y < 0) {
        this.bullets.splice(index, 1);
      }
    });
  }

  updateLifePickups() {
    this.lifePickups.forEach((lifePickup, index) => {
      lifePickup.draw(this.gameContext);
      lifePickup.move();
      if (lifePickup.y > this.gameCanvas.height) {
        this.lifePickups.splice(index, 1);
      }
    });
  }

  checkCollisions() {
    this.enemies.forEach((enemy, index) => {
      this.bullets.forEach((bullet, bulletIndex) => {
        const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
        if (dist - enemy.size - 5 < 1) {
          enemy.hitPoints--;
          this.bullets.splice(bulletIndex, 1);
          if (enemy.hitPoints <= 0) {
            this.score += enemy.type === 1 ? 1 : 5;
            this.playDestroySound();
            this.enemies.splice(index, 1);
          }
        }
      });
      const dist = Math.hypot(this.ship.x - enemy.x, this.ship.y - enemy.y);
      if (dist - enemy.size - this.ship.size < 1) {
        this.playDestroySound();
        this.enemies.splice(index, 1);
        this.lives--;
      }
    });
    this.lifePickups.forEach((lifePickup, index) => {
      const dist = Math.hypot(this.ship.x - lifePickup.x, this.ship.y - lifePickup.y);
      if (dist - lifePickup.size - this.ship.size < 1) {
        this.lifePickups.splice(index, 1);
        this.lives++;
      }
    });
  }

  assetSpawn() {
    const maxEnemies = 10;
    const spawnInterval = 500; // Time in milliseconds to spawn an enemy

    // Spawn enemies at a regular interval
    if (this.enemies.length < maxEnemies && !this.enemySpawnInterval) {
      this.enemySpawnInterval = setInterval(() => {
        this.enemies.push(Enemy.spawn(this.gameCanvas, this.scaleFactor));
      }, spawnInterval);
    }
    

    // If the number of enemies exceeds maxEnemies, stop spawning
    if (this.enemies.length >= maxEnemies && this.enemySpawnInterval) {
        clearInterval(this.enemySpawnInterval);
        this.enemySpawnInterval = null;
    }

    // Drop an extra life every 30 points
    let livesToDrop = Math.floor(this.score / 30);
    if (livesToDrop > this.extraLivesDropped && this.lifePickups.length <= 2) {
        this.lifePickups.push(new LifePickup(this.gameCanvas.width / 2, 0, this.scaleFactor));
        this.extraLivesDropped++;
    }
}

  
setupEventListeners() {
    window.addEventListener("keydown", (e) => {
      switch (this.gameState) {
        case 1:  // Before the game starts
          if (e.key === " ") {
            e.preventDefault();
            this.handleStartGame();
            this.waitForStartResolve();
          }
          break;
        case 2:  // During the game
          this.keys[e.key] = true;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            this.ship.move(e.key);
          }
          break;
        case 3:  // Game over
          if (e.key === " ") {
            this.gameOver = false;
            this.restartGame();
            this.waitForRestartResolve();
          }
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      if (this.gameState === 2) { // Only disable keys during the game
        this.keys[e.key] = false;
      }
    });

    window.addEventListener("mousedown", (e) => {
      switch (this.gameState) {
        case 1: // Before the game starts
          this.handleStartGame();
          this.waitForStartResolve();
          break;
        case 2: // During the game
          this.bullets.push(Bullet.spawn(this.ship, this.scaleFactor, this.laserSound));
          this.autoFireInterval = setInterval(
            () => this.bullets.push(Bullet.spawn(this.ship, this.scaleFactor, this.laserSound)),
            500
          );
          break;
        case 3: // Game over
            this.gameOver = false;
            this.restartGame();
            this.waitForRestartResolve();
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (this.gameState === 2 && this.autoFireInterval) { // Only stop autofire during the game
        clearInterval(this.autoFireInterval);
        this.autoFireInterval = null;
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (this.gameState === 2) { // During the game
        this.ship.move(e.clientX);
      }
    });

    window.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        switch (this.gameState) {
          case 1: // Before the game starts
            this.handleStartGame();
            this.waitForStartResolve();
            break;
          case 2: // During the game
            this.bullets.push(Bullet.spawn(this.ship, this.scaleFactor, this.laserSound));
            this.autoFireInterval = setInterval(
              () => this.bullets.push(Bullet.spawn(this.ship, this.scaleFactor, this.laserSound)),
              500
            );
            break;
        }
      },
      { passive: false }
    );

    window.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        if (this.gameState === 2 && this.autoFireInterval) { // Only stop autofire during the game
          clearInterval(this.autoFireInterval);
          this.autoFireInterval = null;
        }
      },
      { passive: false }
    );

    window.addEventListener("touchmove", (e) => {
      if (this.gameState === 2) { // During the game
        this.ship.move(e.touches[0].clientX);
      }
    });
  }
}

  
  // Create an instance of the Game class to start the game
  const game = new Game();
  

