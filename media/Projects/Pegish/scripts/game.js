import { Cannon } from './cannon.js';
import { Peg } from './peg.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.settings = {
            pegRadius: 10,
            ballSpeed: 10,
            ballRadius: 8,
            marginX: 0.05,
            marginY: 0.1,
            cannonAngleLimit: Math.PI / 4,
            particleCount: 15,
            gridSize: 40,
            maxPegs: 100,
            startingBalls: 5
        };
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.frameCount = 0;
        this.lastTime = 0;
        this.fps = 0;
        this.playArea = {
            x: 0,
            y: 0, 
            width: 0,
            height: 0
        };
        
        // Try to load settings, then initialize
        this.loadGameVariables();
    }

    loadGameVariables() {
        fetch('gameVariables.json')
            .then(response => response.json())
            .then(data => {
                // Merge loaded settings with defaults
                this.settings = { ...this.settings, ...data };
                  // Use dimensions from the JSON but respect current canvas size
                
                // Do not override canvas dimensions here - use the dimensions from HTML
                // Instead of:
                // this.canvas.width = data.canvasWidth;
                // this.canvas.height = data.canvasHeight;
                
                // Initialize the game with current canvas dimensions
                this.init();
            })            .catch(error => {
                // If can't load settings, just use defaults
                this.init();
            });
    }

    init() {
        // Set canvas dimensions based on container
        this.updateCanvasSize();
        
        // Define the play area
        this.updatePlayArea(this.canvas.width, this.canvas.height);
    }
      updateCanvasSize() {
        // Make canvas fill its container while maintaining CSS dimensions
        const rect = this.canvas.getBoundingClientRect();
        
        // Set canvas dimensions
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Handle high DPI screens
        const dpr = window.devicePixelRatio || 1;
        if (dpr > 1) {
            const ctx = this.context;
            ctx.scale(dpr, dpr);
        }
    }
    
    updatePlayArea(width, height) {
        this.playArea = {
            x: 0,
            y: 0,
            width: width,
            height: height
        };
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        
        // Set up responsive design handlers
        window.addEventListener('resize', () => {
            this.updateCanvasSize();
            this.updatePlayArea(this.canvas.width, this.canvas.height);
        });
        
        // Add pause/resume functionality for mobile
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.isPaused = true;
            } else {
                this.isPaused = false;
            }
        });
    }
    
    // Performance monitoring for smooth gameplay
    updateFPS() {
        const now = performance.now();
        const delta = now - this.lastTime;
        this.fps = Math.round(1000 / delta);
        this.lastTime = now;
        this.frameCount++;
    }
    
    // Debug function for development
    showDebug() {
        // Only show debug info every 30 frames to avoid performance impact
        if (this.frameCount % 30 !== 0) return;
        
        this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.context.fillRect(10, 40, 120, 60);
        this.context.fillStyle = 'white';
        this.context.font = '12px monospace';
        this.context.fillText(`FPS: ${this.fps}`, 20, 60);
        this.context.fillText(`Objects: ${this.frameCount}`, 20, 80);
        this.context.fillText(`Screen: ${this.canvas.width}x${this.canvas.height}`, 20, 100);
    }
}