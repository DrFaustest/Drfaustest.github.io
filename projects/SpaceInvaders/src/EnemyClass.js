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
    this.enemyImage = new Image();
    this.enemyImage.src = "../images/enemyShip.png";
    this.enemyType2Image = new Image();
    this.enemyType2Image.src = "../images/enemyUFO.png";
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
    let speedFactor = 1 + score * 0.01;
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
