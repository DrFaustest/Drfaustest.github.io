export class Ball {
    constructor(x, y, dx, dy, radius = 8) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = radius;
        this.isOutOfPlay = false;        this.gravity = 0.015; // Reduced gravity to compensate for higher initial velocity
        this.gravityIncrement = 0.0008;
        this.tempScore = 0;
        this.pegHits = 0;
        this.trail = [];
        this.maxTrailLength = 10;
        this.bounceEnergy = 0.8; // Energy retention on bounce
        this.friction = 0.99; // Air friction
        this.lastX = x;
        this.lastY = y;
        
        // Ball appearance
        this.color = this.getRandomBallColor();
        this.innerGlow = true;
    }

    draw(context) {
        // Draw trail first (behind the ball)
        this.drawTrail(context);
        
        // Draw the ball with a gradient for a 3D look
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Create a radial gradient
        const gradient = context.createRadialGradient(
            this.x - this.radius/3, // x0
            this.y - this.radius/3, // y0
            0,                      // r0
            this.x,                 // x1
            this.y,                 // y1
            this.radius             // r1
        );
        
        // Add gradient colors
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.8, this.color);
        
        context.fillStyle = gradient;
        context.fill();
        
        // Add a subtle highlight
        context.beginPath();
        context.arc(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            this.radius * 0.35,
            0,
            Math.PI * 2
        );
        context.fillStyle = "rgba(255, 255, 255, 0.6)";
        context.fill();
        
        // Add outline for better visibility
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.lineWidth = 1;
        context.strokeStyle = "rgba(255, 255, 255, 0.5)";
        context.stroke();
        
        // Add an inner glow effect for special balls (after hitting purple pegs)
        if (this.innerGlow) {
            context.beginPath();
            context.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
            context.fillStyle = `${this.color}33`; // Semi-transparent
            context.fill();
        }
    }
      drawTrail(context) {
        // Draw ball trail
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            
            // Reverse the alpha calculation so it fades away from the ball
            // More recent points (smaller i) should be more visible
            const alpha = 0.5 * (1 - i / this.trail.length); 
            
            // Similarly reverse the size calculation
            // More recent points should be larger (closer to ball size)
            const sizeRatio = 1 - (0.7 * (i / this.trail.length));
            
            context.beginPath();
            context.arc(point.x, point.y, this.radius * sizeRatio, 0, Math.PI * 2);
            context.fillStyle = `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            context.fill();
        }
    }update(canvas, pegs, level = 1) {
        // Save current position for trail
        this.lastX = this.x;
        this.lastY = this.y;
        
        // Update position
        this.x += this.dx;
        this.y += this.dy;

        // Update trail - longer trail for higher velocity
        this.trail.unshift({ x: this.lastX, y: this.lastY });
        if (this.trail.length > this.maxTrailLength + 5) {
            this.trail.pop();
        }

        // Apply physics
        this.applyPhysics(level);
        
        // Check for collisions with pegs
        this.checkPegCollisions(pegs);
        
        // Check for wall collisions
        this.checkWallCollisions(canvas);
        
        // Check if out of play
        // With cannon at bottom, ball is out if it goes below the canvas OR if it gets too close to cannon
        const cannonY = canvas.height - 50; // Same as cannon centerY
        const cannonX = canvas.width / 2;
        const ballDistanceFromCannonCenter = Math.abs(this.x - cannonX);
          // Position tracking (no debug logging needed)
        
        if ((this.y + this.radius > canvas.height) || 
            (this.y > cannonY - 30 && ballDistanceFromCannonCenter > 40 && 
             Math.abs(this.dx) < 3 && this.dy > 0)) {
            this.handleOutOfPlay();
        }
    }
    
    applyPhysics(level) {
        // Dynamically increase gravity based on level
        const oldGravity = this.gravity;
        const oldDy = this.dy;
          // For a bottom-positioned cannon, gravity should be positive to pull the ball down
        this.gravity += this.gravityIncrement * Math.min(level, 3);
        this.dy += this.gravity;
        
        // Apply friction (air resistance)
        this.dx *= this.friction;
    }
    
    checkPegCollisions(pegs) {
        // Use traditional for loop for better control during removal
        for (let i = pegs.length - 1; i >= 0; i--) {
            const peg = pegs[i];
            const distance = Math.hypot(this.x - peg.x, this.y - peg.y);
            
            if (distance < this.radius + peg.radius) {
                // Calculate exact collision angle
                const collisionAngle = Math.atan2(this.y - peg.y, this.x - peg.x);
                
                // Calculate velocity magnitude
                const velocity = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
                const direction = Math.atan2(this.dy, this.dx);
                
                // Calculate new velocity components
                const newDirection = 2 * collisionAngle - direction;
                this.dx = Math.cos(newDirection) * velocity * this.bounceEnergy;
                this.dy = Math.sin(newDirection) * velocity * this.bounceEnergy;
                
                // Add some randomness for realism
                this.dx += (Math.random() - 0.5) * 0.5;
                this.dy += (Math.random() - 0.5) * 0.5;
                
                // Add peg value to temp score
                this.tempScore += peg.value;
                
                // Apply special peg effects
                this.applyPegEffect(peg);
                
                // Mark peg for hit animation
                peg.hit();
                
                // Remove the peg
                pegs.splice(i, 1);
                
                // Track number of pegs hit
                this.pegHits++;
            }
        }
    }
    
    applyPegEffect(peg) {
        switch (peg.type) {
            case 'purple':
                // Purple pegs multiply score
                this.tempScore *= 2;
                // Change ball appearance
                this.color = '#9c27b0';
                this.innerGlow = true;
                // Speed boost
                this.dx *= 1.1;
                this.dy *= 1.1;
                break;
                
            case 'green':
                // Green pegs give massive bonus
                this.tempScore += 500;
                // Change ball appearance
                this.color = '#00c853';
                this.innerGlow = true;
                // Slow down gravity temporarily
                this.gravity *= 0.7;
                break;
                
            case 'orange':
                // Orange pegs are required for completion
                this.tempScore += 100;
                break;
                
            case 'blue':
                // Blue pegs just give score
                break;
        }
    }
      checkWallCollisions(canvas) {
        // Bounce off side walls with energy loss
        if (this.x - this.radius < 0) {
            this.x = this.radius; // Prevent sticking to left wall
            this.dx = -this.dx * this.bounceEnergy;
        } else if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius; // Prevent sticking to right wall
            this.dx = -this.dx * this.bounceEnergy;
        }

        // Bounce off the top
        if (this.y - this.radius < 0) {
            this.y = this.radius; // Prevent sticking to ceiling
            this.dy = -this.dy * this.bounceEnergy;
        }
        
        // With cannon at bottom, check for hitting bottom wall
        // This is to prevent the ball from getting stuck behind the cannon
        const cannonY = canvas.height - 50; // Same as cannon centerY
        if (this.y + this.radius > cannonY - 10) {
            // Ball is approaching the cannon area - check if it's directly above cannon
            const cannonX = canvas.width / 2;
            const ballDistanceFromCannonCenter = Math.abs(this.x - cannonX);
            
            // If ball is too close to cannon, bounce it up
            if (ballDistanceFromCannonCenter < 40) {
                this.y = cannonY - 10 - this.radius;
                this.dy = -Math.abs(this.dy) * this.bounceEnergy;
            }
        }
    }    handleOutOfPlay() {
        this.isOutOfPlay = true;
        
        // Calculate final score for this ball
        const bonus = this.pegHits > 5 ? Math.pow(this.pegHits, 1.2) : 0;
        const finalBallScore = this.tempScore + Math.floor(bonus);
        
        console.log(`Ball out of play: Temp score=${this.tempScore}, Pegs hit=${this.pegHits}, Bonus=${bonus}, Final=${finalBallScore}`);
        
        // First dispatch the event for the main game to handle
        const scoreEvent = new CustomEvent('ballScore', {
            detail: {
                score: this.tempScore,
                bonus: bonus
            }
        });
        
        document.dispatchEvent(scoreEvent);
        
        // As a fallback, also update the DOM directly
        // This ensures the score is updated even if the event handler fails
        try {
            const scoreElement = document.getElementById('score');
            if (scoreElement) {
                const currentScore = parseInt(scoreElement.textContent) || 0;
                const newScore = currentScore + finalBallScore;
                scoreElement.textContent = newScore;
                console.log(`Direct score update: ${currentScore} -> ${newScore}`);
                
                // Store in localStorage as another fallback
                try {
                    localStorage.setItem('pegishCurrentScore', newScore);
                } catch (e) {
                    // Silently ignore
                }
            }
        } catch (e) {
            console.error("Error updating score directly:", e);
        }
        
        // Display the score popup
        this.showScorePopup();
    }showScorePopup() {
        // Calculate bonus based on pegs hit
        const hitBonus = this.pegHits > 5 ? Math.pow(this.pegHits, 1.2) : 0;
        const finalScore = Math.floor(this.tempScore + hitBonus);
        
        // Create modern styled popup - position it where the ball was
        const popup = document.createElement('div');
        popup.id = 'finalScoreDisplay';
        popup.className = 'score-popup';
        
        // Position where the ball was last seen
        popup.style.top = `${this.y}px`;
        popup.style.left = `${this.x}px`;
        popup.style.transform = 'translate(-50%, -50%) scale(0)';
        
        // Add content based on performance
        if (this.pegHits > 8) {
            popup.textContent = `AMAZING! +${finalScore}`;
            popup.style.border = '2px solid #00c853';
            popup.style.color = '#00c853';
        } else if (this.pegHits > 5) {
            popup.textContent = `GREAT! +${finalScore}`;
            popup.style.border = '2px solid #ffab00';
            popup.style.color = '#ffab00';
        } else {
            popup.textContent = `+${finalScore}`;
            popup.style.color = '#ffffff';
        }
        
        // Add to the DOM
        document.body.appendChild(popup);
        
        // Remove after animation completes (2s)
        setTimeout(() => {
            if (popup.parentNode) {
                document.body.removeChild(popup);
            }
        }, 2000);
    }
    
    getRandomBallColor() {
        const colors = [
            '#1e88e5', // blue
            '#ff9800', // orange
            '#e91e63', // pink
            '#00c853', // green
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}