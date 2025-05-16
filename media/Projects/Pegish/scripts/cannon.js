import { Ball } from './ball.js';

export class Cannon {    
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.angle = 0; // Angle in radians
        this.targetAngle = 0; // For smooth rotation
        this.isBallInPlay = false; // Track if a ball is in play
        this.cannonWidth = 26;
        this.cannonLength = 70;
        this.cannonColor = '#1a1f3d'; // Dark color for cannon body
        this.accentColor = '#6200ea'; // Highlight/accent color
        this.recoilAmount = 0; // For firing animation
        this.aimLine = true; // Show aim line
        this.aimLineLength = 150; // Max length of aim line

        // Get the dimensions from HTML attributes if they are set
        const htmlWidth = parseInt(canvas.getAttribute('width')) || canvas.width;
        const htmlHeight = parseInt(canvas.getAttribute('height')) || canvas.height;
        
        // Use the best available dimensions
        const width = Math.max(canvas.width, htmlWidth);
        const height = Math.max(canvas.height, htmlHeight);
        
        // Ensure canvas has valid dimensions
        if (width < 100 || height < 100) {
            // Use fallback dimensions
            this.centerX = 400; // Default to middle of assumed 800px width
            this.centerY = 450; // Default position near bottom of assumed 500px height
        } else {
            // Position at bottom of screen
            this.centerX = width / 2;
            this.centerY = height - 50;
        }
        
        // Extra check for proper positioning
        if (this.centerY < height / 2) {
            this.centerY = height - 50;
        }
        
