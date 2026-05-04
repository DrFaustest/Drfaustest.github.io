export class Explosion {
  constructor(x, y, scaleFactor) {
    console.log("Explosion created at", x, y);
    this.scaleFactor = scaleFactor;
    this.x = x;
    this.y = y;
    this.width = 40 * scaleFactor;
    this.height = 40 * scaleFactor;
    this.frameIndex = 0;
    this.frameCount = 5; // Total number of explosion animation frames
    this.frameDuration = 5; // How many game cycles each frame lasts
    this.currentFrameDuration = 0;
    this.isComplete = false;
    
    const gameContainer = document.getElementById('stack');
    const gameCanvas = document.getElementById('gameCanvas');
    let offsetX = 0;
    let offsetY = 0;

    if (gameContainer && gameCanvas) {
      const containerRect = gameContainer.getBoundingClientRect();
      const canvasRect = gameCanvas.getBoundingClientRect();
      offsetX = canvasRect.left - containerRect.left;
      offsetY = canvasRect.top - containerRect.top;
    }

    // Create DOM element for explosion
    this.element = document.createElement('div');
    this.element.className = 'explosion';
    this.element.style.position = 'absolute';
    this.element.style.left = `${offsetX + x}px`;
    this.element.style.top = `${offsetY + y}px`;
    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;
    
    // Add to game container - NOT the canvas itself
    if (gameContainer) {
      gameContainer.appendChild(this.element);
      // Start CSS animation
      this.element.classList.add('explode-animation');
    } else {
      console.error("Game container not found! Can't add explosion.");
    }
  }

  update() {
    this.currentFrameDuration++;
    if (this.currentFrameDuration >= this.frameDuration) {
      this.frameIndex++;
      this.currentFrameDuration = 0;
      
      if (this.frameIndex >= this.frameCount) {
        this.isComplete = true;
        // Remove element when animation is complete
        if (this.element && this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
      }
    }
    return !this.isComplete; // Return true if explosion should continue
  }
}
