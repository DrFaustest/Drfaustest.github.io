export class Enemy {
  constructor(
    gameCanvas,
    scaleFactor,
    type = Math.random() < 0.7 ? 1 : 2,
    wave
  ) {
    this.gameCanvas = gameCanvas;
    this.scaleFactor = scaleFactor;
    this.enemyImage = new Image();
    this.enemyImage.src = "../images/enemyShip.png";
    this.enemyType2Image = new Image();
    this.enemyType2Image.src = "../images/enemyUFO.png";
    this.size = 40 * this.scaleFactor;
    this.x = Math.random() * (gameCanvas.width - this.size * 2) + this.size;
    this.y = 0;
    this.width = this.size;
    this.height = this.size;
    this.type = type;
    this.hitPoints = this.type === 1 ? 1 : 2;
    this.image = this.type === 1 ? this.enemyImage : this.enemyType2Image;
    this.wave = wave;
    this.angle = 0; // angle of rotation, in radians
    this.originalX = this.x; // Keep track of the original x position
    this.horizontalLimit = this.gameCanvas.width * 0.05;
    this.verticalLimit = this.gameCanvas.height * 0.05;
    this.movementPhase = 0; // Start with horizontal movement
    this.direction = this.x < gameCanvas.width / 2 ? 1 : -1; // Direction of horizontal movement
    this.passedMiddle = false; // A flag indicating whether the enemy has passed the middle of the screen
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

  move() {
    switch (this.wave) {
      case "x":
        // Change direction when the enemy crosses the middle of the screen
        if ((this.direction === 1 && this.x >= this.gameCanvas.width / 2) ||
            (this.direction === -1 && this.x <= this.gameCanvas.width / 2)) {
          if (!this.passedMiddle) {
            this.direction = -this.direction;
            this.passedMiddle = true;
          }
        }

        // Also change direction when the enemy hits an edge
        if ((this.direction === 1 && this.x + this.width >= this.gameCanvas.width) ||
            (this.direction === -1 && this.x <= 0)) {
          this.direction = -this.direction;
        }

        this.x += this.direction * 0.75 * this.scaleFactor;
        this.y += 0.75 * this.scaleFactor;

        // Update the angle based on the direction
        this.angle = this.direction === 1 ? Math.PI / 4 : -Math.PI / 4;
        break;
      case "l":
        if (this.movementPhase === 0) {
          // Horizontal movement
          this.x += this.direction * 2 * this.scaleFactor;
          if (Math.abs(this.x - this.originalX) >= this.horizontalLimit) {
            // Reached horizontal limit, switch to vertical movement
            this.movementPhase = 1;
            this.originalY = this.y; // Update the original y position for the next vertical movement
          }
        } else {
          // Vertical movement
          this.y += 0.5 * this.scaleFactor;
          if (Math.abs(this.y - this.originalY) >= this.verticalLimit) {
            // Moving 5% of the screen height down
            // Reached vertical limit, switch to horizontal movement
            this.movementPhase = 0;
            this.originalX = this.x; // Update the original x position for the next horizontal movement
            this.direction = -this.direction; // Swap the direction
          }
        }
        this.angle =
        this.movementPhase === 0
          ? this.direction === 1
            ? Math.PI / 2 // Rotate 90 degrees clockwise for facing right
            : -Math.PI / 2 // Rotate 90 degrees counterclockwise for facing left
          : 0; // No rotation for facing down
        break;
      case "linear":
      default:
        this.y += 0.5 * this.scaleFactor;
    }

    if (this.y + this.size > this.gameCanvas.height) {
      return true;
    }
    return false;
  }

  static spawn(gameCanvas, scaleFactor) {
    const waves = ["x", "l", "linear"];
    const wave = waves[Math.floor(Math.random() * waves.length)];
    return new Enemy(gameCanvas, scaleFactor, undefined, wave);
  }
}

export function rotateImage(ctx, x, y, angle) {
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.translate(-x, -y);
}
