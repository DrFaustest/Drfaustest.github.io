function setupEventListeners(ship, fireBullet, gameCanvas, gameStarted, gameOver, score, bullets, enemies, handleStartGame, autoFireInterval, keys) {
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