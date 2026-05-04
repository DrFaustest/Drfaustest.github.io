export class GameDisplay {
  constructor(gameContext, gameCanvas, scaleFactor) {
    this.gameContext = gameContext;
    this.gameCanvas = gameCanvas;
    this.scaleFactor = scaleFactor;
    this.startTime = null;
    this.font = `normal bold ${16 * this.scaleFactor}px BrunoAceSC`;
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

  drawWave(waveName) {
    if (!waveName) {
      return;
    }

    this.gameContext.fillStyle = waveName.includes("Boss") ? "#ff3d7f" : "#ffb703";
    this.gameContext.font = `normal bold ${14 * this.scaleFactor}px BrunoAceSC`;
    this.gameContext.textAlign = "center";
    this.gameContext.fillText(waveName, this.gameCanvas.width / 2, 56);
  }

  drawStartScreen(leaderboard = []) {
    this.gameContext.font = "normal bold 50px BrunoAceSC";
    this.gameContext.fillStyle = "white";
    this.gameContext.textAlign = "center";
    this.gameContext.fillText(
      "Press Space or Tap to Start",
      this.gameCanvas.width / 2,
      this.gameCanvas.height / 2 - 40
    );
    this.drawLeaderboard(leaderboard, this.gameCanvas.height / 2 + 28);
  }

  drawGameOverScreen(score, leaderboard = []) {
    this.gameContext.fillStyle = "white";
    this.gameContext.font = "normal bold 50px BrunoAceSC";
    this.gameContext.textAlign = "center";
    this.gameContext.fillText(
      `Game Over. Your score is ${score}`,
      this.gameCanvas.width / 2,
      this.gameCanvas.height / 2 - 130
    );
    this.drawLeaderboard(leaderboard, this.gameCanvas.height / 2 - 70);
    this.gameContext.font = "normal bold 30px BrunoAceSC";
    this.gameContext.fillText(
      "Press fire to Play Again",
      this.gameCanvas.width / 2,
      this.gameCanvas.height / 2 + 190
    );
  }

  drawLeaderboard(leaderboard, startY) {
    this.gameContext.save();
    this.gameContext.textAlign = "center";
    this.gameContext.fillStyle = "#ffb703";
    this.gameContext.font = `normal bold ${22 * this.scaleFactor}px BrunoAceSC`;
    this.gameContext.fillText("Local Leaderboard", this.gameCanvas.width / 2, startY);

    this.gameContext.font = `normal bold ${15 * this.scaleFactor}px BrunoAceSC`;
    const entries = leaderboard.slice(0, 5);

    if (entries.length === 0) {
      this.gameContext.fillStyle = "rgba(255,255,255,0.78)";
      this.gameContext.fillText("No scores yet", this.gameCanvas.width / 2, startY + 34);
      this.gameContext.restore();
      return;
    }

    entries.forEach((entry, index) => {
      const y = startY + 34 + index * 26 * this.scaleFactor;
      const rank = `${index + 1}.`.padEnd(3, " ");
      this.gameContext.fillStyle = index === 0 ? "#ff3d7f" : "rgba(255,255,255,0.86)";
      this.gameContext.fillText(
        `${rank} ${entry.name}  ${entry.score}`,
        this.gameCanvas.width / 2,
        y
      );
    });
    this.gameContext.restore();
  }

  drawHUD(lives, score, startTime, waveName) {
    this.drawLives(lives);
    this.drawScore(score);
    this.drawClock(startTime);
    this.drawWave(waveName);
  }

    clearCanvas() {
    this.gameContext.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
  }

}
