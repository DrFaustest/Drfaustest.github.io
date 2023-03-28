// Handle game over screen button click
document.getElementById('restart-button').addEventListener('click', function() {
    // Switch to start screen
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
  });
  
  // Update canvas size on window resize
  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  