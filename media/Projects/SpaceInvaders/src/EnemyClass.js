import resourceManager from "./ResourceManager.js";

const ENEMY_BLUEPRINTS = {
  scout: {
    image: "enemy1",
    size: 34,
    hitPoints: 1,
    speed: 1.25,
    scoreValue: 1,
    damage: 1,
    pattern: "linear",
  },
  raider: {
    image: "enemy1",
    size: 42,
    hitPoints: 2,
    speed: 1,
    scoreValue: 3,
    damage: 1,
    pattern: "sine",
  },
  tank: {
    image: "enemy2",
    size: 72,
    hitPoints: 7,
    speed: 0.45,
    scoreValue: 10,
    damage: 2,
    pattern: "tank",
  },
  lancer: {
    image: "enemy2",
    size: 50,
    hitPoints: 3,
    speed: 1.05,
    scoreValue: 5,
    damage: 1,
    pattern: "swoop",
  },
  boss: {
    image: "enemy2",
    size: 150,
    hitPoints: 38,
    speed: 0.55,
    scoreValue: 60,
    damage: 3,
    pattern: "boss",
  },
};

export class Enemy {
  constructor(gameCanvas, scaleFactor, archetype = "scout", wave = "linear", initialX = 0) {
    this.gameCanvas = gameCanvas;
    this.scaleFactor = scaleFactor;
    this.archetype = archetype;
    this.blueprint = ENEMY_BLUEPRINTS[archetype] || ENEMY_BLUEPRINTS.scout;
    this.enemyImage = resourceManager.getImage(this.blueprint.image);
    this.size = this.blueprint.size * this.scaleFactor;
    this.width = this.size;
    this.height = this.size;
    this.x = Math.min(Math.max(initialX, 0), this.gameCanvas.width - this.width);
    this.y = -this.height;
    this.originX = this.x;
    this.originY = this.y;
    this.hitPoints = this.blueprint.hitPoints;
    this.maxHitPoints = this.blueprint.hitPoints;
    this.scoreValue = this.blueprint.scoreValue;
    this.damage = this.blueprint.damage;
    this.pattern = wave || this.blueprint.pattern;
    this.speed = this.blueprint.speed;
    this.age = 0;
    this.angle = 0;
    this.direction = this.x < gameCanvas.width / 2 ? 1 : -1;
    this.phase = Math.random() * Math.PI * 2;
    this.fireCooldown = this.archetype === "boss" ? 60 : 150;
    this.hasEntered = false;
    this.hasCrossedCenter = false;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  draw(gameContext) {
    gameContext.save();
    rotateImage(gameContext, this.centerX, this.centerY, -this.angle);
    gameContext.drawImage(this.enemyImage, this.x, this.y, this.width, this.height);
    gameContext.restore();

    if (this.maxHitPoints > 1) {
      this.drawHealthBar(gameContext);
    }
  }

  drawHealthBar(gameContext) {
    const barWidth = this.width;
    const barHeight = Math.max(4, 5 * this.scaleFactor);
    const healthRatio = Math.max(0, this.hitPoints / this.maxHitPoints);
    const y = Math.max(8, this.y - barHeight - 6);

    gameContext.save();
    gameContext.fillStyle = "rgba(255,255,255,0.22)";
    gameContext.fillRect(this.x, y, barWidth, barHeight);
    gameContext.fillStyle = this.archetype === "boss" ? "#ff3d7f" : "#ffb703";
    gameContext.fillRect(this.x, y, barWidth * healthRatio, barHeight);
    gameContext.restore();
  }

  move(score) {
    this.age++;
    const difficulty = 1 + Math.min(score, 120) * 0.012;
    const speed = this.speed * this.scaleFactor * difficulty;

    switch (this.pattern) {
      case "x":
        this.moveX(speed);
        break;
      case "l":
        this.moveL(speed);
        break;
      case "sine":
        this.moveSine(speed);
        break;
      case "swoop":
        this.moveSwoop(speed);
        break;
      case "tank":
        this.moveTank(speed);
        break;
      case "boss":
        this.moveBoss(speed);
        break;
      case "linear":
      default:
        this.y += speed;
        this.angle = Math.sin(this.age * 0.05) * 0.08;
        break;
    }

    if (this.y > 0) {
      this.hasEntered = true;
    }

    return this.hasEntered && this.y > this.gameCanvas.height + this.height;
  }

  moveX(speed) {
    const centerLine = this.gameCanvas.width / 2;
    const crossedCenter =
      (this.direction === 1 && this.centerX >= centerLine) ||
      (this.direction === -1 && this.centerX <= centerLine);

    if (!this.hasCrossedCenter && crossedCenter) {
      this.direction *= -1;
      this.hasCrossedCenter = true;
    }

    if (this.x <= 0 || this.x + this.width >= this.gameCanvas.width) {
      this.direction *= -1;
      this.x = Math.min(Math.max(this.x, 0), this.gameCanvas.width - this.width);
    }

    this.x += this.direction * speed * 1.5;
    this.y += speed * 0.82;
    this.angle = this.direction === 1 ? Math.PI / 4 : -Math.PI / 4;
  }

  moveL(speed) {
    const horizontalLimit = this.gameCanvas.width * 0.18;
    if (Math.abs(this.x - this.originX) < horizontalLimit) {
      this.x += this.direction * speed * 2.2;
      this.angle = this.direction === 1 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      this.y += speed * 0.85;
      this.angle = 0;
      if (this.age % 90 === 0) {
        this.originX = this.x;
        this.direction *= -1;
      }
    }
  }

  moveSine(speed) {
    this.y += speed * 0.92;
    this.x = this.originX + Math.sin(this.age * 0.055 + this.phase) * this.gameCanvas.width * 0.09;
    this.x = Math.min(Math.max(this.x, 0), this.gameCanvas.width - this.width);
    this.angle = Math.cos(this.age * 0.055 + this.phase) * 0.35;
  }

  moveSwoop(speed) {
    this.y += speed * 1.18;
    this.x += Math.sin(this.age * 0.045 + this.phase) * speed * 1.9;
    this.x = Math.min(Math.max(this.x, 0), this.gameCanvas.width - this.width);
    this.angle = Math.sin(this.age * 0.05) * 0.55;
  }

  moveTank(speed) {
    this.y += speed * 0.55;
    this.x += Math.sin(this.age * 0.025 + this.phase) * speed * 0.55;
    this.x = Math.min(Math.max(this.x, 0), this.gameCanvas.width - this.width);
    this.angle = Math.sin(this.age * 0.02) * 0.08;
  }

  moveBoss(speed) {
    const targetY = this.gameCanvas.height * 0.14;
    if (this.y < targetY) {
      this.y += speed;
    } else {
      this.y = targetY + Math.sin(this.age * 0.018) * this.gameCanvas.height * 0.035;
      this.x += this.direction * speed * 1.45;
      if (this.x <= 0 || this.x + this.width >= this.gameCanvas.width) {
        this.direction *= -1;
      }
    }
    this.angle = Math.sin(this.age * 0.018) * 0.18;
  }

  tryShoot(frameCount) {
    if (!["lancer", "tank", "boss"].includes(this.archetype) || this.y < 0) {
      return [];
    }

    const cadence = this.archetype === "boss" ? 46 : this.archetype === "tank" ? 135 : 110;
    if ((frameCount + Math.floor(this.phase * 10)) % cadence !== 0) {
      return [];
    }

    if (this.archetype === "boss") {
      return [-0.9, 0, 0.9].map((drift) => new EnemyProjectile(this.centerX, this.y + this.height, this.scaleFactor, drift));
    }

    return [new EnemyProjectile(this.centerX, this.y + this.height, this.scaleFactor, 0)];
  }

  static spawn(gameCanvas, scaleFactor, initialX, wave = "linear", archetype = "scout") {
    return new Enemy(gameCanvas, scaleFactor, archetype, wave, initialX);
  }
}

export class EnemyProjectile {
  constructor(x, y, scaleFactor, drift = 0) {
    this.scaleFactor = scaleFactor;
    this.x = x - 4 * scaleFactor;
    this.y = y;
    this.width = 8 * scaleFactor;
    this.height = 18 * scaleFactor;
    this.drift = drift * scaleFactor;
    this.speed = 4 * scaleFactor;
    this.damage = 1;
  }

