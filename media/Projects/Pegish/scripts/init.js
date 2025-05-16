// Initialize canvas size properly before main game scripts load
document.addEventListener('DOMContentLoaded', () => {
  // Set initial canvas size
  const canvas = document.getElementById('gameCanvas');
  if (canvas) {
    // Get container size
    const container = document.getElementById('gameInterface');
    
    // Force minimum canvas size
    if (canvas.width < 100 || canvas.height < 100) {
      canvas.width = 800;
      canvas.height = 540;
    }
    
    // Ensure gameVariables.json is loaded and properly used
    fetch('gameVariables.json')
      .then(response => response.json())      .then(data => {
        // Apply loaded canvas dimensions
        // Don't override the canvas dimensions here - let the resizeCanvas function handle it
      })      .catch(error => {
        // Silently handle errors loading game variables
      });
  } else {
    // Handle missing canvas element
  }
});
