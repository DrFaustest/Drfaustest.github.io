class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set up responsive canvas
        this.setupCanvas();
        
        this.width = canvas.width;
        this.height = canvas.height;

        // Game state
        this.score = 0;
        this.level = 1;
        this.ballsRemaining = 10;
        this.gameOver = false;
        this.levelComplete = false;

        // Cannon
        this.cannon = {
            x: this.width / 2,
            y: 40,
            length: 50,
            angle: Math.PI / 2,
            minAngle: 0.05,
            maxAngle: Math.PI - 0.05
        };

        // Ball
        this.ball = null;
        this.ballRadius = 8;
        this.gravity = 0.25;

        // Pins
        this.pins = [];
        this.initializePins();

        // Bucket
        this.bucket = {
            x: this.width / 2 - 50,
            y: this.height - 30,
            width: 100,
            height: 20,
            vx: 2.2
        };

        // Input
        this.keys = {};
        this.setupInput();
        this.setupButtons();
        this.setupSwipe();
        this.setupLanguage();
        this.setupDarkMode();

        // Update UI callback
        this.onStateChange = null;
    }

    setupCanvas() {
        const isMobile = window.innerWidth <= 600;
        
        if (isMobile) {
            const headerHeight = 80;
            const controlsHeight = 160;
            const availableHeight = window.innerHeight - headerHeight - controlsHeight;
            
            this.canvas.width = window.innerWidth;
            this.canvas.height = Math.max(400, availableHeight);
        } else {
            this.canvas.width = 800;
            this.canvas.height = 600;
        }

        window.addEventListener('resize', () => {
            const wasMobile = this.canvas.width !== 800 || this.canvas.height !== 600;
            const nowMobile = window.innerWidth <= 600;
            
            if (wasMobile !== nowMobile) {
                location.reload();
            }
        });
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') {
                e.preventDefault();
                this.fire();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });
    }

    setupButtons() {
        const leftBtn = document.getElementById('btnLeft');
        const rightBtn = document.getElementById('btnRight');
        const fireBtn = document.getElementById('btnFire');

        const bindHold = (btn, key) => {
            if (!btn) return;
            const down = (e) => {
                e.preventDefault();
                this.keys[key] = true;
            };
            const up = (e) => {
                e.preventDefault();
                this.keys[key] = false;
            };
            btn.addEventListener('pointerdown', down);
            btn.addEventListener('pointerup', up);
            btn.addEventListener('pointerleave', up);
            btn.addEventListener('pointercancel', up);
        };

        bindHold(leftBtn, 'arrowleft');
        bindHold(rightBtn, 'arrowright');

        if (fireBtn) {
            const tapFire = (e) => {
                e.preventDefault();
                this.fire();
            };
            fireBtn.addEventListener('click', tapFire);
            fireBtn.addEventListener('pointerdown', tapFire);
        }
    }

    setupSwipe() {
        const target = this.canvas;
        let lastX = null;

        const clampAngle = () => {
            this.cannon.angle = Math.min(this.cannon.maxAngle, Math.max(this.cannon.minAngle, this.cannon.angle));
        };

        target.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                lastX = e.touches[0].clientX;
            }
        }, { passive: false });

        target.addEventListener('touchmove', (e) => {
            if (lastX === null || e.touches.length !== 1) return;
            const x = e.touches[0].clientX;
            const dx = x - lastX;
            lastX = x;
            const sensitivity = 0.0045;
            this.cannon.angle -= dx * sensitivity;
            clampAngle();
            e.preventDefault();
        }, { passive: false });

        const endSwipe = () => { lastX = null; };
        target.addEventListener('touchend', endSwipe);
        target.addEventListener('touchcancel', endSwipe);
    }

    setupDarkMode() {
        const savedMode = localStorage.getItem('pegish_darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedMode === 'true' || (savedMode === null && prefersDark);

        if (isDark) {
            document.body.classList.add('dark-mode');
            document.getElementById('darkModeToggle').textContent = '☀️';
        }

        document.getElementById('darkModeToggle').addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDarkNow = document.body.classList.contains('dark-mode');
            localStorage.setItem('pegish_darkMode', isDarkNow);
            document.getElementById('darkModeToggle').textContent = isDarkNow ? '☀️' : '🌙';
        });
    }

    setupLanguage() {
        this.translations = {
            en: {
                score: 'Score:',
                level: 'Level:',
                balls: 'Balls:',
                controls1: 'Use ← → Arrow Keys or A/D to rotate cannon',
                controls2: 'SPACE to fire',
                reset: 'Reset Game',
                fire: 'Fire',
                gameOver: 'Game Over! Final Score: {score} | Level: {level}',
                levelComplete: 'Level Complete! ✓',
                dedication: 'For my wife'
            },
            zh: {
                score: '得分:',
                level: '关卡:',
                balls: '球数:',
                controls1: '使用 ← → 方向键或 A/D 旋转炮台',
                controls2: '空格键发射',
                reset: '重新开始',
                fire: '发射',
                gameOver: '游戏结束！最终得分: {score} | 关卡: {level}',
                levelComplete: '关卡完成！✓',
                dedication: '献给我的妻子'
            }
        };

        const storedLang = localStorage.getItem('pegish_lang');
        const browserLang = navigator.language || navigator.userLanguage;
        this.currentLang = storedLang || (browserLang.startsWith('zh') ? 'zh' : 'en');

        this.applyLanguage();

        document.getElementById('langToggle').addEventListener('click', () => {
            this.currentLang = this.currentLang === 'en' ? 'zh' : 'en';
            localStorage.setItem('pegish_lang', this.currentLang);
            this.applyLanguage();
            this.updateUI();
        });
    }

    applyLanguage() {
        const t = this.translations[this.currentLang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                el.textContent = t[key];
            }
        });
    }

    t(key, vars = {}) {
        let text = this.translations[this.currentLang][key] || key;
        Object.keys(vars).forEach(k => {
            text = text.replace(`{${k}}`, vars[k]);
        });
        return text;
    }

    initializePins() {
        this.pins = [];
        const pinRadius = 6;
        const totalPins = Math.max(1, this.level);

        const marginX = 30;
        const marginTop = 90;
        const marginBottom = this.height - 180;

        const buffer = 10;
        const minDist = pinRadius * 2 + buffer;
        const minDistSq = minDist * minDist;

        const maxAttempts = totalPins * 80;
        let attempts = 0;

        while (this.pins.length < totalPins && attempts < maxAttempts) {
            attempts++;

            const x = marginX + Math.random() * (this.width - marginX * 2);
            const y = marginTop + Math.random() * (marginBottom - marginTop);

            let ok = true;
            for (const p of this.pins) {
                const dx = x - p.x;
                const dy = y - p.y;
                if (dx * dx + dy * dy < minDistSq) {
                    ok = false;
                    break;
                }
            }

            if (ok) {
                this.pins.push({ x, y, radius: pinRadius, active: true });
            }
        }

        let relaxBuffer = buffer * 0.6;
        while (this.pins.length < totalPins) {
            const x = marginX + Math.random() * (this.width - marginX * 2);
            const y = marginTop + Math.random() * (marginBottom - marginTop);
            const minSq = Math.pow(pinRadius * 2 + relaxBuffer, 2);
            let ok = true;
            for (const p of this.pins) {
                const dx = x - p.x;
                const dy = y - p.y;
                if (dx * dx + dy * dy < minSq) { ok = false; break; }
            }
            if (ok) this.pins.push({ x, y, radius: pinRadius, active: true });
            relaxBuffer *= 0.95;
        }
    }

    fire() {
        if (this.ball || this.ballsRemaining === 0 || this.gameOver) return;

        this.ballsRemaining--;
        const baseSpeed = 9.5;
        const angleFactor = 1 + 0.35 * Math.abs(Math.cos(this.cannon.angle));
        const speed = baseSpeed * angleFactor;
        this.ball = {
            x: this.cannon.x + Math.cos(this.cannon.angle) * this.cannon.length,
            y: this.cannon.y + Math.sin(this.cannon.angle) * this.cannon.length,
            vx: Math.cos(this.cannon.angle) * speed,
            vy: Math.sin(this.cannon.angle) * speed,
            radius: this.ballRadius
        };

        this.updateUI();
    }

    update() {
        if (this.gameOver || this.levelComplete) return;

        const leftEdge = 0;
        const rightEdge = this.width - this.bucket.width;
        this.bucket.x += this.bucket.vx;
        if (this.bucket.x <= leftEdge || this.bucket.x >= rightEdge) {
            this.bucket.x = Math.min(Math.max(this.bucket.x, leftEdge), rightEdge);
            this.bucket.vx *= -1;
        }

        if (!this.ball) return;

        this.ball.vy += this.gravity;
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        if (this.ball.x - this.ball.radius < 0) {
            this.ball.x = this.ball.radius;
            this.ball.vx *= -0.8;
        }
        if (this.ball.x + this.ball.radius > this.width) {
            this.ball.x = this.width - this.ball.radius;
            this.ball.vx *= -0.8;
        }

        if (this.ball.y - this.ball.radius < 0) {
            this.ball.y = this.ball.radius;
            this.ball.vy *= -0.6;
        }

        this.pins.forEach((pin) => {
            if (!pin.active) return;

            const dx = this.ball.x - pin.x;
            const dy = this.ball.y - pin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = this.ball.radius + pin.radius;

            if (distance < minDistance) {
                pin.active = false;
                this.score += 100;

                const angle = Math.atan2(dy, dx);
                const speed = Math.sqrt(this.ball.vx ** 2 + this.ball.vy ** 2);
                this.ball.vx = Math.cos(angle) * speed * 0.8;
                this.ball.vy = Math.sin(angle) * speed * 0.8;

                const overlap = minDistance - distance;
                this.ball.x += Math.cos(angle) * overlap;
                this.ball.y += Math.sin(angle) * overlap;

                this.updateUI();

                if (this.pins.every((p) => !p.active)) {
                    this.levelComplete = true;
                    this.level++;
                    setTimeout(() => {
                        this.nextLevel();
                    }, 1500);
                }
            }
        });

        if (
            this.ball.y + this.ball.radius >= this.bucket.y &&
            this.ball.x >= this.bucket.x &&
            this.ball.x <= this.bucket.x + this.bucket.width
        ) {
            this.ball = null;
            this.ballsRemaining++;
            this.updateUI();
            return;
        }

        if (!this.ball) return;

        if (this.ball.y > this.height + 50) {
            this.ball = null;

            if (this.ballsRemaining === 0) {
                this.gameOver = true;
                this.updateUI();
            }
        }
    }

    nextLevel() {
        this.initializePins();
        this.levelComplete = false;
        this.ballsRemaining = 10;
        this.ball = null;
        this.updateUI();
    }

    getTrajectoryPoints() {
        if (this.ball || this.gameOver || this.levelComplete) return [];

        const r = this.ballRadius;
        const startX = this.cannon.x + Math.cos(this.cannon.angle) * this.cannon.length;
        const startY = this.cannon.y + Math.sin(this.cannon.angle) * this.cannon.length;

        const baseSpeed = 9.5;
        const angleFactor = 1 + 0.35 * Math.abs(Math.cos(this.cannon.angle));
        const speed = baseSpeed * angleFactor;

        let x = startX;
        let y = startY;
        let vx = Math.cos(this.cannon.angle) * speed;
        let vy = Math.sin(this.cannon.angle) * speed;

        const points = [{ x, y }];
        const maxSteps = 240;
        const floorY = this.height - 2;

        for (let i = 0; i < maxSteps; i++) {
            vy += this.gravity;
            x += vx;
            y += vy;

            points.push({ x, y });

            if (x - r <= 0 || x + r >= this.width || y + r >= floorY) {
                break;
            }
        }

        return points;
    }

    reset() {
        this.score = 0;
        this.level = 1;
        this.ballsRemaining = 10;
        this.gameOver = false;
        this.levelComplete = false;
        this.ball = null;
        this.cannon.angle = Math.PI / 2;
        this.initializePins();
        this.updateUI();
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('balls').textContent = this.ballsRemaining;

        const infoEl = document.getElementById('gameInfo');
        infoEl.className = 'info';
        if (this.gameOver) {
            infoEl.textContent = this.t('gameOver', { score: this.score, level: this.level });
            infoEl.classList.add('game-over');
        } else if (this.levelComplete) {
            infoEl.textContent = this.t('levelComplete');
            infoEl.classList.add('level-complete');
        } else {
            infoEl.textContent = '';
        }

        if (this.onStateChange) this.onStateChange();
    }

    handleInput() {
        const rotationSpeed = 0.05;

        if (this.keys['arrowleft'] || this.keys['a']) {
            this.cannon.angle = Math.min(this.cannon.angle + rotationSpeed, this.cannon.maxAngle);
        }
        if (this.keys['arrowright'] || this.keys['d']) {
            this.cannon.angle = Math.max(this.cannon.angle - rotationSpeed, this.cannon.minAngle);
        }
    }

    draw() {
        const isDark = document.body.classList.contains('dark-mode');
        
        // Clear canvas completely
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        if (isDark) {
            gradient.addColorStop(0, '#1e3a5f');
            gradient.addColorStop(1, '#2d5a7b');
        } else {
            gradient.addColorStop(0, '#87ceeb');
            gradient.addColorStop(1, '#e0f6ff');
        }
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.drawCannon();

        this.pins.forEach((pin) => {
            if (pin.active) {
                this.ctx.fillStyle = isDark ? '#ff6b6b' : '#e74c3c';
                this.ctx.beginPath();
                this.ctx.arc(pin.x, pin.y, pin.radius, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.beginPath();
                this.ctx.arc(pin.x - 2, pin.y - 2, pin.radius * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        if (this.ball) {
            this.ctx.fillStyle = '#f39c12';
            this.ctx.beginPath();
            this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(
                this.ball.x - this.ball.radius / 2,
                this.ball.y - this.ball.radius / 2,
                this.ball.radius * 0.4,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }

        this.drawBucket();
        this.drawGuides();
    }

    drawCannon() {
        const x = this.cannon.x;
        const y = this.cannon.y;
        const angle = this.cannon.angle;
        const length = this.cannon.length;
        const isDark = document.body.classList.contains('dark-mode');

        this.ctx.fillStyle = isDark ? '#cbd5e1' : '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 15, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = isDark ? '#cbd5e1' : '#2c3e50';
        this.ctx.lineWidth = 12;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        this.ctx.stroke();

        this.ctx.fillStyle = isDark ? '#94a3b8' : '#34495e';
        this.ctx.beginPath();
        this.ctx.arc(
            x + Math.cos(angle) * (length - 6),
            y + Math.sin(angle) * (length - 6),
            8,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    drawBucket() {
        const x = this.bucket.x;
        const y = this.bucket.y;
        const width = this.bucket.width;
        const height = this.bucket.height;
        const isDark = document.body.classList.contains('dark-mode');

        this.ctx.fillStyle = isDark ? '#51cf66' : '#27ae60';
        this.ctx.fillRect(x, y, width, height);

        this.ctx.strokeStyle = isDark ? '#40c057' : '#229954';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x + 5, y + 2, width - 10, height - 4);
    }

    drawGuides() {
        const isDark = document.body.classList.contains('dark-mode');
        
        const points = this.getTrajectoryPoints();
        if (points.length > 1) {
            this.ctx.save();
            this.ctx.strokeStyle = isDark ? 'rgba(203, 213, 225, 0.5)' : 'rgba(44, 62, 80, 0.45)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([8, 6]);
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(points[i].x, points[i].y);
            }
            this.ctx.stroke();
            this.ctx.restore();
        }

        this.ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
}

const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);

function gameLoop() {
    game.handleInput();
    game.update();
    game.draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