  move() {
    this.x += this.drift;
    this.y += this.speed;
    return this.y > window.innerHeight;
  }

  draw(gameContext) {
    gameContext.save();
    const gradient = gameContext.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    gradient.addColorStop(0, "#ff3d7f");
    gradient.addColorStop(1, "#ffb703");
    gameContext.fillStyle = gradient;
    gameContext.shadowColor = "#ff3d7f";
    gameContext.shadowBlur = 12;
    gameContext.fillRect(this.x, this.y, this.width, this.height);
    gameContext.restore();
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
    this.enemySpawnInterval = 760;
    this.cooldownTimer = null;
    this.waveTimer = null;
    this.pendingTimers = [];
    this.dropPoints = this.calculateDropPoints();
    this.spawnDirection = "right";
    this.bossActive = false;
    this.waveName = "Incoming";
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
    if (this.currentVolley === 0) {
      this.currentVolley++;
      this.controlEnemyWaves();
    }

    if (this.bossActive) {
      this.bossActive = this.enemies.some((enemy) => enemy.archetype === "boss");
      if (!this.bossActive) {
        this.waveComplete = true;
      }
    }

    if (this.waveComplete && !this.cooldownTimer) {
      this.cooldownTimer = setTimeout(() => {
        clearTimeout(this.cooldownTimer);
        this.cooldownTimer = null;
        this.waveComplete = false;
        this.currentVolley++;
        this.enemySpawnInterval = Math.max(360, this.enemySpawnInterval - 28);
        this.controlEnemyWaves();
      }, 2300);
    }
  }

