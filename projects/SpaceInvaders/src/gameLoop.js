
window.addEventListener("DOMContentLoaded", function () {
  // Background Animation
  var backgroundCanvas = document.getElementById("background");
  var backgroundContext = backgroundCanvas.getContext("2d");

  var numPixels = 1000;
  var pixelSize = 1;
  var pixels = [];
  var gameCanvas = document.getElementById("gameCanvas");
  var gameContext = gameCanvas.getContext("2d");
  gameCanvas.width = window.innerWidth - 10;
  gameCanvas.height = window.innerHeight - 10;
  const ship = { x: gameCanvas.width / 2, y: gameCanvas.height - 50, size: 20, width: 50, height: 50 };

  const bullets = [];
  const enemies = [];
  let gameOver = false;
  const keys = {};
  const laserSound = new Audio("../sounds/zapsplat_cartoon_anime_hit_zap_laser.mp3");
  laserSound.playbackRate = 2;
  const destroySound = new Audio('../sounds/esm_8bit_explosion_medium_with_voice_bomb_boom_blast_cannon_retro_old_school_classic_cartoon.mp3');
  const backgroundMusic = new Audio('../sounds/neon-noir.mp3');
  backgroundMusic.loop = true;
  backgroundMusic.play();

  const playerImage = new Image();
  playerImage.src = "../images/player.png";

  const playerImageLeft = new Image();
playerImageLeft.src = "../images/playerLeft.png";

const playerImageRight = new Image();
playerImageRight.src = "../images/playerRight.png";

  const bulletImage = new Image();
bulletImage.src = "../images/laserGreen.png";

const enemyImage = new Image();
enemyImage.src = "../images/enemyShip.png";

let prevShipX = ship.x;

  function backgroundSetup() {
    backgroundCanvas.width = window.innerWidth;
    backgroundCanvas.height = window.innerHeight;

    for (var i = 0; i < numPixels; i++) {
      var x = Math.floor(Math.random() * backgroundCanvas.width);
      var y = Math.floor(Math.random() * backgroundCanvas.height);
      var pixel = { x: x, y: y };
      pixels.push(pixel);
    }
  }

  function backgroundDraw() {
    backgroundContext.clearRect(
      0,
      0,
      backgroundCanvas.width,
      backgroundCanvas.height
    );
    backgroundContext.fillStyle = "white";

    for (var i = 0; i < numPixels; i++) {
      var pixel = pixels[i];
      pixel.y += 2;
      if (pixel.y > backgroundCanvas.height) {
        pixel.y = 0;
        pixel.x = Math.floor(Math.random() * backgroundCanvas.width);
      }
      backgroundContext.fillRect(pixel.x, pixel.y, pixelSize, pixelSize);
    }
  }

  backgroundSetup();
  setInterval(backgroundDraw, 50);

  // Game Logic


  // Define score and startTime variables here
  let score = 0;
  let startTime = null;

  // Define gameStarted variable here
  let gameStarted = false;

  function drawShip() {
    let currentImage = playerImage;
  
    if (ship.x < prevShipX) {
      currentImage = playerImageLeft;
    } else if (ship.x > prevShipX) {
      currentImage = playerImageRight;
    }
  
    prevShipX = ship.x;
    gameContext.drawImage(currentImage, ship.x, ship.y, ship.width, ship.height);
  }

  function drawBullet(bullet) {
    gameContext.drawImage(bulletImage, bullet.x, bullet.y, bullet.width, bullet.height);
  }
  
  function drawEnemy(enemy) {
    gameContext.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
  }
  

  function update() {
    updateScore();
    updateClock();
    // Move ship with arrow keys
    if (keys.ArrowLeft) {
      ship.x -= 5;
      if (ship.x < 0) ship.x = 0;
    } else if (keys.ArrowRight) {
      ship.x += 5;
      if (ship.x > gameCanvas.width - ship.width) ship.x = gameCanvas.width - ship.width;
    }

    bullets.forEach((bullet, index) => {
      bullet.y -= 5;
      if (bullet.y < 0) bullets.splice(index, 1);
    });

    enemies.forEach((enemy, index) => {
      enemy.y += 1;
      if (enemy.y + enemy.size > gameCanvas.height) gameOver = true;

      bullets.forEach((bullet, bulletIndex) => {
        const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
        if (dist - enemy.size - 5 < 1) {
          score += 1;
          playDestroySound();
          enemies.splice(index, 1);
          bullets.splice(bulletIndex, 1);
        }
      });
    });

    if (Math.random() < 0.01) {
      const size = 40;
      const x = Math.random() * (gameCanvas.width - size * 2) + size;
      enemies.push({ x, y: 0, size, width: size, height: size });
    }
    

    // Start game with spacebar
    if (!gameStarted && keys[" "]) {
      gameStarted = true;
      startTime = Date.now();
    }

    // Reset game with spacebar if game over
    if (gameOver && keys[" "]) {
      location.reload();
    }
  }

  function draw() {
    gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    if (!gameStarted) {
      drawStartScreen();
    } else {
      drawShip();
      bullets.forEach(drawBullet);
      enemies.forEach(drawEnemy);

      gameContext.fillStyle = "white";
      gameContext.font = "16px Arial";
      gameContext.fillText(`Score: ${score}`, gameCanvas.width / 2, 20);

      // Draw clock
      if (startTime !== null) {
        const time = Math.floor((Date.now() - startTime) / 1000);
        gameContext.fillText(`Time: ${time}`, gameCanvas.width - 70, 20);
      }
    }

    // Check if game over and draw game over screen
    if (gameOver) {
      drawGameOverScreen();
    }
  }

  function gameLoop() {
    if (gameOver) {
      drawGameOverScreen();
      window.addEventListener("keydown", restartGame);
      window.addEventListener("click", restartGame);
      window.addEventListener("touchstart", restartGame);
      return;
    }
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  function restartGame(e) {
    if (e.type === "keydown" && e.key !== " ") {
      return;
    }
    if (e.type === "click" || e.type === "touchstart") {
      e.preventDefault();
      location.reload();
    }
  }

  function updateScore() {
    if (score > 0 && !gameStarted) {
      gameStarted = true;
      startTime = Date.now();
    }
  }

  function updateClock() {
    if (gameStarted && startTime !== null) {
      const time = Math.floor((Date.now() - startTime) / 1000);
      gameContext.fillStyle = "white";
      gameContext.font = "16px Arial";
      gameContext.fillText(`Time: ${time}`, gameCanvas.width - 70, 20);
    }
  }

  function drawStartScreen() {
    gameContext.fillStyle = "white";
    gameContext.font = "50px Arial";
    gameContext.textAlign = "center";
    gameContext.fillText(
      "Press Space or Tap to Start",
      gameCanvas.width / 2,
      gameCanvas.height / 2
    );
  }

  function drawGameOverScreen() {
    gameContext.fillStyle = "white";
    gameContext.font = "50px Arial";
    gameContext.textAlign = "center";
    gameContext.fillText(
      `Game Over. Your score is ${score}`,
      gameCanvas.width / 2,
      gameCanvas.height / 2 - 50
    );
    gameContext.font = "30px Arial";
    gameContext.fillText(
      "Press Space to Play Again",
      gameCanvas.width / 2,
      gameCanvas.height / 2 + 50
    );
  }

  function handleStartGame() {
    gameStarted = true;
    startTime = Date.now();
    document.removeEventListener("keydown", handleStartGame);
    document.removeEventListener("mousedown", handleStartGame);
    document.removeEventListener("touchstart", handleStartGame);
  }

  function playLaserSound() {
  laserSound.currentTime = 0; // reset playback position to start of audio file
  laserSound.play();
}

function playDestroySound() {
  destroySound.currentTime = 0;
  destroySound.play();
}

function fireBullet() {
  const bulletWidth = 10;
  const bulletHeight = 20;
  bullets.push({ x: ship.x + ship.width / 2 - bulletWidth / 2, y: ship.y - ship.size / 2, width: bulletWidth, height: bulletHeight });
  playLaserSound();
}




  document.addEventListener("keydown", handleStartGame);
  document.addEventListener("mousedown", handleStartGame);
  document.addEventListener("touchstart", handleStartGame);

  gameLoop();

  // Keyboard controls
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === " ") {
      fireBullet();
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
    if (e.key === " " && gameOver) {
      gameOver = false;
      score = 0;
      bullets.length = 0;
      enemies.length = 0;
      gameStarted = false;
    }
  });

  // Mouse controls
  window.addEventListener("mousemove", (e) => {
    ship.x = e.clientX;
    if (ship.x < 0) ship.x = 0;
    if (ship.x > gameCanvas.width) ship.x = gameCanvas.width;
  });
  window.addEventListener("mousedown", (e) => {
    fireBullet();
  });

  // Touch controls
  window.addEventListener("touchmove", (e) => {
    e.preventDefault();
    ship.x = e.touches[0].clientX;
    if (ship.x < 0) ship.x = 0;
    if (ship.x > gameCanvas.width) ship.x = gameCanvas.width;
  });
  window.addEventListener("touchstart", (e) => {
    e.preventDefault();
    fireBullet();
  });
});
