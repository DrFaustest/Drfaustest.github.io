export class Ship {
  constructor(gameCanvas, scaleFactor) {
    this.gameCanvas = gameCanvas;
    this.scaleFactor = scaleFactor;
    this.playerImage = new Image();
    this.playerImage.src = "../images/player.png";
    this.playerImageLeft = new Image();
    this.playerImageLeft.src = "../images/playerLeft.png";
    this.playerImageRight = new Image();
    this.playerImageRight.src = "../images/playerRight.png";
    this.x = gameCanvas.width / 2;
    this.y = gameCanvas.height - 50 * scaleFactor;
    this.size = 20 * scaleFactor;
    this.width = 50 * scaleFactor;
    this.height = 50 * scaleFactor;
    this.prevShipX = this.x;
    this.moveLeft = false;
    this.moveRight = false;
  }

  draw(gameContext) {
    let currentImage = this.playerImage;
    if (this.x < this.prevShipX) {
      currentImage = this.playerImageLeft;
    } else if (this.x > this.prevShipX) {
      currentImage = this.playerImageRight;
    }

    this.prevShipX = this.x;
    gameContext.drawImage(
      currentImage,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }

  move(x) {
    this.x = x;
    if (this.x < 0) this.x = 0;
    if (this.x > this.gameCanvas.width - this.width)
      this.x = this.gameCanvas.width - this.width;
  }

  keyMove(key, isKeyDown) {
    const moveAmount = 10 * this.scaleFactor;
    if (key === "ArrowLeft") {
      this.moveLeft = isKeyDown;
      this.velocity = -moveAmount;
    } else if (key === "ArrowRight") {
      this.moveRight = isKeyDown;
      this.velocity = moveAmount;
    }
  }

  moveOnKey() {
    if (this.moveLeft) {
      this.move(this.x + this.velocity);
    } else if (this.moveRight) {
      this.move(this.x + this.velocity);
    }
    requestAnimationFrame(this.moveOnKey.bind(this));
  }
}
