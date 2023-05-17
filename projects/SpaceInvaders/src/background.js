//Background functions not required to be looped
const backgroundMusic = new Audio("../sounds/neon-noir.mp3");
backgroundMusic.loop = true;
backgroundMusic.play();

// Initialize background animation
const backgroundCanvas = document.getElementById("background");
const backgroundContext = backgroundCanvas.getContext("2d");
const numPixels = 200;
const pixelSize = 1;
const pixels = [];
const canvasWidth = window.innerWidth;
const canvasHeight = window.innerHeight;
backgroundCanvas.width = canvasWidth;
backgroundCanvas.height = canvasHeight;

// Generate random x positions for the pixels but pre calculate them so we don't have to do it every frame
let randomXPositions = new Array(numPixels).fill(0).map(() => Math.floor(Math.random() * canvasWidth));

backgroundSetup();

// Set up the starfield background
function backgroundSetup() {
  for (let i = 0; i < numPixels; i++) {
    const x = randomXPositions[i];
    const y = Math.floor(Math.random() * canvasHeight);
    const pixel = { x: x, y: y };
    pixels.push(pixel);
  }
  requestAnimationFrame(backgroundDraw);
}

// Draw the starfield background
function backgroundDraw() {
  backgroundContext.clearRect(0, 0, canvasWidth, canvasHeight);
  backgroundContext.fillStyle = "white";
  for (let i = 0; i < numPixels; i++) {
    const pixel = pixels[i];
    pixel.y += 2;
    if (pixel.y > canvasHeight) {
      pixel.y = 0;
      pixel.x = randomXPositions[(i + 1) % numPixels];
    }
    backgroundContext.fillRect(pixel.x, pixel.y, pixelSize, pixelSize);
  }
  requestAnimationFrame(backgroundDraw);
}