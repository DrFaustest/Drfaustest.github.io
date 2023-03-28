// Initialize game variables
var canvas, ctx;
var playerX, playerY, playerRadius;
var boxes, boxSpeed, boxInterval, boxMinWidth, boxMaxWidth;
var score;

// Initialize game state
var gameState = 'start';

// Setup game canvas
function setupCanvas() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth / 2;
  canvas.height = window.innerHeight / 2;
}

// Start game loop
function startGame() {
  // Initialize game variables
  playerX = canvas.width / 2;
  playerY = canvas.height - 50;
  playerRadius = 25;
  boxes = [];
  boxSpeed = 1;
  boxInterval = 1000;
  boxMinWidth = 50;
  boxMaxWidth = 150;
  score = 0;

  // Set up event listeners
  canvas.addEventListener('click', jump);

  // Set game state to 'game'
  gameState = 'game';

  // Start game loop
  requestAnimationFrame(update);
}

// Update game state
function update() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.beginPath();
  ctx.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#333';
  ctx.fill();
  ctx.closePath();

  // Move and draw boxes
  for (var i = 0; i < boxes.length; i++) {
    var box = boxes[i];

    box.y -= boxSpeed;

    ctx.beginPath();
    ctx.rect(box.x, box.y, box.width, box.height);
    ctx.fillStyle = '#F44336';
    ctx.fill();
    ctx.closePath();

    // Check for collision with player
    if (box.y + box.height >= playerY - playerRadius) {
      if (playerX >= box.x && playerX <= box.x + box.width) {
        // Player jumped over box
        score++;
        boxes.splice(i, 1);
        i--;
      } else {
        // Player collided with box
        endGame();
        return;
      }
    }
  }

  // Spawn new box
  if (boxes.length === 0 || Date.now() - boxes[boxes.length - 1].spawnTime >= boxInterval) {
    spawnBox();
  }

  // Update score display
  document.getElementById('score-value').innerHTML = score;

  // Request next frame
  requestAnimationFrame(update);
}

// Spawn new box
function spawnBox() {
  var minWidth = Math.min(boxMinWidth, boxMaxWidth - boxSpeed * 5);
  var maxWidth = Math.max(boxMinWidth, boxMaxWidth - boxSpeed * 5);
  var width = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;

  boxes.push({
    x: Math.floor(Math.random() * (canvas.width - width)),
    y: canvas.height,
    width: width,
    height: 50,
    spawnTime: Date.now()
  });
}

// Make player jump
function jump(event) {
  playerY -= 100;
}

// End game
function endGame() {
  // Set game state to 'game over'
  gameState = 'game-over';

  // Remove event listeners
  canvas.removeEventListener('click', jump);

  // Update final score display
  document.getElementById('final-score-value').innerHTML = score;

  // Switch to game over screen
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('game-over-screen').style.display = 'block';
    }
    
    // Set up canvas and start screen button
    window.onload = function() {
    setupCanvas();
    document.getElementById('start-button').addEventListener('click', startGame);
    };
