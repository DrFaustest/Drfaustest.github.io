// Handle game over button click
document.getElementById('restart-button').addEventListener('click', function() {
    // Switch to start screen
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
  });
  
  // Spawn initial boxes
  for (var i = 0; i < 3; i++) {
    spawnBox();
  }
  
  // Start box spawn interval
  setInterval(function() {
    boxInterval -= 50;
    boxSpeed += 0.1;
  }, 10000);
  