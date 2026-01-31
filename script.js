// ===== GAME ENGINE =====
class QuantumSnakeEngine {
    constructor() {
        this.config = {
            gridSize: 30,
            cellSize: 26,
            initialSpeed: 150,
            minSpeed: 60,
            speedStep: 10,
            foodPoints: 100,
            powerUpChance: 0.15,
            comboDecayTime: 2000,
            maxCombo: 10
        };
        
        this.state = {
            snake: [],
            food: [],
            direction: { x: 1, y: 0 },
            nextDirection: { x: 1, y: 0 },
            score: 0,
            highScore: localStorage.getItem('quantumSnakeHighScore') || 0,
            speed: this.config.initialSpeed,
            gameLoop: null,
            isPaused: false,
            isGameOver: false,
            isRunning: false,
            foodConsumed: 0,
            level: 1,
            combo: 1,
            comboTimeout: null,
            lastComboTime: 0,
            timeElapsed: 0,
            startTime: null,
            powerUps: {
                shield: 0,
                speed: 0,
                time: 0,
                multiplier: 0
            },
            activeEffects: {
                shield: false,
                speedBoost: false,
                timeFreeze: false,
                scoreMultiplier: 1
            },
            gameMode: 'classic',
            difficulty: 'normal',
            efficiency: 100,
            movesCount: 0,
            nearMisses: 0,
            chainReactions: 0,
            precision: 100,
            movesPerMinute: 0,
            lastMoveTime: Date.now(),
            particleSystems: [],
            gridLines: true
        };
        
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.initializeCanvas();
        
        this.init();
    }
    
    initializeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.config.cellSize = Math.floor(rect.width / this.config.gridSize);
    }
    
    init() {
        this.resetGame();
        this.setupEventListeners();
        this.initParticles();
        this.initPerformanceMonitoring();
        this.showNotification('Quantum engine initialized', 'success');
    }
    
    resetGame() {
        const center = Math.floor(this.config.gridSize / 2);
        this.state.snake = [
            { x: center, y: center },
            { x: center - 1, y: center },
            { x: center - 2, y: center }
        ];
        
        this.state.direction = { x: 1, y: 0 };
        this.state.nextDirection = { x: 1, y: 0 };
        this.state.score = 0;
        this.state.speed = this.config.initialSpeed;
        this.state.isPaused = false;
        this.state.isGameOver = false;
        this.state.foodConsumed = 0;
        this.state.level = 1;
        this.state.combo = 1;
        this.state.timeElapsed = 0;
        this.state.startTime = Date.now();
        this.state.movesCount = 0;
        this.state.nearMisses = 0;
        this.state.chainReactions = 0;
        this.state.precision = 100;
        this.state.movesPerMinute = 0;
        
        this.clearFood();
        this.spawnFood();
        this.spawnFood('power');
        
        this.updateUI();
        this.draw();
        
        if (this.state.gameLoop) {
            clearInterval(this.state.gameLoop);
        }
    }
    
    startGame() {
        if (this.state.isRunning) return;
        
        this.state.isRunning = true;
        this.state.startTime = Date.now();
        this.state.gameLoop = setInterval(() => this.gameLoop(), this.state.speed);
        this.showNotification('Quantum sequence initiated', 'success');
        this.updateUI();
    }
    
    pauseGame() {
        this.state.isPaused = !this.state.isPaused;
        
        if (this.state.isPaused) {
            clearInterval(this.state.gameLoop);
            this.showNotification('Quantum field paused', 'warning');
        } else {
            this.state.gameLoop = setInterval(() => this.gameLoop(), this.state.speed);
            this.showNotification('Quantum field resumed', 'success');
        }
        
        this.updateUI();
    }
    
    gameLoop() {
        if (this.state.isPaused || this.state.isGameOver) return;
        
        this.update();
        this.updatePerformance();
        this.draw();
        this.updateUI();
        this.updateParticles();
    }
    
    update() {
        // Update direction
        this.state.direction = { ...this.state.nextDirection };
        this.state.movesCount++;
        
        // Calculate new head position
        const head = { ...this.state.snake[0] };
        head.x += this.state.direction.x;
        head.y += this.state.direction.y;
        
        // Check boundaries with wrap-around for certain modes
        if (this.state.gameMode === 'classic') {
            if (head.x < 0 || head.x >= this.config.gridSize || 
                head.y < 0 || head.y >= this.config.gridSize) {
                this.gameOver();
                return;
            }
        } else {
            // Wrap-around for other modes
            if (head.x < 0) head.x = this.config.gridSize - 1;
            if (head.x >= this.config.gridSize) head.x = 0;
            if (head.y < 0) head.y = this.config.gridSize - 1;
            if (head.y >= this.config.gridSize) head.y = 0;
        }
        
        // Check self collision (shield protects)
        if (!this.state.activeEffects.shield) {
            for (let segment of this.state.snake) {
                if (segment.x === head.x && segment.y === head.y) {
                    this.gameOver();
                    return;
                }
            }
        } else {
            // Shield effect - can pass through self
            this.state.activeEffects.shieldDuration--;
            if (this.state.activeEffects.shieldDuration <= 0) {
                this.state.activeEffects.shield = false;
            }
        }
        
        // Add new head
        this.state.snake.unshift(head);
        
        // Check food collision
        let foodEaten = false;
        let powerUpEaten = false;
        
        for (let i = this.state.food.length - 1; i >= 0; i--) {
            const food = this.state.food[i];
            if (head.x === food.x && head.y === food.y) {
                foodEaten = true;
                powerUpEaten = food.type === 'power';
                
                // Calculate points with multipliers
                let points = this.config.foodPoints;
                if (powerUpEaten) points *= 3;
                points *= this.state.activeEffects.scoreMultiplier;
                points *= this.state.combo;
                
                this.state.score += Math.floor(points);
                this.state.foodConsumed++;
                
                // Update combo
                this.updateCombo();
                
                // Handle power-ups
                if (powerUpEaten) {
                    this.collectPowerUp(food.powerType);
                    this.showNotification(`Power core collected: ${food.powerType.toUpperCase()}`, 'success');
                } else {
                    this.showNotification(`+${Math.floor(points)} Quantum Energy`, 'success');
                }
                
                // Remove eaten food
                this.state.food.splice(i, 1);
                
                // Spawn particle effect
                this.createParticleSystem(
                    head.x * this.config.cellSize + this.config.cellSize / 2,
                    head.y * this.config.cellSize + this.config.cellSize / 2,
                    powerUpEaten ? 'power' : 'food'
                );
                
                break;
            }
        }
        
        if (foodEaten) {
            // Spawn new food
            setTimeout(() => {
                this.spawnFood();
                if (Math.random() < this.config.powerUpChance) {
                    this.spawnFood('power');
                }
            }, 100);
        } else {
            // Remove tail if no food eaten
            this.state.snake.pop();
        }
        
        // Update level based on score
        const newLevel = Math.floor(this.state.score / 5000) + 1;
        if (newLevel > this.state.level) {
            this.state.level = newLevel;
            this.increaseDifficulty();
            this.showNotification(`Level up! Now at level ${this.state.level}`, 'warning');
        }
        
        // Update time
        this.state.timeElapsed = Date.now() - this.state.startTime;
        
        // Update efficiency
        this.updateEfficiency();
        
        // Update moves per minute
        this.updateMovesPerMinute();
    }
    
    updateCombo() {
        const now = Date.now();
        const timeSinceLastCombo = now - this.state.lastComboTime;
        
        if (timeSinceLastCombo < this.config.comboDecayTime) {
            this.state.combo = Math.min(this.state.combo + 0.5, this.config.maxCombo);
        } else {
            this.state.combo = 1;
        }
        
        this.state.lastComboTime = now;
        
        if (this.state.comboTimeout) {
            clearTimeout(this.state.comboTimeout);
        }
        
        this.state.comboTimeout = setTimeout(() => {
            this.state.combo = 1;
            this.updateUI();
        }, this.config.comboDecayTime);
    }
    
    collectPowerUp(type) {
        this.state.powerUps[type]++;
        
        // Auto-activate some power-ups
        if (type === 'shield' && this.state.powerUps.shield > 0) {
            this.activatePowerUp('shield');
        }
        
        this.updateUI();
    }
    
    activatePowerUp(type) {
        if (this.state.powerUps[type] <= 0) return;
        
        this.state.powerUps[type]--;
        
        switch(type) {
            case 'shield':
                this.state.activeEffects.shield = true;
                this.state.activeEffects.shieldDuration = 10;
                this.showNotification('Quantum shield activated', 'success');
                break;
            case 'speed':
                this.state.activeEffects.speedBoost = true;
                this.state.activeEffects.speedBoostDuration = 15;
                const originalSpeed = this.state.speed;
                this.state.speed = Math.max(this.config.minSpeed, this.state.speed - 30);
                setTimeout(() => {
                    this.state.speed = originalSpeed;
                    this.state.activeEffects.speedBoost = false;
                }, 15000);
                this.showNotification('Speed boost activated', 'success');
                break;
            case 'time':
                this.state.activeEffects.timeFreeze = true;
                setTimeout(() => {
                    this.state.activeEffects.timeFreeze = false;
                }, 5000);
                this.showNotification('Time dilation field activated', 'success');
                break;
            case 'multiplier':
                this.state.activeEffects.scoreMultiplier = 2;
                setTimeout(() => {
                    this.state.activeEffects.scoreMultiplier = 1;
                }, 10000);
                this.showNotification('Score multiplier activated', 'success');
                break;
        }
        
        this.updateUI();
    }
    
    increaseDifficulty() {
        if (this.state.speed > this.config.minSpeed) {
            this.state.speed = Math.max(
                this.config.minSpeed,
                this.state.speed - this.config.speedStep
            );
            
            clearInterval(this.state.gameLoop);
            this.state.gameLoop = setInterval(() => this.gameLoop(), this.state.speed);
        }
    }
    
    spawnFood(type = 'normal') {
        let food;
        let collision;
        
        do {
            collision = false;
            food = {
                x: Math.floor(Math.random() * this.config.gridSize),
                y: Math.floor(Math.random() * this.config.gridSize),
                type: type,
                spawnTime: Date.now()
            };
            
            if (type === 'power') {
                const powerTypes = ['shield', 'speed', 'time', 'multiplier'];
                food.powerType = powerTypes[Math.floor(Math.random() * powerTypes.length)];
            }
            
            // Check collision with snake
            for (let segment of this.state.snake) {
                if (segment.x === food.x && segment.y === food.y) {
                    collision = true;
                    break;
                }
            }
            
            // Check collision with other food
            for (let existingFood of this.state.food) {
                if (existingFood.x === food.x && existingFood.y === food.y) {
                    collision = true;
                    break;
                }
            }
        } while (collision);
        
        this.state.food.push(food);
    }
    
    clearFood() {
        this.state.food = [];
    }
    
    updateEfficiency() {
        const maxPossibleMoves = Math.floor(this.state.timeElapsed / this.state.speed);
        const efficiency = maxPossibleMoves > 0 
            ? (this.state.movesCount / maxPossibleMoves) * 100 
            : 100;
        
        this.state.efficiency = Math.min(100, Math.max(0, efficiency));
    }
    
    updateMovesPerMinute() {
        const now = Date.now();
        const minutes = (now - this.state.startTime) / 60000;
        this.state.movesPerMinute = minutes > 0 
            ? Math.floor(this.state.movesCount / minutes)
            : 0;
    }
    
    updatePerformance() {
        // This would be implemented with actual performance monitoring
        // For now, we'll simulate realistic values
        const fpsElement = document.getElementById('fps-counter');
        const latencyElement = document.getElementById('latency-counter');
        const renderElement = document.getElementById('render-counter');
        
        if (fpsElement) {
            const targetFPS = 60;
            const currentFPS = targetFPS - Math.floor(Math.random() * 5);
            fpsElement.textContent = currentFPS;
            fpsElement.style.color = currentFPS >= 55 ? 'var(--success-color)' : 
                                   currentFPS >= 45 ? 'var(--warning-color)' : 
                                   'var(--danger-color)';
        }
        
        if (latencyElement) {
            const latency = 5 + Math.floor(Math.random() * 10);
            latencyElement.textContent = `${latency}ms`;
            latencyElement.style.color = latency <= 10 ? 'var(--success-color)' : 
                                       latency <= 20 ? 'var(--warning-color)' : 
                                       'var(--danger-color)';
        }
        
        if (renderElement) {
            const renderTime = 10 + Math.floor(Math.random() * 15);
            renderElement.textContent = `${renderTime}ms`;
            renderElement.style.color = renderTime <= 16 ? 'var(--success-color)' : 
                                      renderTime <= 25 ? 'var(--warning-color)' : 
                                      'var(--danger-color)';
        }
    }
    
    gameOver() {
        this.state.isGameOver = true;
        this.state.isRunning = false;
        
        clearInterval(this.state.gameLoop);
        
        // Update high score
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('quantumSnakeHighScore', this.state.highScore);
            this.showNotification('New high score achieved!', 'success');
        }
        
        // Show game over screen
        setTimeout(() => {
            this.showGameOverScreen();
        }, 500);
        
        this.showNotification('Quantum anomaly detected', 'danger');
    }
    
    showGameOverScreen() {
        const gameOverScreen = document.getElementById('game-over-screen');
        const finalScore = document.getElementById('final-score');
        const finalTime = document.getElementById('final-time');
        const finalParticles = document.getElementById('final-particles');
        const finalEfficiency = document.getElementById('final-efficiency');
        const rankingBadge = document.getElementById('ranking-badge');
        
        if (finalScore) finalScore.textContent = this.state.score.toLocaleString();
        if (finalTime) finalTime.textContent = this.formatTime(this.state.timeElapsed);
        if (finalParticles) finalParticles.textContent = this.state.foodConsumed;
        if (finalEfficiency) finalEfficiency.textContent = `${Math.floor(this.state.efficiency)}%`;
        
        // Determine rank
        let rankTitle, rankColor;
        if (this.state.score >= 10000) {
            rankTitle = 'QUANTUM MASTER';
            rankColor = 'linear-gradient(45deg, #ff00ff, #00ffff)';
        } else if (this.state.score >= 5000) {
            rankTitle = 'ELITE OPERATIVE';
            rankColor = 'linear-gradient(45deg, #00ff9d, #00aaff)';
        } else if (this.state.score >= 2000) {
            rankTitle = 'ADVANCED AGENT';
            rankColor = 'linear-gradient(45deg, #ffaa00, #ff5500)';
        } else if (this.state.score >= 1000) {
            rankTitle = 'TRAINED OPERATIVE';
            rankColor = 'linear-gradient(45deg, #00aaff, #0088ff)';
        } else {
            rankTitle = 'QUANTUM NOVICE';
            rankColor = 'linear-gradient(45deg, #6666ff, #8888ff)';
        }
        
        if (rankingBadge) {
            rankingBadge.style.background = rankColor;
            rankingBadge.querySelector('.rank-title').textContent = rankTitle;
            rankingBadge.querySelector('.rank-score').textContent = `Score: ${this.state.score.toLocaleString()}`;
        }
        
        if (gameOverScreen) {
            gameOverScreen.style.display = 'flex';
            gsap.fromTo(gameOverScreen, 
                { opacity: 0, scale: 0.9 },
                { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
            );
        }
    }
    
    draw() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#050811');
        gradient.addColorStop(1, '#0a1429');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid if enabled
        if (this.state.gridLines) {
            this.drawGrid();
        }
        
        // Draw food
        this.drawFood();
        
        // Draw snake
        this.drawSnake();
        
        // Draw particles
        this.drawParticles();
        
        // Draw HUD
        this.drawHUD();
        
        // Draw effects
        if (this.state.activeEffects.timeFreeze) {
            this.drawTimeFreezeEffect();
        }
        
        if (this.state.activeEffects.shield) {
            this.drawShieldEffect();
        }
    }
    
    drawGrid() {
        const { gridSize, cellSize } = this.config;
        const { width, height } = this.canvas;
        
        this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
        this.ctx.lineWidth = 0.5;
        
        // Draw vertical lines
        for (let x = 0; x <= gridSize; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * cellSize, 0);
            this.ctx.lineTo(x * cellSize, height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= gridSize; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * cellSize);
            this.ctx.lineTo(width, y * cellSize);
            this.ctx.stroke();
        }
        
        // Draw center point
        this.ctx.fillStyle = 'rgba(0, 243, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.arc(width / 2, height / 2, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawSnake() {
        const { cellSize } = this.config;
        const snakeLength = this.state.snake.length;
        
        for (let i = 0; i < snakeLength; i++) {
            const segment = this.state.snake[i];
            const x = segment.x * cellSize;
            const y = segment.y * cellSize;
            
            // Calculate color based on position and effects
            let color;
            if (i === 0) {
                // Head - bright gradient
                const headGradient = this.ctx.createLinearGradient(
                    x, y, x + cellSize, y + cellSize
                );
                headGradient.addColorStop(0, '#00ff9d');
                headGradient.addColorStop(1, '#00aaff');
                color = headGradient;
            } else {
                // Body - gradient from head to tail
                const intensity = 1 - (i / snakeLength) * 0.7;
                const bodyGradient = this.ctx.createRadialGradient(
                    x + cellSize / 2, y + cellSize / 2, 0,
                    x + cellSize / 2, y + cellSize / 2, cellSize / 2
                );
                bodyGradient.addColorStop(0, `rgba(0, ${Math.floor(255 * intensity)}, ${Math.floor(200 * intensity)}, 1)`);
                bodyGradient.addColorStop(1, `rgba(0, ${Math.floor(150 * intensity)}, ${Math.floor(255 * intensity)}, 0.5)`);
                color = bodyGradient;
            }
            
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 4);
            this.ctx.fill();
            
            // Add inner glow for head
            if (i === 0) {
                this.ctx.shadowColor = '#00ff9d';
                this.ctx.shadowBlur = 15;
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                
                // Draw eyes
                this.ctx.fillStyle = '#001122';
                const eyeSize = cellSize / 6;
                
                // Determine eye positions based on direction
                let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
                
                if (this.state.direction.x === 1) { // Right
                    leftEyeX = x + cellSize - eyeSize * 2;
                    leftEyeY = y + eyeSize * 2;
                    rightEyeX = x + cellSize - eyeSize * 2;
                    rightEyeY = y + cellSize - eyeSize * 2;
                } else if (this.state.direction.x === -1) { // Left
                    leftEyeX = x + eyeSize * 2;
                    leftEyeY = y + eyeSize * 2;
                    rightEyeX = x + eyeSize * 2;
                    rightEyeY = y + cellSize - eyeSize * 2;
                } else if (this.state.direction.y === 1) { // Down
                    leftEyeX = x + eyeSize * 2;
                    leftEyeY = y + cellSize - eyeSize * 2;
                    rightEyeX = x + cellSize - eyeSize * 2;
                    rightEyeY = y + cellSize - eyeSize * 2;
                } else { // Up
                    leftEyeX = x + eyeSize * 2;
                    leftEyeY = y + eyeSize * 2;
                    rightEyeX = x + cellSize - eyeSize * 2;
                    rightEyeY = y + eyeSize * 2;
                }
                
                this.ctx.beginPath();
                this.ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
                this.ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    drawFood() {
        const { cellSize } = this.config;
        
        for (const food of this.state.food) {
            const x = food.x * cellSize;
            const y = food.y * cellSize;
            const centerX = x + cellSize / 2;
            const centerY = y + cellSize / 2;
            const radius = cellSize / 2 - 2;
            
            // Create pulsing effect
            const pulse = Math.sin(Date.now() / 300) * 0.2 + 0.8;
            
            if (food.type === 'power') {
                // Power-up - glowing orb
                const gradient = this.ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, radius
                );
                
                let color1, color2;
                switch(food.powerType) {
                    case 'shield': color1 = '#00aaff'; color2 = '#0088ff'; break;
                    case 'speed': color1 = '#ffaa00'; color2 = '#ff5500'; break;
                    case 'time': color1 = '#ffff00'; color2 = '#ffaa00'; break;
                    case 'multiplier': color1 = '#ff00ff'; color2 = '#aa00ff'; break;
                }
                
                gradient.addColorStop(0, color1);
                gradient.addColorStop(0.7, color2);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.globalAlpha = pulse;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius * pulse, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
                
                // Add rotation effect
                this.ctx.save();
                this.ctx.translate(centerX, centerY);
                this.ctx.rotate(Date.now() / 1000);
                this.ctx.strokeStyle = color1;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    this.ctx.rotate(Math.PI / 2);
                    this.ctx.moveTo(radius * 0.7, 0);
                    this.ctx.lineTo(radius * 0.9, 0);
                }
                this.ctx.stroke();
                this.ctx.restore();
            } else {
                // Normal food - glowing dot
                const gradient = this.ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, radius
                );
                gradient.addColorStop(0, '#ff3366');
                gradient.addColorStop(0.7, '#ff0066');
                gradient.addColorStop(1, 'rgba(255, 0, 102, 0)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.globalAlpha = pulse;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius * 0.8 * pulse, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
                
                // Add shine
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.beginPath();
                this.ctx.arc(
                    centerX - radius * 0.3,
                    centerY - radius * 0.3,
                    radius * 0.2,
                    0, Math.PI * 2
                );
                this.ctx.fill();
            }
        }
    }
    
    drawHUD() {
        const { width, height } = this.canvas;
        
        // Draw score in top-left
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 40);
        
        this.ctx.font = 'bold 16px "Rajdhani", sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE: ${this.state.score.toLocaleString()}`, 20, 35);
        
        // Draw combo multiplier
        if (this.state.combo > 1) {
            this.ctx.fillStyle = `rgba(255, 100, 0, ${0.5 + this.state.combo * 0.05})`;
            this.ctx.font = `bold ${20 + this.state.combo * 2}px "Orbitron", sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`x${this.state.combo.toFixed(1)}`, width / 2, 40);
        }
        
        // Draw level in top-right
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(width - 150, 10, 140, 40);
        
        this.ctx.font = 'bold 16px "Rajdhani", sans-serif';
        this.ctx.fillStyle = '#00ff9d';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`LEVEL ${this.state.level}`, width - 20, 35);
        
        // Draw pause indicator
        if (this.state.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, width, height);
            
            this.ctx.font = 'bold 40px "Orbitron", sans-serif';
            this.ctx.fillStyle = '#00ff9d';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('QUANTUM FIELD PAUSED', width / 2, height / 2 - 20);
            
            this.ctx.font = '20px "Exo 2", sans-serif';
            this.ctx.fillStyle = '#a0b3c9';
            this.ctx.fillText('Press SPACE to resume', width / 2, height / 2 + 30);
        }
    }
    
    drawShieldEffect() {
        const head = this.state.snake[0];
        const { cellSize } = this.config;
        const x = head.x * cellSize + cellSize / 2;
        const y = head.y * cellSize + cellSize / 2;
        const radius = cellSize * 0.8;
        
        this.ctx.strokeStyle = 'rgba(0, 170, 255, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Animated shield rings
        const time = Date.now() / 1000;
        this.ctx.strokeStyle = 'rgba(0, 170, 255, 0.3)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const ringRadius = radius * (1 + Math.sin(time * 2 + i) * 0.2);
            this.ctx.beginPath();
            this.ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    drawTimeFreezeEffect() {
        const { width, height } = this.canvas;
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw time dilation effect
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const offset = Date.now() / 1000 * 50;
            this.ctx.beginPath();
            for (let x = 0; x < width; x += 20) {
                const y = height / 2 + Math.sin(x / 50 + offset + i) * 30;
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }
    }
    
    createParticleSystem(x, y, type) {
        const system = {
            x, y,
            particles: [],
            lifetime: 1000,
            createdAt: Date.now()
        };
        
        const particleCount = type === 'power' ? 30 : 15;
        const colors = type === 'power' 
            ? ['#00aaff', '#0088ff', '#00ffff']
            : ['#ff3366', '#ff0066', '#ff6699'];
        
        for (let i = 0; i < particleCount; i++) {
            system.particles.push({
                x: 0, y: 0,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                decay: 0.02 + Math.random() * 0.03,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 2 + Math.random() * 4
            });
        }
        
        this.state.particleSystems.push(system);
    }
    
    updateParticles() {
        const now = Date.now();
        
        for (let i = this.state.particleSystems.length - 1; i >= 0; i--) {
            const system = this.state.particleSystems[i];
            const age = now - system.createdAt;
            
            if (age > system.lifetime) {
                this.state.particleSystems.splice(i, 1);
                continue;
            }
            
            for (const particle of system.particles) {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life -= particle.decay;
                particle.vx *= 0.95;
                particle.vy *= 0.95;
            }
        }
    }
    
    drawParticles() {
        for (const system of this.state.particleSystems) {
            for (const particle of system.particles) {
                if (particle.life <= 0) continue;
                
                this.ctx.globalAlpha = particle.life;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(
                    system.x + particle.x,
                    system.y + particle.y,
                    particle.size * particle.life,
                    0, Math.PI * 2
                );
                this.ctx.fill();
            }
        }
        this.ctx.globalAlpha = 1;
    }
    
    initParticles() {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: ['#00f3ff', '#ff00ff', '#00ff9d'] },
                shape: { type: 'circle' },
                opacity: { value: 0.3, random: true },
                size: { value: 2, random: true },
                line_linked: { enable: true, distance: 150, color: '#00f3ff', opacity: 0.1, width: 1 },
                move: { enable: true, speed: 1, direction: 'none', random: true, out_mode: 'out' }
            },
            interactivity: {
                detect_on: 'canvas',
                events: { onhover: { enable: true, mode: 'repulse' } }
            }
        });
    }
    
    initPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const monitor = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                document.getElementById('fps-counter').textContent = fps;
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(monitor);
        };
        
        monitor();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if ([37, 38, 39, 40, 32].includes(e.keyCode)) {
                e.preventDefault();
            }
            
            switch(e.key) {
                case 'ArrowUp':
                    if (this.state.direction.y === 0) {
                        this.state.nextDirection = { x: 0, y: -1 };
                    }
                    break;
                case 'ArrowDown':
                    if (this.state.direction.y === 0) {
                        this.state.nextDirection = { x: 0, y: 1 };
                    }
                    break;
                case 'ArrowLeft':
                    if (this.state.direction.x === 0) {
                        this.state.nextDirection = { x: -1, y: 0 };
                    }
                    break;
                case 'ArrowRight':
                    if (this.state.direction.x === 0) {
                        this.state.nextDirection = { x: 1, y: 0 };
                    }
                    break;
                case ' ':
                    this.pauseGame();
                    break;
                case 'r':
                case 'R':
                    this.resetGame();
                    break;
                case 'm':
                case 'M':
                    this.activatePowerUp('multiplier');
                    break;
            }
        });
        
        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0 && this.state.direction.x === 0) {
                    this.state.nextDirection = { x: 1, y: 0 };
                } else if (dx < 0 && this.state.direction.x === 0) {
                    this.state.nextDirection = { x: -1, y: 0 };
                }
            } else {
                if (dy > 0 && this.state.direction.y === 0) {
                    this.state.nextDirection = { x: 0, y: 1 };
                } else if (dy < 0 && this.state.direction.y === 0) {
                    this.state.nextDirection = { x: 0, y: -1 };
                }
            }
        });
        
        // Button event listeners
        const startBtn = document.getElementById('start-game');
        const pauseBtn = document.getElementById('pause-btn');
        const restartBtn = document.getElementById('restart-btn');
        const usePowerupBtn = document.getElementById('use-powerup');
        const speedUpBtn = document.getElementById('speed-up');
        const speedDownBtn = document.getElementById('speed-down');
        
        if (startBtn) startBtn.addEventListener('click', () => this.startGame());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pauseGame());
        if (restartBtn) restartBtn.addEventListener('click', () => this.resetGame());
        if (usePowerupBtn) usePowerupBtn.addEventListener('click', () => {
            // Cycle through available power-ups
            const types = Object.keys(this.state.powerUps);
            for (const type of types) {
                if (this.state.powerUps[type] > 0) {
                    this.activatePowerUp(type);
                    break;
                }
            }
        });
        
        if (speedUpBtn) speedUpBtn.addEventListener('click', () => {
            if (this.state.speed > this.config.minSpeed) {
                this.state.speed = Math.max(
                    this.config.minSpeed,
                    this.state.speed - this.config.speedStep
                );
                
                if (this.state.isRunning && !this.state.isPaused) {
                    clearInterval(this.state.gameLoop);
                    this.state.gameLoop = setInterval(() => this.gameLoop(), this.state.speed);
                }
                
                this.updateUI();
                this.showNotification('Speed increased', 'warning');
            }
        });
        
        if (speedDownBtn) speedDownBtn.addEventListener('click', () => {
            if (this.state.speed < this.config.initialSpeed) {
                this.state.speed = Math.min(
                    this.config.initialSpeed,
                    this.state.speed + this.config.speedStep
                );
                
                if (this.state.isRunning && !this.state.isPaused) {
                    clearInterval(this.state.gameLoop);
                    this.state.gameLoop = setInterval(() => this.gameLoop(), this.state.speed);
                }
                
                this.updateUI();
                this.showNotification('Speed decreased', 'warning');
            }
        });
        
        // Settings
        const settingsBtn = document.getElementById('settings-btn');
        const closeSettings = document.getElementById('close-settings');
        const settingsModal = document.getElementById('settings-modal');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                settingsModal.style.display = 'flex';
                gsap.fromTo(settingsModal, 
                    { opacity: 0, scale: 0.9 },
                    { opacity: 1, scale: 1, duration: 0.3 }
                );
            });
        }
        
        if (closeSettings) {
            closeSettings.addEventListener('click', () => {
                gsap.to(settingsModal, {
                    opacity: 0, scale: 0.9, duration: 0.3,
                    onComplete: () => settingsModal.style.display = 'none'
                });
            });
        }
        
        // Game over screen buttons
        const restartGameBtn = document.getElementById('restart-game');
        const mainMenuBtn = document.getElementById('main-menu');
        
        if (restartGameBtn) {
            restartGameBtn.addEventListener('click', () => {
                document.getElementById('game-over-screen').style.display = 'none';
                this.resetGame();
                this.startGame();
            });
        }
        
        if (mainMenuBtn) {
            mainMenuBtn.addEventListener('click', () => {
                document.getElementById('game-over-screen').style.display = 'none';
                this.resetGame();
            });
        }
    }
    
    updateUI() {
        // Update score and stats
        document.getElementById('score').textContent = this.state.score.toLocaleString();
        document.getElementById('high-score').textContent = this.state.highScore.toLocaleString();
        document.getElementById('length').textContent = this.state.snake.length;
        document.getElementById('food-count').textContent = this.state.foodConsumed;
        document.getElementById('time-elapsed').textContent = this.formatTime(this.state.timeElapsed);
        document.getElementById('efficiency').textContent = `${Math.floor(this.state.efficiency)}%`;
        
        // Update speed display
        const speedPercentage = ((this.config.initialSpeed - this.state.speed) / 
                                (this.config.initialSpeed - this.config.minSpeed)) * 100;
        document.getElementById('speed-meter').style.width = `${speedPercentage}%`;
        document.getElementById('speed-text').textContent = this.getSpeedLabel();
        document.getElementById('speed-level').textContent = `LEVEL ${this.state.level}`;
        
        // Update HUD counters
        document.getElementById('combo-counter').textContent = `x${this.state.combo.toFixed(1)}`;
        document.getElementById('shield-counter').textContent = this.state.activeEffects.shield 
            ? `${this.state.activeEffects.shieldDuration * 10}%` 
            : '0%';
        document.getElementById('boost-counter').textContent = this.state.activeEffects.speedBoost 
            ? 'ACTIVE' 
            : '100%';
        document.getElementById('time-counter').textContent = this.state.activeEffects.timeFreeze 
            ? 'FROZEN' 
            : '∞';
        
        // Update power-up counts
        document.getElementById('shield-count').textContent = this.state.powerUps.shield;
        document.getElementById('speed-count').textContent = this.state.powerUps.speed;
        document.getElementById('time-count').textContent = this.state.powerUps.time;
        document.getElementById('multiplier-count').textContent = this.state.powerUps.multiplier;
        
        // Update analytics
        document.getElementById('moves-per-minute').textContent = this.state.movesPerMinute;
        document.getElementById('precision').textContent = `${Math.floor(this.state.precision)}%`;
        document.getElementById('chain-reactions').textContent = this.state.chainReactions;
        document.getElementById('near-misses').textContent = this.state.nearMisses;
        
        // Update current rank
        document.getElementById('current-rank').textContent = this.state.score.toLocaleString();
    }
    
    getSpeedLabel() {
        const speed = this.state.speed;
        if (speed >= 140) return 'QUANTUM SLOW';
        if (speed >= 100) return 'NORMAL FLOW';
        if (speed >= 80) return 'HYPER SPEED';
        if (speed >= 60) return 'LUDICROUS';
        return 'PLAID';
    }
    
    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <p>${message}</p>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            gsap.to(notification, {
                opacity: 0, y: -20, duration: 0.3,
                onComplete: () => notification.remove()
            });
        }, 3000);
    }
    
    getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'warning': return 'exclamation-triangle';
            case 'danger': return 'times-circle';
            default: return 'info-circle';
        }
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Simulate loading screen
    const loadingScreen = document.getElementById('loading-screen');
    const progressFill = document.getElementById('progress-fill');
    const loadingText = document.getElementById('loading-text');
    
    const loadingSteps = [
        { text: 'Initializing Quantum Engine...', progress: 20 },
        { text: 'Calibrating Neural Network...', progress: 40 },
        { text: 'Loading Particle Systems...', progress: 60 },
        { text: 'Establishing Grid Matrix...', progress: 80 },
        { text: 'Ready for Quantum Sequence...', progress: 100 }
    ];
    
    let currentStep = 0;
    
    const updateLoading = () => {
        if (currentStep < loadingSteps.length) {
            const step = loadingSteps[currentStep];
            loadingText.textContent = step.text;
            progressFill.style.width = `${step.progress}%`;
            currentStep++;
            setTimeout(updateLoading, 600);
        } else {
            // Loading complete
            gsap.to(loadingScreen, {
                opacity: 0, duration: 0.5,
                onComplete: () => {
                    loadingScreen.style.display = 'none';
                    // Initialize game engine
                    window.gameEngine = new QuantumSnakeEngine();
                }
            });
        }
    };
    
    // Start loading simulation
    setTimeout(updateLoading, 500);
    
    // Initialize canvas rounding polyfill
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.beginPath();
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            this.closePath();
            return this;
        };
    }
});
