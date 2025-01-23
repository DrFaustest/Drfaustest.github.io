import { GameDisplay } from "./DisplayClass.js";
import { Bullet, Ship, LifePickup } from "./Player.js";
import { Enemy, EnemyManager } from "./EnemyClass.js";
import resourceManager from "./ResourceManager.js";


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
    this.enemyManager = new EnemyManager(this);
    this.setupEventListeners();
    this.gameLoop();
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
    this.enemyManager.enemies.length = 0;
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

  updateEntities(entities, updateFunc, drawFunc) {
    entities.forEach((entity) => {
      updateFunc(entity); // Update the entity
      drawFunc(entity);   // Render the entity
    });
  }  

  update() {
    if (this.gameStarted) {
      this.gameContext.clearRect(0,0,this.gameCanvas.width,this.gameCanvas.height);
      this.display.drawHUD(this.lives, this.score, this.startTime);
      this.enemyManager.assetSpawn();
      this.updateEntities(this.enemyManager.enemies, (enemy) => enemy.move(this.score), (enemy) => enemy.draw(this.gameContext));
      this.updateEntities(this.bullets, (bullet) => bullet.move() || bullet.y < 0, (bullet) => bullet.draw(this.gameContext));
      this.updateEntities(this.lifePickups, (life) => life.move() || life.y > this.gameCanvas.height, (life) => life.draw(this.gameContext));

      this.checkCollisions();
      this.updateAutofireSpeed();
      this.ship.draw(this.gameContext);
    }

    if (this.lives <= 0) {
      this.gameOver = true;
    }
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
    const bottomBoundary = {
      x: 0,
      y: this.gameCanvas.height,
      width: this.gameCanvas.width,
      height: 1, // Represents the bottom boundary
    };
  
    // Handle enemies
    this.enemyManager.enemies.forEach((enemy, index) => {
      // Check for collisions with bullets
      this.bullets.forEach((bullet, bulletIndex) => {
        if (this.isColliding(bullet, enemy)) {
          enemy.hitPoints--;
          this.bullets.splice(bulletIndex, 1); // Remove bullet
          if (enemy.hitPoints <= 0) {
            this.score += enemy.type === 1 ? 1 : 5;
            resourceManager.playSound("explosion");
            this.enemyManager.enemies.splice(index, 1); // Remove enemy
          }
        }
      });
  
      // Check for collisions with the ship
      if (this.isColliding(this.ship, enemy)) {
        resourceManager.playSound("explosion");
        this.enemyManager.enemies.splice(index, 1); // Remove enemy
        console.log("Ship collided with enemy");
        this.lives--; // Reduce life by 1
      }
  
      // Check for collisions with the bottom boundary
      if (this.isColliding(enemy, bottomBoundary)) {
        console.log("Enemy collided with bottom boundary");
        this.enemyManager.enemies.splice(index, 1); // Remove enemy
        this.lives--; // Reduce life for missed enemy
      }
    });
  
    // Drop extra lives logic
    let livesToDrop = Math.floor(this.score / 30);
    if (livesToDrop > this.extraLivesDropped && this.lifePickups.length <= 2) {
      this.lifePickups.push(
        new LifePickup(this.gameCanvas.width / 2, 0, this.scaleFactor)
      );
      this.extraLivesDropped++;
    }
  
    // Handle life pickups
    this.lifePickups.forEach((lifePickup, index) => {
      if (this.isColliding(this.ship, lifePickup)) {
        this.lifePickups.splice(index, 1); // Remove life pickup
        this.lives++; // Increase life by 1
      }
    });
  
    // Remove bullets that go off-screen
    this.bullets = this.bullets.filter((bullet) => bullet.y + bullet.height > 0);
  
    // Remove life pickups that fall off-screen
    this.lifePickups = this.lifePickups.filter(
      (lifePickup) => lifePickup.y + lifePickup.height <= this.gameCanvas.height
    );
  }

  isColliding(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
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
    document.addEventListener("keydown", (event) => {
      if (event.key === "m") { // 'M' key to toggle mute
        resourceManager.toggleMute();
        muteButton.textContent = resourceManager.isMuted ? "Unmute" : "Mute";
      }
    });
    document.getElementById("muteButton").addEventListener("click", () => {
      resourceManager.toggleMute();
      const muteButton = document.getElementById("muteButton");
      muteButton.textContent = resourceManager.isMuted ? "Unmute" : "Mute";
    });
  }
}
const game = new Game();
