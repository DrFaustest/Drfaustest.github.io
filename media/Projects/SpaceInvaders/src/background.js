
// Initialize background animation
const backgroundCanvas = document.getElementById("background");
const backgroundContext = backgroundCanvas.getContext("2d");
const canvasWidth = window.innerWidth;
const canvasHeight = window.innerHeight;
backgroundCanvas.width = canvasWidth;
backgroundCanvas.height = canvasHeight;

// Define layers with different speeds and properties
const layers = [
  { speed: 1, color: "white", size: 1, pixels: [] },
  { speed: 0.5, color: "gray", size: 2, pixels: [] },
];

// Generate random positions for each layer's pixels
function backgroundSetup() {
  layers.forEach((layer, index) => {
    for (let i = 0; i < 100; i++) { // Adjust the number of pixels per layer as needed
      const x = Math.floor(Math.random() * canvasWidth);
      const y = Math.floor(Math.random() * canvasHeight);
      layer.pixels.push({ x, y });
    }
  });
  requestAnimationFrame(backgroundDraw);
}

// Draw the starfield background
function backgroundDraw() {
  backgroundContext.clearRect(0, 0, canvasWidth, canvasHeight);
  layers.forEach((layer) => {
    layer.pixels.forEach((pixel) => {
      pixel.y += layer.speed;
      if (pixel.y > canvasHeight) pixel.y = 0; // Reset pixel to top if it goes out of bounds
      backgroundContext.fillStyle = layer.color;
      backgroundContext.fillRect(pixel.x, pixel.y, layer.size, layer.size);
    });
  });
  requestAnimationFrame(backgroundDraw);
}

// Start the background setup and animation
backgroundSetup();