        this.listeningForInput = false;
        this.addEventListeners();
    }    
    draw(context) {
        // ALWAYS ensure the cannon is properly positioned at the bottom of the canvas
        // This serves as a failsafe if other code doesn't update the position correctly
        const oldCenterX = this.centerX;
        const oldCenterY = this.centerY;
        
        // Always get fresh dimensions directly from the canvas element
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Ensure we have valid canvas dimensions
        if (canvasWidth < 100 || canvasHeight < 100) {
            // Try to get dimensions from HTML attributes
            const htmlWidth = parseInt(this.canvas.getAttribute('width')) || 800;
            const htmlHeight = parseInt(this.canvas.getAttribute('height')) || 540;
            
            // Try other methods to get valid dimensions
            const clientWidth = this.canvas.clientWidth || htmlWidth;
            const clientHeight = this.canvas.clientHeight || htmlHeight;
            
            // Use the best available dimensions - prefer larger values
            const bestWidth = Math.max(canvasWidth, htmlWidth, clientWidth, 800);
            const bestHeight = Math.max(canvasHeight, htmlHeight, clientHeight, 540);
            
            // Update canvas dimensions
            this.canvas.width = bestWidth;
            this.canvas.height = bestHeight;
            
            // Force a redraw of the entire game
            if (window.resizeCanvas) {
                window.setTimeout(() => window.resizeCanvas(), 0);
            }
        }
        
        // Calculate the correct position regardless of dimension issues
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height - 50;
        
        // Triple check that the cannon is positioned in the bottom half of the screen
        if (this.centerY < this.canvas.height / 2) {
            this.centerY = this.canvas.height - 50;
        }
        
        // Smooth angle transition
        this.angle = this.angle * 0.9 + this.targetAngle * 0.1;
        
        // Draw aim line
        if (this.aimLine && !this.isBallInPlay) {
            this.drawAimLine(context);
        }
        
        // Draw cannon base (half-circle for bottom positioning)
        context.beginPath();
        context.arc(this.centerX, this.centerY, this.cannonWidth * 1.5, Math.PI, Math.PI * 2);
        const baseGradient = context.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.cannonWidth * 1.5
        );
        baseGradient.addColorStop(0, '#2c3367');
        baseGradient.addColorStop(1, '#1a1f3d');
        context.fillStyle = baseGradient;
        context.fill();
        context.strokeStyle = this.accentColor;
        context.lineWidth = 2;
        context.stroke();
        
        // Add a platform under the cannon
        context.beginPath();
        context.rect(this.centerX - this.cannonWidth * 2, this.centerY, this.cannonWidth * 4, this.cannonWidth * 0.5);
        context.fillStyle = '#1a1f3d';
        context.fill();
        context.strokeStyle = this.accentColor;
        context.lineWidth = 1;
        context.stroke();

        // Draw cannon barrel
        context.save();
        context.translate(this.centerX, this.centerY - this.recoilAmount); // Apply recoil
        context.rotate(this.angle);
        
        // Cannon body (barrel)
        this.drawCannonBarrel(context);
        
        context.restore();
        
        // Update recoil animation
        if (this.recoilAmount > 0) {
            this.recoilAmount *= 0.85; // Decay the recoil
            if (this.recoilAmount < 0.1) this.recoilAmount = 0;
        }
    }
    drawCannonBarrel(context) {
        // Main barrel
        context.beginPath();
        
        // Create rounded rectangle for barrel
        const width = this.cannonWidth;
        const height = this.cannonLength;
        const radius = width / 2;
        
        context.moveTo(-width/2, 0);
        context.lineTo(-width/2, -height + radius);
        context.quadraticCurveTo(-width/2, -height, -width/2 + radius, -height);
        context.lineTo(width/2 - radius, -height);
        context.quadraticCurveTo(width/2, -height, width/2, -height + radius);
        context.lineTo(width/2, 0);
        context.closePath();
        
        // Gradient fill
        const barrelGradient = context.createLinearGradient(0, 0, 0, -height);
        barrelGradient.addColorStop(0, '#1a1f3d');
        barrelGradient.addColorStop(1, '#2c3367');
        context.fillStyle = barrelGradient;
        context.fill();
        
        // Barrel outline
        context.strokeStyle = this.accentColor;
        context.lineWidth = 2;
        context.stroke();
        
        // Barrel details (decorative rings)
        for (let i = 1; i <= 3; i++) {
            const ringPos = -height * (i / 4);
            context.beginPath();
            context.moveTo(-width/2, ringPos);
            context.lineTo(width/2, ringPos);
            context.strokeStyle = this.accentColor + '80'; // Semi-transparent
            context.lineWidth = 1;
            context.stroke();
        }
        
        // Barrel highlight
        context.beginPath();
        context.moveTo(-width/4, 0);
        context.lineTo(-width/4, -height + radius);
        context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        context.lineWidth = width/6;
        context.stroke();
        
        // Muzzle flash when firing (if recoil is active)
        if (this.recoilAmount > 1) {
            this.drawMuzzleFlash(context, width, height);
        }
    }
    
    drawMuzzleFlash(context, width, height) {
        const flashSize = width * (this.recoilAmount / 3);
        
        // Check for valid dimensions
        if (!isFinite(flashSize) || flashSize <= 0) {
            return;
        }
        
        context.beginPath();
        context.arc(0, -height, flashSize, 0, Math.PI * 2);
        
        const flashGradient = context.createRadialGradient(
            0, -height, 0,
            0, -height, flashSize
        );
        flashGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        flashGradient.addColorStop(0.4, 'rgba(255, 171, 0, 0.7)');
        flashGradient.addColorStop(1, 'rgba(255, 87, 34, 0)');
        
        context.fillStyle = flashGradient;
        context.fill();
    }
      
    drawAimLine(context) {
        const startX = this.centerX;
        const startY = this.centerY;
        
        // Calculate endpoint based on angle and max length
        // For bottom-positioned cannon, we need to use negative cosine for y
        const endX = startX + Math.sin(this.angle) * this.aimLineLength;
        const endY = startY - Math.cos(this.angle) * this.aimLineLength; // Use negative for upward direction
        
        // Draw dashed aim line
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.setLineDash([5, 3]);
        context.strokeStyle = 'rgba(0, 229, 255, 0.5)';
        context.lineWidth = 2;
        context.stroke();
        
        // Reset line dash
        context.setLineDash([]);
        
        // Draw aim point at end
        context.beginPath();
        context.arc(endX, endY, 4, 0, Math.PI * 2);
        context.fillStyle = 'rgba(0, 229, 255, 0.8)';
        context.fill();    
    }
    
    adjustAngle(delta) {
        this.targetAngle += delta;
        // Since we're at the bottom now, we need to constrain the angle differently
        // Limit to upward directions only (we don't want to shoot downward)
        this.targetAngle = Math.max(-Math.PI * 0.8, Math.min(Math.PI * 0.8, this.targetAngle));
    }
    
    fireBall() {
        if (this.isBallInPlay) return; // Prevent firing if a ball is already in play

        const speed = 18; // Increased initial velocity
        const angle = this.angle;
        const dx = speed * Math.sin(angle);
        const dy = -speed * Math.cos(angle); // Negative for upward motion (important!)
        
        // Spawn ball at the end of the cannon barrel
        const spawnDistance = this.cannonLength;
        const ballX = this.centerX + Math.sin(angle) * spawnDistance;
        const ballY = this.centerY - Math.cos(angle) * spawnDistance; // Negative for upward direction        // Create a new ball instance and add it to the game
        if (this.onFire) {
            const newBall = new Ball(ballX, ballY, dx, dy);
            // Ensure the ball starts with zero score
            newBall.tempScore = 0;
            newBall.pegHits = 0;
            this.onFire(newBall);
        }

        this.isBallInPlay = true; // Lock the fire button
        this.recoilAmount = 5; // Add recoil effect when firing
    }

    ballOutOfPlay() {
        this.isBallInPlay = false; // Unlock the fire button when the ball is out of play
    }

    addEventListeners() {
        if (this.listeningForInput) return;
        this.listeningForInput = true;
        
        // Mouse controls for desktop
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        
        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Keyboard controls
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Handle visibility change (pause when tab is not active)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isBallInPlay = true; // Prevent firing when tab is not visible
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }
      
    handleResize() {
        // Update center position to maintain bottom positioning
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height - 50;
        
        // Verify position is at the bottom half
        if (this.centerY < this.canvas.height / 2) {
            // Force position to bottom
            this.centerY = this.canvas.height - 50;
        }
    }
    
    handleMouseMove(event) {
        if (this.canvas.style.display === 'none') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        this.calculateAngle(mouseX, mouseY);
    }
    
    handleMouseDown(event) {
        if (!this.isBallInPlay) {
            this.fireBall();
        }
    }
    
    handleTouchStart(event) {
        // No need to prevent default here to allow scrolling when not playing
    }
    
    handleTouchMove(event) {
        if (this.canvas.style.display === 'none') return;
        
        // Prevent default to stop scrolling while aiming
        event.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = event.touches[0];
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        this.calculateAngle(touchX, touchY);
    }
    
    handleTouchEnd(event) {
        if (!this.isBallInPlay && this.canvas.style.display !== 'none') {
            this.fireBall();
        }
    }
    
    handleKeyDown(event) {
        // Allow firing with spacebar
        if (event.key === ' ' || event.key === 'Enter') {
            if (!this.isBallInPlay && this.canvas.style.display !== 'none') {
                this.fireBall();
            }
        }
        
        // Allow aiming with arrow keys
        if (event.key === 'ArrowLeft') {
            this.adjustAngle(-0.1);
        } else if (event.key === 'ArrowRight') {
            this.adjustAngle(0.1);
        }
    }
      
    calculateAngle(x, y) {
        // Calculate angle based on pointer position
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        
        // Convert to radians and save as target (for smooth movement)
        // For bottom cannon, negative dy means pointing upward
        this.targetAngle = Math.atan2(dx, -dy);
        
        // For bottom cannon, we want to limit to mostly upward angles
        // This prevents shooting downward or horizontally
        this.targetAngle = Math.max(-Math.PI * 0.8, Math.min(Math.PI * 0.8, this.targetAngle));
    }
}