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
    this.scaleFactor = Math.max(
      1,
      this.gameCanvas.height / this.baseScreenWidth
    );
    this.gameState = 1;
    this.score = 0;
    this.keys = {};
    this.gameStarted = false;
    this.gameOver = false;
    this.autoFireInterval = null;
    this.startTime = null;
    this.display = new GameDisplay(
      this.gameContext,
      this.gameCanvas,
      this.scaleFactor
    );
    this.ship = new Ship(this.gameCanvas, this.scaleFactor);
    this.lifePickups = [];
    this.lives = 3;
    this.extraLivesDropped = 0;
    this.enemies = [];
    this.bullets = [];
    this.waveTimer = 0;
    this.dropPoints = [];
    this.dropPointSpacing = this.gameCanvas.width * 0.05;
    for (
      let i = this.dropPointSpacing;
      i < this.gameCanvas.width * 0.95;
      i += this.dropPointSpacing
    ) {
      this.dropPoints.push(i);
    }
    this.lastSpawnPoint = null;
    this.spawnDirection = "right";
    this.waveComplete = false;
    this.currentVolley = 0;
    this.enemySpawnInterval = 800;
    this.leftSpawnPoint;
    this.rightSpawnPoint;
    this.speedBuff = 500;

    this.laserSound = new Audio(
      "../sounds/zapsplat_cartoon_anime_hit_zap_laser.mp3"
    );
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
      switch (this.gameState) {
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
      requestAnimationFrame(loop);
    };
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
    this.currentWave = 0;
    this.enemySpawnInterval = 800;
  }

  handleStartGame() {
    console.log("handleStartGame called");
    this.ship.moveOnKey();
    this.gameStarted = true;
    this.gameState = 2;
  }

  update() {
    if (this.gameStarted) {
      this.gameContext.clearRect(
        0,
        0,
        this.gameCanvas.width,
        this.gameCanvas.height
      );
      this.display.drawHUD(this.lives, this.score, this.startTime);
      this.assetSpawn();
      this.updateEnemies();
      this.updateBullets();
      this.updateLifePickups();
      this.checkCollisions();
      this.updateAutofireSpeed();
      this.ship.draw(this.gameContext);
    }

    if (this.lives <= 0) {
      this.gameOver = true;
    }
  }

  updateEnemies() {
    this.enemies.forEach((enemy, index) => {
      if (enemy.move(this.score)) {
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

  updateAutofireSpeed() {
    const maxSpeed = 1000;
    const minSpeed = 100;
    const speedDecreasePerPoint = 5;
    let autofireSpeed = maxSpeed - this.score * speedDecreasePerPoint;
    if (autofireSpeed < minSpeed) {
      autofireSpeed = minSpeed;
    }
    this.speedBuff = autofireSpeed;
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
      const dist = Math.hypot(
        this.ship.x - lifePickup.x,
        this.ship.y - lifePickup.y
      );
      if (dist - lifePickup.size - this.ship.size < 1) {
        this.lifePickups.splice(index, 1);
        this.lives++;
      }
    });
  }

  assetSpawn() {
    let livesToDrop = Math.floor(this.score / 30);
    if (livesToDrop > this.extraLivesDropped && this.lifePickups.length <= 2) {
      this.lifePickups.push(
        new LifePickup(this.gameCanvas.width / 2, 0, this.scaleFactor)
      );
      this.extraLivesDropped++;
    }
    if (this.currentVolley === 0) {
      this.currentVolley = this.currentVolley + 1;
      this.controlEnemyWaves();
    }
    if (this.waveComplete && !this.cooldownTimer) {
      this.cooldownTimer = setTimeout(() => {
        clearTimeout(this.cooldownTimer);
        this.cooldownTimer = null;
        this.waveComplete = false;
        this.controlEnemyWaves();
        this.currentVolley = this.currentVolley + 1;
        this.enemySpawnInterval -= 10;
      }, 5000);
    }
  }

  controlEnemyWaves() {
    if (!this.currentWave) {
      let count = 0;
      this.waveTimer = setInterval(() => {
        this.spawnLinearWave();
        count++;
        if (count >= 30) {
          clearInterval(this.waveTimer);
          this.currentWave = "Linear";
          this.waveComplete = true;
        }
      }, this.enemySpawnInterval);
    } else {
      const waveTypes = ["X", "L", "Linear"];
      const randomWave =
        waveTypes[Math.floor(Math.random() * waveTypes.length)];
      this.currentWave = randomWave;
      let waveCount =
        this.currentWave === "X" ? 20 : this.currentWave === "L" ? 19 : 30;
      let count = 0;
      this.waveTimer = setInterval(() => {
        this[`spawn${this.currentWave}Wave`](count);
        count++;
        if (count >= waveCount) {
          clearInterval(this.waveTimer);
          this.waveComplete = true;
        }
      }, this.enemySpawnInterval);
    }
  }

  spawnXWave(count) {
    const initialX =
      this.dropPoints[count % 2 === 0 ? 0 : this.dropPoints.length - 1];
    const enemy = Enemy.spawn(this.gameCanvas, this.scaleFactor, initialX, "x");
    this.enemies.push(enemy);
  }

  spawnLWave(count) {
    const lWaveDirection = this.lWaveDirection === "left" ? "right" : "left";
    const initialX =
      lWaveDirection === "left"
        ? this.dropPoints[count]
        : this.dropPoints[this.dropPoints.length - 1 - count];
    const enemy = Enemy.spawn(this.gameCanvas, this.scaleFactor, initialX, "l");
    this.enemies.push(enemy);
    this.lWaveDirection = lWaveDirection;
  }

  spawnLinearWave() {
    let initialX;
    if (
      this.leftSpawnPoint === undefined ||
      this.rightSpawnPoint === undefined
    ) {
      initialX = Math.floor(this.dropPoints.length / 2);
      this.leftSpawnPoint = initialX - 1;
      this.rightSpawnPoint = initialX + 1;
      this.spawnDirection = "right";
    } else {
      if (this.spawnDirection === "right") {
        initialX = this.rightSpawnPoint;
        this.rightSpawnPoint++;
        if (this.rightSpawnPoint >= this.dropPoints.length) {
          this.rightSpawnPoint = Math.floor(this.dropPoints.length / 2) + 1;
        }
        this.spawnDirection = "left";
      } else {
        initialX = this.leftSpawnPoint;
        this.leftSpawnPoint--;
        if (this.leftSpawnPoint < 0) {
          this.leftSpawnPoint = Math.floor(this.dropPoints.length / 2) - 1;
        }
        this.spawnDirection = "right";
      }
    }
    const enemy = Enemy.spawn(
      this.gameCanvas,
      this.scaleFactor,
      this.dropPoints[initialX],
      "linear"
    );
    this.enemies.push(enemy);
  }

  startAutofire() {
    clearInterval(this.autoFireInterval);
    this.autoFireInterval = setInterval(() => {
      this.bullets.push(
        Bullet.spawn(this.ship, this.scaleFactor, this.laserSound)
      );
      if (this.speedBuff !== this.currentSpeed) {
        this.currentSpeed = this.speedBuff;
        this.startAutofire();
      }
    }, this.speedBuff);
  }

  stopAutofire() {
    clearInterval(this.autoFireInterval);
    this.autoFireInterval = null;
  }

  setupEventListeners() {
    window.addEventListener("keydown", (e) => {
      this.ship.keyMove(e.key, true);
      switch (this.gameState) {
        case 1:
          if (e.key === " ") {
            e.preventDefault();
            this.handleStartGame();
            this.waitForStartResolve();
          }
          break;
        case 2:
          if (e.key === " ") {
            this.bullets.push(
              Bullet.spawn(this.ship, this.scaleFactor, this.laserSound)
            );
          }
          break;
        case 3:
          if (e.key === " ") {
            this.gameOver = false;
            this.restartGame();
            this.waitForRestartResolve();
          }
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      this.ship.keyMove(e.key, false);
    });

    window.addEventListener("mousedown", (e) => {
      switch (this.gameState) {
        case 1:
          this.handleStartGame();
          this.waitForStartResolve();
          break;
        case 2:
          this.bullets.push(
            Bullet.spawn(this.ship, this.scaleFactor, this.laserSound)
          );
          break;
        case 3:
          this.gameOver = false;
          this.restartGame();
          this.waitForRestartResolve();
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (this.gameState === 2) {
        this.ship.move(e.clientX);
      }
    });

    window.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        switch (this.gameState) {
          case 1:
            this.handleStartGame();
            this.waitForStartResolve();
            break;
          case 2:
            this.bullets.push(
              Bullet.spawn(this.ship, this.scaleFactor, this.laserSound)
            );
            this.startAutofire();
            break;
        }
      },
      { passive: false }
    );

    window.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        if (this.gameState === 2) {
          this.stopAutofire();
        }
      },
      { passive: false }
    );

    window.addEventListener("touchmove", (e) => {
      if (this.gameState === 2) {
        this.ship.move(e.touches[0].clientX);
      }
    });
  }
}
const game = new Game();
