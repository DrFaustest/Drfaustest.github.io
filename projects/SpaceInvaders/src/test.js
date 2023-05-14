

window.addEventListener("DOMContentLoaded", function () {
  // Initialize canvas, context, images, sounds, and variables
  const gameCanvas = document.getElementById("gameCanvas");
  const gameContext = gameCanvas.getContext("2d");
  gameCanvas.width = window.innerWidth - 100;
  gameCanvas.height = window.innerHeight - 250;
  const baseScreenWidth = 1440;
  const scaleFactor = Math.max(1, gameCanvas.width / baseScreenWidth);

  const ship = {
    x: gameCanvas.width / 2,
    y: gameCanvas.height - 50 * scaleFactor,
    size: 20 * scaleFactor,
    width: 50 * scaleFactor,
    height: 50 * scaleFactor,
  };
  const bullets = [];
  const enemies = [];
  let gameOver = false;
  let gameOverTime = null;
  let lives = 3;
  let autoFireInterval = null;
  const keys = {};
  const lifePickups = [];
  

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
  const lifePickupImage = new Image();
lifePickupImage.src = "../images/life.png";

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

  function spawnLifePickups() {
    if (Math.random() < 0.0005) { // Adjust spawn rate as needed
      const size = 20 * scaleFactor;
      const x = Math.random() * (gameCanvas.width - size * 2) + size;
      lifePickups.push({ x, y: 0, size, width: size, height: size });
    }
  }

  function drawLifePickup(pickup) {
  gameContext.drawImage(
    lifePickupImage,
    pickup.x,
    pickup.y,
    pickup.width,
    pickup.height
  );
}

function drawLives() {
  gameContext.fillStyle = "white";
  gameContext.font = `normal bold ${16 * scaleFactor}px bruno ace`;
  gameContext.textAlign = "center";
  gameContext.fillText(`Lives: ${lives}`, gameCanvas.width / 2, 40);
}

  function checkLifePickups() {
  lifePickups.forEach((pickup, index) => {
    const dist = Math.hypot(ship.x - pickup.x, ship.y - pickup.y);
    if (dist - pickup.size - 5 < 1) {
      // Increase lives and remove pickup
      lives = Math.min(5, lives + 1); // Limit max lives to 5
      lifePickups.splice(index, 1);
    }
  });
}

  // Main game functions
  function restartGame() {
    location.reload();
  }

  function gameLoop() {
    if (lives <= 0) {
      gameOver = true;
    }
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
      x: ship.x + ship.width / 2 - 5 * scaleFactor,
      y: ship.y - 20 * scaleFactor,
      width: 10 * scaleFactor,
      height: 20 * scaleFactor,
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
    updateLifePickups();
    spawnEnemies();
    checkCollisions();
    spawnLifePickups();
    checkLifePickups();

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
      lifePickups.forEach(drawLifePickup);
      drawScore();
      drawClock();
      drawLives();
    }
    // Check if game over and draw game over screen
    if (gameOver) {
      drawGameOverScreen();
    }
  }

  // Update functions
  function moveShip() {
    if (keys.ArrowLeft) {
      ship.x -= 5 * scaleFactor;
      if (ship.x < 0) ship.x = 0;
    } else if (keys.ArrowRight) {
      ship.x += 5 * scaleFactor;
      if (ship.x > gameCanvas.width - ship.width)
        ship.x = gameCanvas.width - ship.width;
    }
  }

  function updateBullets() {
    bullets.forEach((bullet, index) => {
      bullet.y -= 5 * scaleFactor;
      if (bullet.y < 0) bullets.splice(index, 1);
    });
  }

  function updateEnemies() {
    enemies.forEach((enemy, index) => {
      enemy.y += 1 * scaleFactor;
      if (enemy.y + enemy.size > gameCanvas.height) {
        enemies.splice(index, 1);
        lives -= 1;
      }
    });
  }

  function updateLifePickups() {
    lifePickups.forEach((pickup, index) => {
      pickup.y += 1 * scaleFactor;
      if (pickup.y + pickup.size > gameCanvas.height) {
        lifePickups.splice(index, 1);
      }
    });
  }

  function spawnEnemies() {
    if (Math.random() < 0.01) {
      const size = 40 * scaleFactor;
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
  
      // Player and enemy collision
      const dist = Math.hypot(ship.x - enemy.x, ship.y - enemy.y);
      if (dist - enemy.size - ship.size < 1) {
        playDestroySound();
        enemies.splice(index, 1);
        lives -= 1;
        if (lives <= 0) gameOver = true;
      }
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
    gameContext.font = `normal bold ${30 * scaleFactor}px bruno ace SC`;
    gameContext.textAlign = "center";
    gameContext.fillText(`Score: ${score}`, gameCanvas.width / 2, 20);
  }

  function drawClock() {
    if (startTime !== null) {
      const time = Math.floor((Date.now() - startTime) / 1000);
      gameContext.fillStyle = "white";
      gameContext.font = `normal bold ${30 * scaleFactor}px bruno ace`;
      gameContext.textAlign = "right";
      gameContext.fillText(`Time: ${time}`, gameCanvas.width - 70, 20);
    }
  }



  function drawStartScreen() {
    gameContext.fillStyle = "white";
    gameContext.font = "normal bold 50px bruno ace";
    gameContext.textAlign = "center";
    gameContext.fillText(
      "Press Space or Tap to Start",
      gameCanvas.width / 2,
      gameCanvas.height / 2
    );
  }

  function drawGameOverScreen() {
    gameContext.fillStyle = "white";
    gameContext.font = "normal bold 50px bruno ace";
    gameContext.textAlign = "center";
    gameContext.fillText(
      `Game Over. Your score is ${score}`,
      gameCanvas.width / 2,
      gameCanvas.height / 2 - 50
    );

    if (Date.now() - gameOverTime >= 5000) {
      gameContext.font = "normal bold 30px Arial";
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
      ship.x = e.clientX - ship.width / 2;
      if (ship.x < 0) ship.x = 0;
      if (ship.x > gameCanvas.width - ship.width) ship.x = gameCanvas.width - ship.width;
    });
    window.addEventListener("mousedown", (e) => {
      fireBullet();
    });

    window.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        ship.x = e.touches[0].clientX - ship.width / 2;
        if (ship.x < 0) ship.x = 0;
        if (ship.x > gameCanvas.width - ship.width) ship.x = gameCanvas.width - ship.width;
      },
      { passive: false }
    );

    window.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        fireBullet();
        if (!autoFireInterval) {
          autoFireInterval = setInterval(fireBullet, 500); // Fires every 500ms
        }
      },
      { passive: false }
    );
    
    window.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        if (autoFireInterval) {
          clearInterval(autoFireInterval);
          autoFireInterval = null;
        }
      },
      { passive: false }
    );
  }
  

  // Initialize game
  setupEventListeners();
  gameLoop();
});
