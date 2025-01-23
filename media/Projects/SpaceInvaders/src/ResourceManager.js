export class ResourceManager {
    constructor() {
      this.images = {};
      this.sounds = {};
      this.isMuted = true;
    }
  
    // --- IMAGE LOADING ---
    loadImage(name, src) {
      const img = new Image();
      img.src = src;
      this.images[name] = img;
    }
  
    getImage(name) {
      if (!this.images[name]) {
        console.warn(`Image "${name}" not found.`);
        return this.images["placeholder"];
      }
      return this.images[name];
    }
  
    async loadAllImages() {
      const promises = Object.entries(this.images).map(([name, img]) => {
        return new Promise((resolve, reject) => {
          img.onload = () => resolve(name);
          img.onerror = () => {
            console.error(`Failed to load image: ${name}`);
            resolve(name); // Prevent rejection from stopping other loads
          };
        });
      });
      return Promise.all(promises);
    }
  
    // --- SOUND LOADING ---
    loadSound(name, src, options = { loop: false }) {
      const audio = new Audio(src);
      audio.loop = options.loop;
      this.sounds[name] = audio;
    }
  
    playSound(name) {
      if (!this.isMuted && this.sounds[name]) {
        this.sounds[name].currentTime = 0; // Reset sound to the start
        this.sounds[name].play();
      }
    }
  
    stopSound(name) {
      if (this.sounds[name]) {
        this.sounds[name].pause();
        this.sounds[name].currentTime = 0;
      }
    }
  
    toggleMute() {
      this.isMuted = !this.isMuted;
      Object.values(this.sounds).forEach((audio) => {
        if (this.isMuted) {
          audio.pause();
        } else if (audio.loop) {
          audio.play();
        }
      });
    }
  }
  
  // Initialize ResourceManager
  const resourceManager = new ResourceManager();
  
  // Load images
  resourceManager.loadImage("player", "../images/player.png");
  resourceManager.loadImage("playerLeft", "../images/playerLeft.png");
  resourceManager.loadImage("playerRight", "../images/playerRight.png");
  resourceManager.loadImage("laser", "../images/laserGreen.png");
  resourceManager.loadImage("enemy1", "../images/enemyShip.png");
  resourceManager.loadImage("enemy2", "../images/enemyUFO.png");
  resourceManager.loadImage("life", "../images/life.png");
  //resourceManager.loadImage("placeholder", "../images/placeholder.png"); // Optional placeholder
  
  // Load sounds
  resourceManager.loadSound("backgroundMusic", "../sounds/neon-noir.mp3", { loop: true });
  resourceManager.loadSound("laser", "../sounds/laser.mp3");
  resourceManager.loadSound("explosion", "../sounds/explosion.mp3");
  
  export default resourceManager;
  