  controlEnemyWaves() {
    if (this.currentVolley > 0 && this.currentVolley % 4 === 0) {
      this.spawnBossEncounter();
      return;
    }

    const waveTypes = ["Viper", "Crossfire", "Armor", "Spiral", "Ambush"];
    const randomWave = waveTypes[Math.floor(Math.random() * waveTypes.length)];
    this.currentWave = randomWave;
    this.waveName = randomWave;
    const waveCount = randomWave === "Armor" ? 14 : randomWave === "Ambush" ? 22 : 26;
    let count = 0;

    this.waveTimer = setInterval(() => {
      this.spawnWaveEnemy(randomWave, count);
      count++;
      if (count >= waveCount) {
        clearInterval(this.waveTimer);
        this.waveComplete = true;
      }
    }, this.enemySpawnInterval);
  }

  spawnWaveEnemy(wave, count) {
    const centerIndex = Math.floor(this.dropPoints.length / 2);
    const left = this.dropPoints[count % Math.max(1, centerIndex)];
    const right = this.dropPoints[this.dropPoints.length - 1 - (count % Math.max(1, centerIndex))];

    switch (wave) {
      case "Crossfire":
        this.spawnEnemy(count % 2 === 0 ? left : right, "x", count % 5 === 0 ? "lancer" : "scout");
        break;
      case "Armor":
        this.spawnEnemy(this.dropPoints[(centerIndex + count) % this.dropPoints.length], count % 2 === 0 ? "tank" : "sine", count % 3 === 0 ? "tank" : "raider");
        break;
      case "Spiral":
        this.spawnEnemy(this.dropPoints[(count * 3) % this.dropPoints.length], "sine", count % 4 === 0 ? "lancer" : "raider");
        break;
      case "Ambush":
        this.spawnEnemy(count % 2 === 0 ? left : right, "swoop", count % 6 === 0 ? "tank" : "lancer");
        break;
      case "Viper":
      default:
        this.spawnEnemy(this.dropPoints[(centerIndex + (count % 2 === 0 ? count : -count) + this.dropPoints.length) % this.dropPoints.length], "linear", count % 7 === 0 ? "raider" : "scout");
        break;
    }
  }

  spawnBossEncounter() {
    this.waveName = "Boss: Dreadnought";
    this.currentWave = "Boss";
    this.waveComplete = false;
    this.bossActive = true;
    this.spawnEnemy(this.game.gameCanvas.width / 2 - 75 * this.game.scaleFactor, "boss", "boss");

    const escortOffsets = [-0.28, -0.14, 0.14, 0.28];
    escortOffsets.forEach((offset, index) => {
      const timer = setTimeout(() => {
        this.spawnEnemy(this.game.gameCanvas.width * (0.5 + offset), index % 2 === 0 ? "sine" : "swoop", "lancer");
      }, 450 + index * 320);
      this.pendingTimers.push(timer);
    });
  }

  spawnEnemy(initialX, pattern, archetype) {
    const enemy = Enemy.spawn(this.game.gameCanvas, this.game.scaleFactor, initialX, pattern, archetype);
    this.enemies.push(enemy);
    return enemy;
  }

  clearTimers() {
    clearInterval(this.waveTimer);
    clearTimeout(this.cooldownTimer);
    this.pendingTimers.forEach((timer) => clearTimeout(timer));
    this.pendingTimers.length = 0;
    this.waveTimer = null;
    this.cooldownTimer = null;
  }
}
