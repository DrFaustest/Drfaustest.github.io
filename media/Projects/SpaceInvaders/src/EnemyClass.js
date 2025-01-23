import resourceManager from "./ResourceManager.js";
export class Enemy {
  constructor(
    gameCanvas,
    scaleFactor,
    type = Math.random() < 0.7 ? 1 : 2,
    wave,
    initialX
  ) {
    this.gameCanvas = gameCanvas;
    this.scaleFactor = scaleFactor;
    this.enemyImage = resourceManager.getImage("enemy1");
    this.enemyType2Image = resourceManager.getImage("enemy2");
    this.size = 40 * this.scaleFactor;
    this.x = initialX;
    this.y = 0;
    this.width = this.size;
    this.height = this.size;
    this.type = type;
    this.hitPoints = this.type === 1 ? 1 : 2;
    this.image = this.type === 1 ? this.enemyImage : this.enemyType2Image;
    this.wave = wave;
    this.angle = 0;
    this.originalX = this.x;
    this.horizontalLimit = this.gameCanvas.width * 0.2;
    this.verticalLimit = this.gameCanvas.height * 0.05;
    this.movementPhase = 0;
    this.direction = this.x < gameCanvas.width / 2 ? 1 : -1;
    this.passedMiddle = false;
    if (this.wave === "x") {
      this.angle = this.x < gameCanvas.width / 2 ? Math.PI / 4 : -Math.PI / 4;
    }
  }

  draw(gameContext) {
    gameContext.save();

    rotateImage(
      gameContext,
      this.x + this.width / 2,
      this.y + this.height / 2,
      -this.angle
    );
    gameContext.drawImage(this.image, this.x, this.y, this.width, this.height);
    gameContext.restore();
  }

  move(score) {
    let speedFactor = 1 + score * 0.03;
    switch (this.wave) {
      case "x":
        if (
          (this.direction === 1 && this.x >= this.gameCanvas.width / 2) ||
          (this.direction === -1 && this.x <= this.gameCanvas.width / 2)
        ) {
          if (!this.passedMiddle) {
            this.direction = -this.direction;
            this.passedMiddle = true;
          }
        }
        if (
          (this.direction === 1 &&
            this.x + this.width >= this.gameCanvas.width) ||
          (this.direction === -1 && this.x <= 0)
        ) {
          this.direction = -this.direction;
        }
        this.x += this.direction * 0.75 * this.scaleFactor * speedFactor;
        this.y += 0.75 * this.scaleFactor * speedFactor;
        this.angle = this.direction === 1 ? Math.PI / 4 : -Math.PI / 4;
        break;
      case "l":
        if (this.movementPhase === 0) {
          this.x += this.direction * 2 * this.scaleFactor * speedFactor;
          if (Math.abs(this.x - this.originalX) >= this.horizontalLimit) {
            this.movementPhase = 1;
            this.originalY = this.y;
          }
        } else {
          this.y += 0.5 * this.scaleFactor * speedFactor;
          if (Math.abs(this.y - this.originalY) >= this.verticalLimit) {
            this.movementPhase = 0;
            this.originalX = this.x;
            this.direction = -this.direction;
          }
        }
        this.angle =
          this.movementPhase === 0
            ? this.direction === 1
              ? Math.PI / 2
              : -Math.PI / 2
            : 0;
        break;
      case "linear":
      default:
        this.y += 0.5 * this.scaleFactor * speedFactor;
    }

    if (this.y + this.size > this.gameCanvas.height) {
      return true;
    }
    return false;
  }

  static spawn(gameCanvas, scaleFactor, initialX, wave) {
    return new Enemy(gameCanvas, scaleFactor, undefined, wave, initialX);
  }
}

export function rotateImage(ctx, x, y, angle) {
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.translate(-x, -y);
}

export class EnemyManager {
  constructor(game) {
    this.game = game;
    this.enemies = [];
    this.waveComplete = false;
    this.currentWave = null;
    this.currentVolley = 0;
    this.enemySpawnInterval = 800;
    this.cooldownTimer = null;
    this.waveTimer = null;
    this.dropPoints = this.calculateDropPoints();
    this.leftSpawnPoint = null;
    this.rightSpawnPoint = null;
    this.spawnDirection = "right";
  }

  calculateDropPoints() {
    const { gameCanvas } = this.game;
    const dropPointSpacing = gameCanvas.width * 0.05;
    const dropPoints = [];
    for (let i = dropPointSpacing; i < gameCanvas.width * 0.95; i += dropPointSpacing) {
      dropPoints.push(i);
    }
    return dropPoints;
  }

  assetSpawn() {
    const { score, lifePickups, gameCanvas, scaleFactor } = this.game;

    // Manage enemy waves
    if (this.currentVolley === 0) {
      this.currentVolley++;
      this.controlEnemyWaves();
    }
    if (this.waveComplete && !this.cooldownTimer) {
      this.cooldownTimer = setTimeout(() => {
        clearTimeout(this.cooldownTimer);
        this.cooldownTimer = null;
        this.waveComplete = false;
        this.controlEnemyWaves();
        this.currentVolley++;
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
      const randomWave = waveTypes[Math.floor(Math.random() * waveTypes.length)];
      this.currentWave = randomWave;
      const waveCount = randomWave === "X" ? 20 : randomWave === "L" ? 19 : 30;
      let count = 0;
      this.waveTimer = setInterval(() => {
        this[`spawn${randomWave}Wave`](count);
        count++;
        if (count >= waveCount) {
          clearInterval(this.waveTimer);
          this.waveComplete = true;
        }
      }, this.enemySpawnInterval);
    }
  }

  spawnXWave(count) {
    const initialX = this.dropPoints[count % 2 === 0 ? 0 : this.dropPoints.length - 1];
    const enemy = Enemy.spawn(this.game.gameCanvas, this.game.scaleFactor, initialX, "x");
    this.enemies.push(enemy);
  }

  spawnLWave(count) {
    const lWaveDirection = this.spawnDirection === "left" ? "right" : "left";
    const initialX =
      lWaveDirection === "left"
        ? this.dropPoints[count]
        : this.dropPoints[this.dropPoints.length - 1 - count];
    const enemy = Enemy.spawn(this.game.gameCanvas, this.game.scaleFactor, initialX, "l");
    this.enemies.push(enemy);
    this.spawnDirection = lWaveDirection;
  }

  spawnLinearWave() {
    let initialX;
    if (this.leftSpawnPoint === null || this.rightSpawnPoint === null) {
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
    const enemy = Enemy.spawn(this.game.gameCanvas, this.game.scaleFactor, this.dropPoints[initialX], "linear");
    this.enemies.push(enemy);
  }
}
