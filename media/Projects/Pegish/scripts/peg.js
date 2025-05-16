export class Peg {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // blue, orange, purple, green
        this.radius = 10;
        this.glowRadius = 12;
        this.value = this.getValue(); // Assign value based on type
        
        // Animation properties
        this.initialY = y;
        this.pulseValue = Math.random() * Math.PI * 2; // Random starting phase
        this.pulseSpeed = 0.03;
        this.hoverAmount = 1 + Math.random(); // Random hover amplitude
        this.glowOpacity = 0.5;
        this.glowPulse = 0;
        this.rotationAngle = 0;
        
        // Interactive animation state
        this.isHit = false;
        this.hitAnimationFrame = 0;
        this.hitAnimationDuration = 10;
        
        // For special pegs (green/purple)
        this.specialEffect = Math.random() > 0.5;
    }

    draw(context, level = 1) {
        // Calculate current animation state
        this.pulseValue += this.pulseSpeed;
        this.glowPulse = Math.sin(this.pulseValue) * 0.5 + 0.5;
        
        // Special pegs rotate slightly
        if (this.type === 'green' || this.type === 'purple') {
            this.rotationAngle += 0.01;
        }
        
        // Draw glow effect
        this.drawGlowEffect(context);
        
        // Draw peg body
        context.save();
        
        // Apply rotation for special pegs
        if ((this.type === 'green' || this.type === 'purple') && this.specialEffect) {
            context.translate(this.x, this.y);
            context.rotate(this.rotationAngle);
            context.translate(-this.x, -this.y);
        }
        
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Draw with gradient for a polished look
        const gradient = context.createRadialGradient(
            this.x - this.radius/3, 
            this.y - this.radius/3, 
            0, 
            this.x, 
            this.y, 
            this.radius * 1.2
        );
        
        const colors = this.getGradientColors();
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        
        context.fillStyle = gradient;
        context.fill();
        
        // Add highlight reflection
        context.beginPath();
        context.arc(
            this.x - this.radius * 0.3, 
            this.y - this.radius * 0.3, 
            this.radius * 0.4, 0, Math.PI * 2
        );
        context.fillStyle = "rgba(255, 255, 255, 0.4)";
        context.fill();
        
        // Add outline for better visibility
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.lineWidth = 1;
        context.strokeStyle = "rgba(255, 255, 255, 0.6)";
        context.stroke();
        
        context.restore();
        
        // Draw hit animation if active
        if (this.isHit) {
            this.drawHitAnimation(context);
        }
        
        // Mark orange pegs more distinctly at higher levels
        if (this.type === 'orange' && level > 3) {
            const markerSize = 3;
            context.fillStyle = 'white';
            context.beginPath();
            context.arc(this.x, this.y, markerSize, 0, Math.PI * 2);
            context.fill();
        }
    }
    
    drawGlowEffect(context) {
        const glowSize = this.radius + 2 + this.glowPulse * 2;
        const glowOpacity = (this.glowPulse * 0.3) + 0.2;
        
        context.beginPath();
        context.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        
        const glowColor = this.getGlowColor();
        context.fillStyle = glowColor.replace('1.0)', `${glowOpacity})`);
        context.fill();
    }
    
    drawHitAnimation(context) {
        // Draw expanding ring
        const progress = this.hitAnimationFrame / this.hitAnimationDuration;
        const expandedRadius = this.radius + (this.radius * 2 * progress);
        const opacity = 1 - progress;
        
        context.beginPath();
        context.arc(this.x, this.y, expandedRadius, 0, Math.PI * 2);
        context.lineWidth = 2;
        context.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        context.stroke();
        
        // Increment animation frame
        this.hitAnimationFrame++;
        if (this.hitAnimationFrame > this.hitAnimationDuration) {
            this.isHit = false;
            this.hitAnimationFrame = 0;
        }
    }

    getGlowColor() {
        switch (this.type) {
            case 'blue': return 'rgba(30, 136, 229, 1.0)';
            case 'orange': return 'rgba(255, 152, 0, 1.0)';
            case 'purple': return 'rgba(156, 39, 176, 1.0)';
            case 'green': return 'rgba(0, 200, 83, 1.0)';
            default: return 'rgba(30, 136, 229, 1.0)';
        }
    }
    
    getGradientColors() {
        switch (this.type) {
            case 'blue': return ['#64b5f6', '#1565c0'];
            case 'orange': return ['#ffb74d', '#e65100'];
            case 'purple': return ['#ce93d8', '#6a1b9a'];
            case 'green': return ['#81c784', '#1b5e20'];
            default: return ['#64b5f6', '#1565c0'];
        }
    }

    getColor() {
        switch (this.type) {
            case 'blue': return '#1e88e5';
            case 'orange': return '#ff9800';
            case 'purple': return '#9c27b0';
            case 'green': return '#00c853';
            default: return '#1e88e5';
        }
    }

    getValue() {
        switch (this.type) {
            case 'blue': return 10;
            case 'orange': return 100;
            case 'purple': return 50;
            case 'green': return 200;
            default: return 10;
        }
    }
    
    update() {
        // Add subtle floating animation
        if (!this.isHit) {
            const floatY = Math.sin(this.pulseValue) * this.hoverAmount;
            this.y = this.initialY + floatY;
        }
    }
    
    hit() {
        this.isHit = true;
        this.hitAnimationFrame = 0;
    }

    static generateLevel(canvas, pegCount, playArea, level = 1) {
        const pegs = [];
        const marginX = playArea.width * 0.05; // 5% margin on the x-axis
        const marginY = playArea.height * 0.1; // 10% margin on the y-axis
        
        // Add level-specific patterns when level increases
        if (level <= 3) {
            // Random pattern for initial levels
            generateRandomPattern();
        } else if (level <= 5) {
            // Grid pattern for medium levels
            generateGridPattern();
        } else {
            // Circular pattern for higher levels
            generateCircularPattern();
        }
        
        return pegs;
        
        // Helper functions for peg patterns
        function generateRandomPattern() {
            for (let i = 0; i < pegCount; i++) {
                let x, y;
                let isOverlapping;
                let attempts = 0;
                const maxAttempts = 50;

                do {
                    x = Math.random() * (playArea.width - marginX * 2) + marginX;
                    y = Math.random() * (playArea.height - marginY * 2) + marginY;                    // Avoid bottom area where the cannon is now
                    if (y > playArea.height * 0.85) {
                        y = playArea.height * 0.85 - Math.random() * (playArea.height * 0.1);
                    }

                    // Check for overlap with existing pegs (with increased spacing)
                    isOverlapping = pegs.some(peg => Math.hypot(peg.x - x, peg.y - y) < 25);
                    attempts++;
                } while (isOverlapping && attempts < maxAttempts);
                
                if (attempts < maxAttempts) {
                    // Calculate peg type based on level and position
                    let type;
                    
                    if (i < 1 + level) {
                        type = 'green'; // More green pegs in higher levels
                    } else if (i < 2 + level * 1.5) {
                        type = 'purple'; // More purple pegs in higher levels
                    } else if (i < Math.floor(pegCount * (0.2 + level * 0.02)) + 4) {
                        type = 'orange'; // More orange pegs in higher levels
                    } else {
                        type = 'blue';
                    }
                    
                    pegs.push(new Peg(x, y, type));
                }
            }
        }
        
        function generateGridPattern() {
            // Create a more structured grid layout
            const cols = Math.floor(playArea.width / 40);
            const rows = Math.floor(playArea.height / 40);
            
            const startX = (playArea.width - (cols * 40)) / 2 + 20;
            // Start from the top, leaving bottom area clear for cannon
            const startY = playArea.height * 0.1;
            
            let pegIndex = 0;
            
            for (let row = 0; row < rows && pegIndex < pegCount; row++) {
                for (let col = 0; col < cols && pegIndex < pegCount; col++) {
                    // Skip some pegs for a more interesting pattern
                    if (Math.random() > 0.7) continue;
                    
                    const x = startX + col * 40;
                    const y = startY + row * 40;
                    
                    // Determine peg type
                    let type;
                    if (pegIndex < level) {
                        type = 'green';
                    } else if (pegIndex < level * 2) {
                        type = 'purple';
                    } else if (pegIndex < Math.floor(pegCount * 0.25)) {
                        type = 'orange';
                    } else {
                        type = 'blue';
                    }
                    
                    // Add some randomness to the grid
                    const randomOffsetX = (Math.random() - 0.5) * 10;
                    const randomOffsetY = (Math.random() - 0.5) * 10;
                    
                    pegs.push(new Peg(x + randomOffsetX, y + randomOffsetY, type));
                    pegIndex++;
                }
            }
        }
        
        function generateCircularPattern() {
            // Create concentric circles of pegs
            const centerX = playArea.width / 2;
            // Position circles slightly higher to avoid the cannon at bottom
            const centerY = playArea.height * 0.4;
            const maxRadius = Math.min(playArea.width, playArea.height) * 0.4;
            
            const rings = Math.min(5, level - 3); // More rings for higher levels
            let pegIndex = 0;
            
            for (let ring = 1; ring <= rings && pegIndex < pegCount; ring++) {
                const radius = (ring / rings) * maxRadius;
                const circumference = 2 * Math.PI * radius;
                const pegCount = Math.floor(circumference / 30); // Space pegs ~30px apart
                
                for (let i = 0; i < pegCount && pegIndex < pegCount; i++) {                    const angle = (i / pegCount) * Math.PI * 2;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;
                    
                    // Skip if peg would be in the bottom cannon area
                    if (y > playArea.height * 0.85) {
                        continue;
                    }
                    
                    // Determine peg type - orange pegs are more common on the outer rings
                    let type;
                    if (Math.random() < 0.05 + (level * 0.01)) {
                        type = 'green';
                    } else if (Math.random() < 0.1 + (level * 0.02)) {
                        type = 'purple';
                    } else if (ring === rings || Math.random() < 0.2 + ((ring / rings) * 0.3)) {
                        type = 'orange';
                    } else {
                        type = 'blue';
                    }
                    
                    pegs.push(new Peg(x, y, type));
                    pegIndex++;
                }
            }
            
            // Fill in remaining pegs randomly
            while (pegIndex < pegCount) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * maxRadius;
                
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                // Check for overlaps
                const isOverlapping = pegs.some(peg => Math.hypot(peg.x - x, peg.y - y) < 25);
                
                if (!isOverlapping) {
                    // More orange pegs in higher levels
                    const type = Math.random() < 0.4 ? 'orange' : 'blue';
                    pegs.push(new Peg(x, y, type));
                    pegIndex++;
                }
            }
        }
    }
}