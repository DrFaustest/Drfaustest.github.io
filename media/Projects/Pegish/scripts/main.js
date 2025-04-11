import { Game } from './game.js';
import { Cannon } from './cannon.js';
import { Ball } from './ball.js';
import { Peg } from './peg.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    game.start();
    
    // Ensure the event listener is attached after the DOM is fully loaded
    document.getElementById('startButton').addEventListener('click', () => {
        document.getElementById('openingScreen').style.display = 'none';
        document.getElementById('gameCanvas').style.display = 'block';

        const playArea = {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height
        };

        // Generate pegs only after the game starts
        const pegs = Peg.generateLevel(canvas, 20, playArea);

        // Start the game loop
        gameLoop(pegs);
    });

    const cannon = new Cannon(canvas);
    const activeBalls = [];
    let score = 0;
    let totalScore = 0;
    let gameLevel = 1; // Initialize game level

    cannon.onFire = (ball) => {
        activeBalls.push(ball);
    };

    function checkForWin(pegs) {
        const orangePinsLeft = pegs.some(peg => peg.type === 'orange');
        if (!orangePinsLeft) {
            alert('You win!');
            gameLevel += 1; // Increment the level
            document.getElementById('gameLevel').textContent = `Level: ${gameLevel}`; // Display the game level

            // Multiply the number of pins by the current level
            const newPegCount = 20 * gameLevel;
            const playArea = {
                x: 0,
                y: 0,
                width: canvas.width,
                height: canvas.height
            };

            // Reset the game with the new pin count
            pegs.splice(0, pegs.length, ...Peg.generateLevel(canvas, newPegCount, playArea));
            activeBalls.length = 0; // Clear active balls
            score = 0; // Reset score
            totalScore = totalScore;
            document.getElementById('score').textContent = score; // Update score display
        }
    }

    // Draw a 10px square in the center of the play area
    function drawCenterSquare(context, playArea) {
        const squareSize = 10;
        const centerX = playArea.width / 2;
        const centerY = playArea.height / 2;

        context.fillStyle = 'red';
        context.fillRect(centerX - squareSize / 2, centerY - squareSize / 2, squareSize, squareSize);
    }

    // Game loop placeholder
    function gameLoop(pegs) {
        // Clear canvas
        game.context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw and update cannon
        cannon.draw(game.context);

        // Draw and update pegs
        pegs.forEach(peg => peg.draw(game.context));

        // Consolidate collision detection and scoring logic
        activeBalls.forEach((ball, ballIndex) => {
            ball.update(canvas, pegs); // Pass pegs to the ball's update method
            ball.draw(game.context);

            if (ball.isOutOfPlay) {
                activeBalls.splice(ballIndex, 1);
                cannon.ballOutOfPlay(); // Reset the fire button

                // Check for win condition after each ball
                checkForWin(pegs);
            }
        });

        // Draw center square
        drawCenterSquare(game.context, canvas);

        requestAnimationFrame(() => gameLoop(pegs));
    }
});