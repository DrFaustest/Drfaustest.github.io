import { Ball } from './ball.js';

export class Cannon {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.angle = 0; // Angle in radians
        this.isBallInPlay = false; // Track if a ball is in play
        this.addEventListeners();
    }

    draw(context) {
        const centerX = this.canvas.width / 2;
        const centerY = 50; // Position the cannon near the top

        context.save();
        context.translate(centerX, centerY);
        context.rotate(this.angle);
        context.fillStyle = 'gray';
        context.fillRect(-10, -30, 20, 60); // Cannon body
        context.restore();
    }

    adjustAngle(delta) {
        this.angle += delta;
        this.angle = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.angle)); // Limit angle
    }

    fireBall() {
        if (this.isBallInPlay) return; // Prevent firing if a ball is already in play

        const speed = 10;
        const centerX = this.canvas.width / 2;
        const centerY = 50; // Cannon's fixed y-coordinate
        const dx = speed * Math.cos(this.angle + Math.PI / 2);
        const dy = speed * Math.sin(this.angle + Math.PI / 2);

        // Create a new ball instance and add it to the game
        if (this.onFire) {
            this.onFire(new Ball(centerX, centerY, dx, dy));
        }

        this.isBallInPlay = true; // Lock the fire button
    }

    ballOutOfPlay() {
        this.isBallInPlay = false; // Unlock the fire button when the ball is out of play
    }

    addEventListeners() {
        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const centerX = this.canvas.width / 2;
            const centerY = 50; // Cannon's fixed y-coordinate

            let angle = Math.atan2(mouseY - centerY, mouseX - centerX) - Math.PI / 2;
            this.angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angle)); // Limit angle to 180 degrees
        });

        this.canvas.addEventListener('mousedown', () => {
            this.fireBall();
        });

        this.canvas.addEventListener('touchmove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const touch = event.touches[0];
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            const centerX = this.canvas.width / 2;
            const centerY = 50; // Cannon's fixed y-coordinate

            let angle = Math.atan2(touchY - centerY, touchX - centerX);
            this.angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angle)); // Limit angle to 180 degrees
        });

        this.canvas.addEventListener('touchend', () => {
            this.fireBall();
        });
    }
}