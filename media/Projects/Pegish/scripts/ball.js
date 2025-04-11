export class Ball {
    constructor(x, y, dx, dy, radius = 10) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = radius;
        this.isOutOfPlay = false;
        this.gravity = 0;
        this.gravityIncrement = 0.0005;
        this.tempScore = 0;
    }

    draw(context) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = 'white';
        context.fill();
        context.closePath();
    }

    update(canvas, pegs) {
        this.x += this.dx;
        this.y += this.dy;

        // Dynamically increase gravity over time
        this.gravity += this.gravityIncrement;
        this.dy += this.gravity;

        // Apply friction to slow down horizontal movement
        const friction = 1; // Slightly increased friction to slow horizontal movement
        this.dx *= friction;

        // Bounce off walls
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.dx = -this.dx;
        }

        // Bounce off the top
        if (this.y - this.radius < 0) {
            this.dy = -this.dy;
        }

        // Remove ball if it hits the floor
        if (this.y + this.radius > canvas.height) {
            this.isOutOfPlay = true; // Mark the ball as out of play
        }

        pegs.forEach((peg, index) => {
            const distance = Math.hypot(this.x - peg.x, this.y - peg.y);
            if (distance < this.radius + peg.radius) {
                // Add peg value to temp score
                this.tempScore += peg.value;
                if (peg.type === 'purple') {
                    this.tempScore *= 2; // Apply multiplier for purple pegs
                }
                // Remove the peg on collision
                pegs.splice(index, 1);
                // Reverse vertical direction slightly to simulate bounce
                this.dy = -Math.abs(this.dy) * 0.8;
            }
        });

        // When the ball leaves the play area, update the total score
        if (this.isOutOfPlay) {
            const scoreElement = document.getElementById('score');
            let currentScore = parseInt(scoreElement.textContent, 10) || 0;
            currentScore += this.tempScore;
            scoreElement.textContent = currentScore;

            // Display the final score for this ball
            const scoreDisplay = document.createElement('div');
            scoreDisplay.id = 'finalScore';
            scoreDisplay.textContent = `Score: ${this.tempScore}`;
            scoreDisplay.style.position = 'absolute';
            scoreDisplay.style.top = '50%';
            scoreDisplay.style.left = '50%';
            scoreDisplay.style.transform = 'translate(-50%, -50%)';
            scoreDisplay.style.color = 'white';
            scoreDisplay.style.fontSize = '2rem';
            scoreDisplay.style.fontFamily = 'Arial, sans-serif';
            scoreDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            scoreDisplay.style.padding = '20px';
            scoreDisplay.style.borderRadius = '10px';
            document.body.appendChild(scoreDisplay);

            setTimeout(() => {
                document.body.removeChild(scoreDisplay);
            }, 3000);
        }
    }
}