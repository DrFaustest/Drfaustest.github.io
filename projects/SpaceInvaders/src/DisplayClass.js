export class GameDisplay {
  constructor(gameContext, gameCanvas, scaleFactor) {
    this.gameContext = gameContext;
    this.gameCanvas = gameCanvas;
    this.scaleFactor = scaleFactor;
    this.startTime = null;
    this.font = `normal bold ${16 * this.scaleFactor}px bruno ace`;
  }

  drawLives(lives) {
    this.gameContext.fillStyle = "white";
    this.gameContext.font = this.font;
    this.gameContext.textAlign = "center";
    this.gameContext.fillText(
      `Lives: ${lives}`,
      this.gameCanvas.width / 10,
      30
    );
  }

  drawScore(score) {
    this.gameContext.fillStyle = "white";
    this.gameContext.font = this.font;
    this.gameContext.textAlign = "center";
    this.gameContext.fillText(`Score: ${score}`, this.gameCanvas.width / 2, 30);
  }

  drawClock(startTime) {
    if (startTime !== null) {
      const time = Math.floor((Date.now() - startTime) / 1000);
      this.gameContext.fillStyle = "white";
      this.gameContext.font = this.font;
      this.gameContext.textAlign = "right";
      this.gameContext.fillText(
        `Time: ${time}`,
        this.gameCanvas.width - 70,
        30
      );
    }
  }

  drawStartScreen() {
    this.gameContext.font = "normal bold 50px bruno ace";
    this.gameContext.fillStyle = "white";
    this.gameContext.textAlign = "center";
    this.gameContext.fillText(
      "Press Space or Tap to Start",
      this.gameCanvas.width / 2,
      this.gameCanvas.height / 2
    );
  }

  drawGameOverScreen(score) {
    this.gameContext.fillStyle = "white";
    this.gameContext.font = "normal bold 50px bruno ace";
    this.gameContext.textAlign = "center";
    this.gameContext.fillText(
      `Game Over. Your score is ${score}`,
      this.gameCanvas.width / 2,
      this.gameCanvas.height / 2 - 50
    );
    this.gameContext.font = "normal bold 30px bruno ace";
    this.gameContext.fillText(
      "Press fire to Play Again",
      this.gameCanvas.width / 2,
      this.gameCanvas.height / 2 + 50
    );
  }

  drawHUD(lives, score, startTime) {
    this.drawLives(lives);
    this.drawScore(score);
    this.drawClock(startTime);
  }

    clearCanvas() {
    this.gameContext.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
  }

}
