//LivesClass.js

export class LifePickup {
    constructor(x, y, scaleFactor) {
      this.x = x;
      this.y = y;
      this.scaleFactor = scaleFactor;
      this.size = 20 * scaleFactor;
      this.width = this.size;
      this.height = this.size;
      this.lifePickupImage = new Image();
      this.lifePickupImage.src = "../images/life.png";
    }
  
    move() {
      this.y += 1; // adjust speed as necessary
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
  
    static spawnLifePickups(gameCanvas, scaleFactor, spawnX = Math.random() * gameCanvas.width) {
        const size = 20 * scaleFactor;
        // Use the provided spawnX instead of a random x value
        return new LifePickup(spawnX, 0, size/20);
    }
    
  }