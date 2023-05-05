window.addEventListener("DOMContentLoaded", function () {
  // Initialize canvas, context, images, sounds, and variables
  const gameCanvas = document.getElementById("gameCanvas");
  const gameContext = gameCanvas.getContext("2d");
  gameCanvas.width = window.innerWidth - 10;
  gameCanvas.height = window.innerHeight - 10;

  const ship = {
    x: gameCanvas.width / 2,
    y: gameCanvas.height - 50,
    size: 20,
    width: 50,
    height: 50,
  };
  const bullets = [];
  const enemies = [];
  let gameOver = false;
  let gameOverTime = null;

  const keys = {};

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

  const laserSound = new Audio(
    "../sounds/zapsplat_cartoon_anime_hit_zap_laser.mp3"
  );
  laserSound.playbackRate = 2;
  const destroySound = new Audio(
    "../sounds/esm_8bit_explosion_medium_with_voice_bomb_boom_blast_cannon_retro_old_school_classic_cartoon.mp3"
  );
  const backgroundMusic = new Audio("../sounds/neon-noir.mp3");
  backgroundMusic.loop = true;
  backgroundMusic.play();

  // Initialize background animation
  const backgroundCanvas = document.getElementById("background");
  const backgroundContext = backgroundCanvas.getContext("2d");
  const numPixels = 1000;
  const pixelSize = 1;
  const pixels = [];
  backgroundSetup();
  setInterval(backgroundDraw, 50);

  // Game state and score variables
  let score = 0;
  let startTime = null;
  let gameStarted = false;
  let prevShipX = ship.x;

  // Set up the starfield background
  function backgroundSetup() {
    backgroundCanvas.width = window.innerWidth;
    backgroundCanvas.height = window.innerHeight;
    for (let i = 0; i < numPixels; i++) {
      const x = Math.floor(Math.random() * backgroundCanvas.width);
      const y = Math.floor(Math.random() * backgroundCanvas.height);
      const pixel = { x: x, y: y };
      pixels.push(pixel);
    }
  }

  // Draw the starfield background
  function backgroundDraw() {
    backgroundContext.clearRect(0,0,backgroundCanvas.width,backgroundCanvas.height);
    backgroundContext.fillStyle = "white";
    for (let i = 0; i < numPixels; i++) {
      const pixel = pixels[i];
      pixel.y += 2;
      if (pixel.y > backgroundCanvas.height) {
        pixel.y = 0;
        pixel.x = Math.floor(Math.random() * backgroundCanvas.width);
      }
      backgroundContext.fillRect(pixel.x, pixel.y, pixelSize, pixelSize);
    }
  }

  // Main game functions
  function restartGame() {
    location.reload();
  }

  function gameLoop() {
    if (gameOver) {
      if (gameOverTime === null) {
        gameOverTime = Date.now();
      }
      drawGameOverScreen();
      setTimeout(() => {
        window.addEventListener("keydown", restartGame);
        window.addEventListener("click", restartGame);
        window.addEventListener("touchstart", restartGame);
      }, 1000);
      return;
    }
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  function fireBullet() {
    if (!gameStarted || gameOver) return;
    const bullet = {
      x: ship.x + ship.width / 2 - 5,
      y: ship.y - 20,
      width: 10,
      height: 20,
    };
    bullets.push(bullet);
    laserSound.cloneNode(true).play();
  }

  function playDestroySound() {
    destroySound.cloneNode(true).play();
  }

  function update() {
    moveShip();
    updateBullets();
    updateEnemies();
    spawnEnemies();
    checkCollisions();

    // Start game with spacebar
    if (!gameStarted && keys[" "]) {
      gameStarted = true;
      startTime = Date.now();
      startBackgroundMusic();
    }

    // Reset game with spacebar if game over
    if (gameOver && keys[" "]) {
      location.reload();
    }
  }

  function startBackgroundMusic() {
    backgroundMusic.play();
  }

  function draw() {
    gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    if (!gameStarted) {
      drawStartScreen();
    } else {
      drawShip();
      bullets.forEach(drawBullet);
      enemies.forEach(drawEnemy);
      drawScore();
      drawClock();
    }
    // Check if game over and draw game over screen
    if (gameOver) {
      drawGameOverScreen();
    }
  }

  // Update functions
  function moveShip() {
    if (keys.ArrowLeft) {
      ship.x -= 5;
      if (ship.x < 0) ship.x = 0;
    } else if (keys.ArrowRight) {
      ship.x += 5;
      if (ship.x > gameCanvas.width - ship.width)
        ship.x = gameCanvas.width - ship.width;
    }
  }

  function updateBullets() {
    bullets.forEach((bullet, index) => {
      bullet.y -= 5;
      if (bullet.y < 0) bullets.splice(index, 1);
    });
  }

  function updateEnemies() {
    enemies.forEach((enemy, index) => {
      enemy.y += 1;
      if (enemy.y + enemy.size > gameCanvas.height) gameOver = true;
    });
  }

  function spawnEnemies() {
    if (Math.random() < 0.01) {
      const size = 40;
      const x = Math.random() * (gameCanvas.width - size * 2) + size;
      enemies.push({ x, y: 0, size, width: size, height: size });
    }
  }

  function checkCollisions() {
    enemies.forEach((enemy, index) => {
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
  }

  // Draw functions
  function drawShip() {
    let currentImage = playerImage;
    if (ship.x < prevShipX) {
      currentImage = playerImageLeft;
    } else if (ship.x > prevShipX) {
      currentImage = playerImageRight;
    }

    prevShipX = ship.x;
    gameContext.drawImage(
      currentImage,
      ship.x,
      ship.y,
      ship.width,
      ship.height
    );
  }

  function drawBullet(bullet) {
    gameContext.drawImage(
      bulletImage,
      bullet.x,
      bullet.y,
      bullet.width,
      bullet.height
    );
  }

  function drawEnemy(enemy) {
    gameContext.drawImage(
      enemyImage,
      enemy.x,
      enemy.y,
      enemy.width,
      enemy.height
    );
  }

  function drawScore() {
    gameContext.fillStyle = "white";
    gameContext.font = "16px Arial";
    gameContext.textAlign = "center";
    gameContext.fillText(`Score: ${score}`, gameCanvas.width / 2, 20);
  }

  function drawClock() {
    if (startTime !== null) {
      const time = Math.floor((Date.now() - startTime) / 1000);
      gameContext.fillStyle = "white";
      gameContext.font = "16px Arial";
      gameContext.textAlign = "right";
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

    if (Date.now() - gameOverTime >= 5000) {
      gameContext.font = "30px Arial";
      gameContext.fillText(
        "Press fire to Play Again",
        gameCanvas.width / 2,
        gameCanvas.height / 2 + 50
      );
    }
  }

  function handleStartGame() {
    if (!gameStarted) {
      gameStarted = true;
      startTime = Date.now();
    }
  }

  // Event listeners
  function setupEventListeners() {
    document.addEventListener("mousedown", handleStartGame);
    document.addEventListener("touchstart", handleStartGame);

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

    window.addEventListener("mousemove", (e) => {
      ship.x = e.clientX;
      if (ship.x < 0) ship.x = 0;
      if (ship.x > gameCanvas.width) ship.x = gameCanvas.width;
    });
    window.addEventListener("mousedown", (e) => {
      fireBullet();
    });

    window.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        ship.x = e.touches[0].clientX;
        if (ship.x < 0) ship.x = 0;
        if (ship.x > gameCanvas.width) ship.x = gameCanvas.width;
      },
      { passive: false }
    );

    window.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        fireBullet();
      },
      { passive: false }
    );
  }

  // Initialize game
  setupEventListeners();
  gameLoop();
});
