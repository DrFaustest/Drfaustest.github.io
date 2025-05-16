import { Game } from './game.js';
import { Cannon } from './cannon.js';
import { Ball } from './ball.js';
import { Peg } from './peg.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const canvas = document.getElementById('gameCanvas');
    const openingScreen = document.getElementById('openingScreen');
    const gameInterface = document.getElementById('gameInterface');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const levelCompleteScreen = document.getElementById('levelCompleteScreen');
    const scoreElement = document.getElementById('score');
    const levelNumElement = document.getElementById('levelNum');
    const ballCountElement = document.getElementById('ballCount');
    const finalScoreElement = document.getElementById('finalScore');
    const levelScoreElement = document.getElementById('levelScore');
    const levelBonusElement = document.getElementById('levelBonus');
    
    // Clear any existing event listeners to avoid duplicates
    document.removeEventListener('ballScore', updateScoreFromBall);
      // Verify initial canvas dimensions
    
    // Ensure canvas has correct initial size
    if (canvas.width !== parseInt(canvas.getAttribute('width')) || 
        canvas.height !== parseInt(canvas.getAttribute('height'))) {        // Fix canvas size mismatch
        canvas.width = parseInt(canvas.getAttribute('width')) || 800;
        canvas.height = parseInt(canvas.getAttribute('height')) || 540;
    }
      // Game variables
    const game = new Game(canvas);
    const cannon = new Cannon(canvas);
    const activeBalls = [];
    let pegs = [];
    
    // Try to restore game state from localStorage if available
    let score = 0;
    let totalScore = 0;
    let gameLevel = 1;
    let ballsLeft = 5;
    
    // Try to restore session from localStorage
    try {
        const savedScore = localStorage.getItem('pegishCurrentScore');
        const savedTotalScore = localStorage.getItem('pegishTotalScore');
        const savedLevel = localStorage.getItem('pegishLevel');
        
        if (savedScore && savedTotalScore && savedLevel) {
            score = parseInt(savedScore) || 0;
            totalScore = parseInt(savedTotalScore) || 0;
            gameLevel = parseInt(savedLevel) || 1;
            
            // Add extra balls for restored levels
            ballsLeft = 5 + Math.floor(gameLevel / 2);
            
            console.log(`Restored game state: Level ${gameLevel}, Score ${score}, Total ${totalScore}`);
        }
    } catch (e) {
        // Ignore localStorage errors
    }
    
    let isGameOver = false;
    
    // Initialize game
    game.start();
    updateUI();    // Event listeners
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', restartGame);
    document.getElementById('nextLevelButton').addEventListener('click', nextLevel);
    
    // Mobile-friendly event handling
    setupTouchEvents();    function startGame() {
        // Clear any existing game state
        activeBalls.length = 0;
        pegs.length = 0;
        particles.length = 0;
        
        openingScreen.style.display = 'none';
        gameInterface.classList.remove('hidden');
        
        // Reset game state immediately
        score = 0;
        totalScore = 0;
        gameLevel = 1;
        ballsLeft = 5;
        isGameOver = false;
        
        // Clear any localStorage backup
        try {
            localStorage.removeItem('pegishCurrentScore');
            localStorage.removeItem('pegishTotalScore');
            localStorage.removeItem('pegishLevel');
        } catch (e) {
            // Silently ignore
        }
        
        // Force UI update
        updateUI();
          // Use a more robust initialization sequence with multiple checks
        setTimeout(() => {
            // First resize pass
            resizeCanvas();
            
            // Second resize pass after a delay to catch any DOM updates
            setTimeout(() => {
                resizeCanvas();
                
                // Final setup after canvas is properly sized
                setTimeout(() => {
                    // Verify canvas dimensions are valid
                    if (canvas.width < 100 || canvas.height < 100) {
                        canvas.width = 800;
                        canvas.height = 540;
                    }
                    
                    // Explicitly update cannon position once more
                    cannon.centerX = canvas.width / 2;
                    cannon.centerY = canvas.height - 50;
                      // Verify cannon position
                    if (cannon.centerY < canvas.height / 2) {
                        // Ensure cannon is at the bottom of the screen
                        cannon.centerY = canvas.height - 50;
                    }
                    
                    // Prepare game area with final dimensions
                    const playArea = {
                        x: 0,
                        y: 0,
                        width: canvas.width,
                        height: canvas.height
                    };
                    
                    // Generate pegs with the correct dimensions
                    pegs = Peg.generateLevel(canvas, 20, playArea);
                    
                    // Start the game loop
                    gameLoop();
                }, 50);
            }, 50);
            
            // Setup resize handler for future resizes
            window.addEventListener('resize', resizeCanvas);
        }, 10);
    }
      function updateUI() {
        // Ensure DOM elements exist before updating them
        if (scoreElement) {
            scoreElement.textContent = score;
            console.log(`UI updated: Score = ${score}`);
        }
        
        if (levelNumElement) {
            levelNumElement.textContent = gameLevel;
        }
        
        if (ballCountElement) {
            ballCountElement.textContent = ballsLeft;
        }
        
        // Keep track of score in localStorage as a backup
        try {
            localStorage.setItem('pegishCurrentScore', score);
            localStorage.setItem('pegishTotalScore', totalScore);
            localStorage.setItem('pegishLevel', gameLevel);
        } catch (e) {
            // Silently ignore localStorage errors
        }
    }
      // Handle ball firing
    cannon.onFire = (ball) => {
        if (ballsLeft > 0 && !isGameOver) {
            activeBalls.push(ball);
            ballsLeft--;
            updateUI();
            
            // Add firing sound effect
            playSound('fire');
        }
    };
      // Listen for score updates from balls (remove any existing listeners first)
    document.removeEventListener('ballScore', updateScoreFromBall);
    document.addEventListener('ballScore', updateScoreFromBall);
    
    // Define the score update function separately so we can remove it if needed    function updateScoreFromBall(event) {
        const pointsEarned = event.detail.score;
        const bonus = Math.floor(event.detail.bonus);
        const totalPoints = pointsEarned + bonus;
        
        // Update the game score variable with proper error checking
        if (typeof totalPoints === 'number' && !isNaN(totalPoints)) {
            score += totalPoints;
            
            // Log score update for debugging
            console.log(`Score updated: +${totalPoints}, new score: ${score}`);
            
            // Update UI to reflect the new score
            updateUI();
            
            // Save score to localStorage in case of browser crash
            try {
                localStorage.setItem('pegishCurrentScore', score);
                localStorage.setItem('pegishTotalScore', totalScore);
            } catch (e) {
                // Silently fail
            }
        } else {
            console.error("Invalid score update:", event.detail);
        }
    }function checkForWin() {
        const orangePegsLeft = pegs.some(peg => peg.type === 'orange');
        
        if (!orangePegsLeft) {
            // Level complete
            const levelBonus = gameLevel * 500;
            const levelScore = score;
            
            console.log(`Level complete! Score before bonus: ${score}`);
            
            // Add the bonus to the current score
            score += levelBonus;
            
            console.log(`Score after bonus: ${score}`);
            
            // Display the updated score immediately
            updateUI();
            
            // Wait a moment to let any score popups finish
            setTimeout(() => {
                // Show level complete screen and update info
                levelScoreElement.textContent = levelScore;
                levelBonusElement.textContent = levelBonus;
                gameInterface.classList.add('hidden');
                levelCompleteScreen.classList.remove('hidden');
                
                // Make sure the finalScoreElement shows the correct score
                finalScoreElement.textContent = totalScore + score;
                
                // Play victory sound
                playSound('levelComplete');
            }, 1500);
            
            return true;
        }
        
        return false;
    }
      function checkForGameOver() {
        if (ballsLeft <= 0 && activeBalls.length === 0) {
            isGameOver = true;
            
            // Calculate and display final score
            const finalScore = totalScore + score;
            finalScoreElement.textContent = finalScore;
            
            // If no balls left and orange pegs remain
            if (pegs.some(peg => peg.type === 'orange')) {
                // Show game over screen after a delay
                setTimeout(() => {
                    gameInterface.classList.add('hidden');
                    gameOverScreen.classList.remove('hidden');
                    
                    // Play game over sound
                    playSound('gameOver');
                    
                    // Save the high score if possible
                    try {
                        const highScore = localStorage.getItem('pegishHighScore') || 0;
                        if (finalScore > highScore) {
                            localStorage.setItem('pegishHighScore', finalScore);
                        }
                    } catch (e) {
                        // Local storage not available
                    }
                }, 1500);
                
                return true;
            }
        }
        
        return false;
    }    function nextLevel() {
        // Log the current scores before level change
        console.log(`Before level change - Level score: ${score}, Total score: ${totalScore}`);
        
        // Make sure we have the most up-to-date score before adding to total
        try {
            const localScore = parseInt(localStorage.getItem('pegishCurrentScore'));
            if (localScore && !isNaN(localScore) && localScore > score) {
                console.log(`Found higher score in localStorage: ${localScore} vs ${score}`);
                score = localScore;
            }
        } catch (e) {
            // Ignore localStorage errors
        }
        
        gameLevel++;
        
        // Add bonus balls for the next level
        ballsLeft = 5 + Math.floor(gameLevel / 2);
        
        // Increase peg count with level
        const newPegCount = Math.min(20 + (gameLevel * 5), 100);
        
        // Add the current level score to totalScore before resetting
        totalScore += score;
        
        // Log the updated scores after adding to total
        console.log(`After adding to total - Level score: ${score}, New total score: ${totalScore}`);
        
        // Save the total score before resetting level score
        try {
            localStorage.setItem('pegishTotalScore', totalScore);
            localStorage.setItem('pegishLevel', gameLevel);
        } catch (e) {
            // Ignore localStorage errors
        }
        
        // Reset level score but keep the total score
        score = 0;
        activeBalls.length = 0;
        
        // Hide level complete screen and show game interface
        levelCompleteScreen.classList.add('hidden');
        gameInterface.classList.remove('hidden');
        
        // Clear any existing pegs
        pegs.length = 0;
        
        // Generate new pegs for the level with proper bounds checking
        const playArea = {
            x: 0,
            y: 0,
            width: Math.max(canvas.width, 300),
            height: Math.max(canvas.height, 300)
        };
        
        console.log(`Generating level ${gameLevel} pegs in area ${playArea.width}x${playArea.height}`);
        
        // Generate the level pegs
        pegs = Peg.generateLevel(canvas, newPegCount, playArea, gameLevel);
          // Reset game loop state and prepare for next level
        lastFrameTime = 0;
        isGameOver = false;
        
        // Reset the cannon state
        cannon.ballOutOfPlay();
        
        // Update UI with new scores
        updateUI();
        
        // Start the game loop again with a slight delay to ensure everything is ready
        setTimeout(() => {
            if (!isGameOver && levelCompleteScreen.classList.contains('hidden')) {
                requestAnimationFrame(gameLoop);
                console.log("Restarting game loop for next level");
            }
        }, 100);
    }
    
    function restartGame() {
        gameOverScreen.classList.add('hidden');
        startGame();
    }    // Make resizeCanvas globally available for emergency corrections from other modules
    window.resizeCanvas = resizeCanvas;
      function resizeCanvas() {
        // Access the stats element
        const statsElement = document.getElementById('gameStats');
        
        // Get the actual size of the game interface container
        const containerWidth = gameInterface.clientWidth;
        const containerHeight = gameInterface.clientHeight;
        
        // Calculate the stats height
        const statsHeight = statsElement ? statsElement.offsetHeight : 0;
        
        // Calculate available height
        const availableHeight = containerHeight - statsHeight;
        
        // Ensure we set valid dimensions (add safeguard)
        const newWidth = Math.max(containerWidth, 300);
        const newHeight = Math.max(availableHeight, 300);
        
        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;
          // Ensure the game responds to the new canvas size
        game.updatePlayArea(canvas.width, canvas.height);
        
        // Update cannon position to be at the bottom of the screen
        if (cannon) {
            // Update position
            cannon.centerX = canvas.width / 2;
            cannon.centerY = canvas.height - 50;
        }
    }
    
    // Touch handling variables
    let lastTap = 0;
    
    function setupTouchEvents() {
        // Prevent default touch behavior to avoid scrolling while playing
        canvas.addEventListener('touchmove', function(e) {
            if (gameInterface.style.display !== 'none') {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Prevent double tap zoom
        canvas.addEventListener('touchend', function(e) {
            const now = Date.now();
            const DOUBLE_TAP_DELAY = 300;
            
            if (now - lastTap < DOUBLE_TAP_DELAY) {
                e.preventDefault();
            }
            
            lastTap = now;
        });
    }
    
    // Visual effects
    function createParticles(x, y, color, count = 10) {
        const particles = [];
        
        for (let i = 0; i < count; i++) {
            particles.push({
                x,
                y,
                color,
                radius: Math.random() * 3 + 1,
                dx: (Math.random() - 0.5) * 5,
                dy: (Math.random() - 0.5) * 5,
                alpha: 1,
                life: Math.random() * 30 + 10
            });
        }
        
        return particles;
    }
    
    // Handle orientation changes for mobile devices
    window.addEventListener('orientationchange', handleOrientationChange);
    
    function handleOrientationChange() {
        // Give the browser time to complete the orientation change
        setTimeout(() => {
            resizeCanvas();
            
            // Show a message for optimal experience in portrait mode
            if (window.matchMedia("(max-width: 768px)").matches && 
                window.orientation !== undefined && 
                Math.abs(window.orientation) === 90) {
                
                showOrientationMessage();
            }
        }, 300);
    }
    
    function showOrientationMessage() {
        // Create message element if it doesn't exist
        let orientationMsg = document.getElementById('orientationMessage');
        
        if (!orientationMsg) {
            orientationMsg = document.createElement('div');
            orientationMsg.id = 'orientationMessage';
            orientationMsg.className = 'orientation-message';
            orientationMsg.innerHTML = `
                <div class="message-content">
                    <p>For the best experience, please use portrait orientation.</p>
                    <button id="dismissOrientation">OK</button>
                </div>
            `;
            document.body.appendChild(orientationMsg);
            
            // Add dismiss handler
            document.getElementById('dismissOrientation').addEventListener('click', () => {
                orientationMsg.classList.add('hidden');
            });
        } else {
            orientationMsg.classList.remove('hidden');
        }
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (orientationMsg) {
                orientationMsg.classList.add('hidden');
            }
        }, 5000);
    }
    
    // Audio system
    const sounds = {
        hit: null,
        fire: null,
        levelComplete: null,
        gameOver: null
    };
    
    function loadSounds() {
        // Create audio context on user interaction to comply with autoplay policies
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // We'll implement this later when we add sound files
    }
    
    function playSound(soundName) {
        // We'll implement this later when we add sound files
        // For now it's just a placeholder
    }
    
    // Active particles for visual effects
    let particles = [];
    
    // Game loop with frame limiting and performance optimization
    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;    function gameLoop(timestamp) {
        try {
            // Ensure we don't run the game loop when the game is over or between levels
            if (isGameOver) return;
            if (levelCompleteScreen.classList.contains('hidden') === false) return;
            if (gameOverScreen.classList.contains('hidden') === false) return;
            
            // Calculate time since last frame
            if (!timestamp) timestamp = performance.now();
            const elapsed = timestamp - lastFrameTime;
            
            // Limit framerate for performance and consistent physics
            if (elapsed > frameInterval) {
                // Update last frame time, adjusting for any extra time
                lastFrameTime = timestamp - (elapsed % frameInterval);
                
                // Update game state
                updateGameState();
                
                // Render frame
                renderFrame();
                
                // Performance monitoring
                game.updateFPS();
                
                // Update the UI each frame to ensure score is always current
                updateUI();
                
                // Save game state periodically (every ~5 seconds)
                if (Math.random() < 0.01) { // ~1% chance each frame at 60fps
                    try {
                        localStorage.setItem('pegishCurrentScore', score);
                        localStorage.setItem('pegishTotalScore', totalScore);
                        localStorage.setItem('pegishLevel', gameLevel);
                    } catch (e) {
                        // Silent fail on localStorage errors
                    }
                }
            }
            
            // Continue the game loop unless explicitly stopped
            requestAnimationFrame(gameLoop);
        } catch (error) {
            console.error("Error in game loop:", error);
            
            // Try to recover from errors by continuing the loop
            setTimeout(() => {
                requestAnimationFrame(gameLoop);
            }, 1000); // Wait a second before trying again
        }
    }
    
    function updateGameState() {
        // Process ball physics and collisions
        processBalls();
        
        // Update particles
        particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.life--;
            p.alpha = p.life / 40;
        });
        
        // Remove dead particles
        particles = particles.filter(p => p.life > 0);
        
        // Update pegs
        pegs.forEach(peg => peg.update());
    }
      function renderFrame() {
        // Clear canvas
        game.context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background elements
        drawBackground();
        
        // Triple check that the canvas dimensions are valid
        if (canvas.width < 100 || canvas.height < 100) {
            // Get dimensions from HTML attributes
            const htmlWidth = parseInt(canvas.getAttribute('width')) || 800;
            const htmlHeight = parseInt(canvas.getAttribute('height')) || 540;
            
            // Try to find the source of the problem by checking container
            const containerWidth = gameInterface.clientWidth;
            const containerHeight = gameInterface.clientHeight;
            
            // Fix dimensions regardless of source
            canvas.width = Math.max(htmlWidth, containerWidth, 800);
            canvas.height = Math.max(htmlHeight, containerHeight - 50, 540);
        }
          // Verify cannon is positioned at the bottom
        if (cannon.centerY < canvas.height / 2) {
            // Force correct position before drawing
            cannon.centerY = canvas.height - 50;
        }
        
        // Verify that the centerX is at the middle of the canvas
        if (Math.abs(cannon.centerX - canvas.width / 2) > 10) {
            cannon.centerX = canvas.width / 2;
        }
        
        // Draw the cannon
        cannon.draw(game.context);
          // Draw pegs
        pegs.forEach(peg => peg.draw(game.context, gameLevel));
        
        // Draw particles
        drawParticles();
        
        // Draw balls
        activeBalls.forEach(ball => ball.draw(game.context));
    }
    
    function processBalls() {
        // Use for loop instead of forEach for safer array modification during iteration
        for (let i = activeBalls.length - 1; i >= 0; i--) {
            const ball = activeBalls[i];
            
            // Update ball physics
            ball.update(canvas, pegs, gameLevel);
            
            // Check if ball is out of play
            if (ball.isOutOfPlay) {
                // Create particles for ball exit
                particles.push(...createParticles(ball.x, ball.y, 'white', 15));
                
                // Remove the ball
                activeBalls.splice(i, 1);
                cannon.ballOutOfPlay(); // Reset the fire button
                
                // Check for game state changes after ball is removed
                checkGameState();
            }
        }
    }
      function checkGameState() {
        // This function consolidates game state checks
        // to be called after important events like balls leaving play
        
        // First check if we've won (no orange pegs)
        if (!pegs.some(peg => peg.type === 'orange')) {
            // Only check when there are no active balls
            if (activeBalls.length === 0) {
                // Call checkForWin which will handle the win logic
                checkForWin();
                return;
            }
        }
        
        // Then check for loss condition
        if (activeBalls.length === 0) {
            // No balls in play, check win/lose conditions
            if (ballsLeft <= 0) {
                // Check if player can continue
                if (pegs.some(peg => peg.type === 'orange')) {
                    // Player has lost - no more balls and orange pegs remain
                    isGameOver = true;
                      // Show game over screen after a delay
                    setTimeout(() => {
                        // Make sure we show the final score correctly
                        const finalScore = totalScore + score;
                        console.log(`Game over: Level score=${score}, Total so far=${totalScore}, Final score=${finalScore}`);
                        
                        // Update the DOM element
                        if (finalScoreElement) {
                            finalScoreElement.textContent = finalScore;
                        }
                        
                        gameInterface.classList.add('hidden');
                        gameOverScreen.classList.remove('hidden');
                    }, 1000);
                }
            }
        }
    }
    
    function drawParticles() {
        // Draw all active particles
        particles.forEach(p => {
            game.context.globalAlpha = p.alpha;
            game.context.beginPath();
            game.context.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            game.context.fillStyle = p.color;
            game.context.fill();
        });
        
        // Reset alpha
        game.context.globalAlpha = 1;
    }
    
    function drawBackground() {
        // Create subtle grid pattern
        game.context.save();
        game.context.globalAlpha = 0.1;
        
        const gridSize = 40;
        game.context.strokeStyle = '#6200ea';
        game.context.lineWidth = 0.5;
        
        // Draw vertical lines
        for (let x = 0; x < canvas.width; x += gridSize) {
            game.context.beginPath();
            game.context.moveTo(x, 0);
            game.context.lineTo(x, canvas.height);
            game.context.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y < canvas.height; y += gridSize) {
            game.context.beginPath();
            game.context.moveTo(0, y);
            game.context.lineTo(canvas.width, y);
            game.context.stroke();
        }
        
        game.context.globalAlpha = 1.0;
        game.context.restore();
    }
    
    // Initialize once everything is loaded
    loadSounds();
});