export class Bullet {
  constructor(ship, scaleFactor, laserSound) {
    this.bulletImage = new Image();
    this.bulletImage.src = "../images/laserGreen.png";
    this.x = ship.x + ship.width / 2 - 5 * scaleFactor;
    this.y = ship.y - 20 * scaleFactor;
    this.width = 10 * scaleFactor;
    this.height = 20 * scaleFactor;
    this.scaleFactor = scaleFactor;
    this.laserSound = laserSound;
    this.laserSound.playbackRate = 3;
    this.laserSound.volume = 0.5;
    if (!this.laserSound.paused) {
      this.laserSound.currentTime = 0;
    }
    this.laserSound.play();
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
