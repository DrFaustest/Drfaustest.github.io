// Handle start screen button click
document.getElementById('start-button').addEventListener('click', function() {
    // Switch to game screen
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
  });
  
  // Update canvas size on window resize
  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  