import resourceManager from "./ResourceManager.js";
export class Ship {
  constructor(gameCanvas, scaleFactor) {
    this.gameCanvas = gameCanvas;
    this.scaleFactor = scaleFactor;
    this.playerImage = resourceManager.getImage("player");
    this.playerImageLeft = resourceManager.getImage("playerLeft");
    this.playerImageRight = resourceManager.getImage("playerRight");
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

export class LifePickup {
    constructor(x, y, scaleFactor) {
      this.x = x;
      this.y = y;
      this.scaleFactor = scaleFactor;
      this.size = 20 * scaleFactor;
      this.width = this.size;
      this.height = this.size;
      this.lifePickupImage = resourceManager.getImage("life");
    }
  
    move() {
      this.y += 1.5;
    }
  
    draw(gameContext) {
      gameContext.drawImage(
        this.lifePickupImage,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  
    isCollidingWith(ship) {
      const dist = Math.hypot(ship.x - this.x, ship.y - this.y);
      if (dist - this.size - 5 < 1) {
        return true;
      }
      return false;
    }
  
    static spawnLifePickups(
      gameCanvas,
      scaleFactor,
      spawnX = Math.random() * gameCanvas.width
    ) {
      const size = 20 * scaleFactor;
      return new LifePickup(spawnX, 0, size / 20);
    }

    static addLife() {
      this.game.lives++;
    }
    static removeLife() {
      this.game.lives--;
    }
}
  
export class Bullet {
  constructor(ship, scaleFactor, laserSound) {
    this.bulletImage = resourceManager.getImage("laser");
    this.x = ship.x + ship.width / 2 - 5 * scaleFactor;
    this.y = ship.y - 20 * scaleFactor;
    this.width = 10 * scaleFactor;
    this.height = 20 * scaleFactor;
    this.scaleFactor = scaleFactor;
  }

  draw(gameContext) {
    gameContext.drawImage(
      this.bulletImage,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }

  move() {
    this.y -= 5 * this.scaleFactor;
  }

  static spawn(ship, scaleFactor, laserSound) {
    return new Bullet(ship, scaleFactor, laserSound);
  }
}
