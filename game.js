// Game Configuration
const CONFIG = {
    GRID_SIZE: 25,
    INITIAL_SPEED: 8,
    MAX_SPEED: 25,
    PARTICLE_VALUE: 10,
    SPEED_INCREASE_INTERVAL: 30000, // 30 seconds
    OBSTACLE_SPAWN_INTERVAL: 10000, // 10 seconds
    POWERUP_SPAWN_INTERVAL: 15000, // 15 seconds
    INITIAL_SNAKE_LENGTH: 3,
    MAX_OBSTACLES: 15,
    MAX_PARTICLES: 20,
    MAX_POWERUPS: 3,
    DIFFICULTY: {
        easy: { speed: 6, obstacles: 5, particles: 15 },
        medium: { speed: 8, obstacles: 8, particles: 12 },
        hard: { speed: 10, obstacles: 12, particles: 10 },
        insane: { speed: 12, obstacles: 15, particles: 8 }
    }
};

// Game State
const GameState = {
    RUNNING: 'running',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    MENU: 'menu'
};

// Game Instance
class QuantumSerpent {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = GameState.MENU;
        this.difficulty = 'medium';
        
        // Game objects
        this.snake = null;
        this.particles = [];
        this.obstacles = [];
        this.powerups = [];
        this.trail = [];
        
        // Game stats
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('quantumSerpentHighScore')) || 0;
        this.timeAlive = 0;
        this.particlesCollected = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimeout = null;
        this.speed = CONFIG.INITIAL_SPEED;
        this.speedMultiplier = 1.0;
        
        // Powerup states
        this.powerupsState = {
            shield: { active: false, cooldown: 0, duration: 0 },
            boost: { active: false, cooldown: 0, duration: 0 },
            teleport: { active: false, cooldown: 0 },
            magnet: { active: false, cooldown: 0, duration: 0 }
        };
        
        // Timing
        this.lastFrameTime = 0;
        this.lastMoveTime = 0;
        this.lastSpeedIncrease = 0;
        this.lastObstacleSpawn = 0;
        this.lastPowerupSpawn = 0;
        
        // UI Elements
        this.uiElements = {};
        this.screens = {};
        this.audio = {};
        
        // Initialize
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupUI();
        this.setupAudio();
        this.setupEventListeners();
        this.setupBackgroundParticles();
        this.updateLeaderboard();
        this.gameLoop();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gridSize = CONFIG.GRID_SIZE;
        this.gridWidth = Math.floor(this.canvas.width / this.gridSize);
        this.gridHeight = Math.floor(this.canvas.height / this.gridSize);
    }

    setupUI() {
        // Store UI elements
        this.uiElements = {
            score: document.getElementById('score'),
            speed: document.getElementById('speed'),
            length: document.getElementById('length'),
            particles: document.getElementById('particles'),
            comboValue: document.getElementById('combo-value'),
            comboMultiplier: document.getElementById('combo-multiplier'),
            missionProgress: document.getElementById('mission-progress'),
            progressPercent: document.getElementById('progress-percent'),
            objParticles: document.getElementById('obj-particles'),
            objLength: document.getElementById('obj-length'),
            objTime: document.getElementById('obj-time'),
            uptime: document.getElementById('uptime'),
            gameMessage: document.getElementById('game-message'),
            gameHint: document.getElementById('game-hint'),
            cpuBar: document.getElementById('cpu-bar'),
            cpuValue: document.getElementById('cpu-value'),
            gpuBar: document.getElementById('gpu-bar'),
            gpuValue: document.getElementById('gpu-value'),
            memBar: document.getElementById('mem-bar'),
            memValue: document.getElementById('mem-value')
        };

        // Store screens
        this.screens = {
            start: document.getElementById('start-screen'),
            gameOver: document.getElementById('game-over-screen'),
            pause: document.getElementById('pause-screen')
        };

        // Setup powerup UI
        this.setupPowerupUI();
    }

    setupPowerupUI() {
        const powers = ['shield', 'boost', 'teleport', 'magnet'];
        powers.forEach(power => {
            const element = document.getElementById(`${power}-power`);
            if (element) {
                element.addEventListener('click', () => this.activatePowerup(power));
            }
        });
    }

    setupAudio() {
        this.audio = {
            bgMusic: document.getElementById('bg-music'),
            collect: document.getElementById('collect-sound'),
            powerup: document.getElementById('powerup-sound'),
            gameover: document.getElementById('gameover-sound'),
            click: document.getElementById('click-sound')
        };

        // Set volumes
        Object.values(this.audio).forEach(audio => {
            if (audio) audio.volume = 0.3;
        });
        
        this.audio.click.volume = 0.1;
    }

    setupEventListeners() {
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        
        // Difficulty buttons
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.difficulty = e.target.dataset.diff;
            });
        });

        // Control buttons
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('restart-btn-final').addEventListener('click', () => this.restartGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('menu-btn').addEventListener('click', () => this.showMenu());
        document.getElementById('pause-menu-btn').addEventListener('click', () => this.showMenu());
        
        // Sound button
        document.getElementById('sound-btn').addEventListener('click', () => this.toggleSound());
        
        // Help button
        document.getElementById('help-btn').addEventListener('click', () => this.showHelp());
        
        // Movement arrows
        document.querySelectorAll('.arrow-cell.up, .arrow-cell.down, .arrow-cell.left, .arrow-cell.right').forEach(cell => {
            cell.addEventListener('click', (e) => {
                const direction = e.currentTarget.classList[1];
                this.changeDirection(direction);
            });
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    setupBackgroundParticles() {
        const container = document.getElementById('particles-bg');
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'bg-particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 3 + 1}px;
                height: ${Math.random() * 3 + 1}px;
                background: rgba(0, 200, 255, ${Math.random() * 0.3 + 0.1});
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float ${Math.random() * 10 + 5}s linear infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            container.appendChild(particle);
        }

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0% { transform: translateY(0) translateX(0); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    startGame() {
        this.playSound('click');
        
        // Reset game state
        this.state = GameState.RUNNING;
        this.score = 0;
        this.timeAlive = 0;
        this.particlesCollected = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.speed = CONFIG.DIFFICULTY[this.difficulty].speed;
        this.speedMultiplier = 1.0;
        
        // Reset powerups
        Object.keys(this.powerupsState).forEach(key => {
            this.powerupsState[key] = { active: false, cooldown: 0, duration: 0 };
        });

        // Create snake
        this.snake = {
            x: Math.floor(this.gridWidth / 2) * this.gridSize,
            y: Math.floor(this.gridHeight / 2) * this.gridSize,
            dx: this.gridSize,
            dy: 0,
            cells: [],
            maxCells: CONFIG.INITIAL_SNAKE_LENGTH,
            color: '#00f3ff',
            glowColor: 'rgba(0, 243, 255, 0.3)'
        };

        // Initialize snake cells
        for (let i = 0; i < this.snake.maxCells; i++) {
            this.snake.cells.push({
                x: this.snake.x - (i * this.gridSize),
                y: this.snake.y
            });
        }

        // Clear game objects
        this.particles = [];
        this.obstacles = [];
        this.powerups = [];
        this.trail = [];

        // Spawn initial objects
        this.spawnParticles(CONFIG.DIFFICULTY[this.difficulty].particles);
        this.spawnObstacles(CONFIG.DIFFICULTY[this.difficulty].obstacles);

        // Reset timing
        this.lastFrameTime = performance.now();
        this.lastMoveTime = 0;
        this.lastSpeedIncrease = 0;
        this.lastObstacleSpawn = 0;
        this.lastPowerupSpawn = 0;

        // Hide screens
        this.screens.start.style.display = 'none';
        this.screens.gameOver.style.display = 'none';
        this.screens.pause.style.display = 'none';

        // Start music
        this.audio.bgMusic.currentTime = 0;
        this.audio.bgMusic.play().catch(e => console.log("Audio play failed:", e));

        // Show message
        this.showMessage('QUANTUM FIELD ENGAGED', 2000);
    }

    togglePause() {
        if (this.state === GameState.RUNNING) {
            this.state = GameState.PAUSED;
            this.screens.pause.style.display = 'flex';
            this.audio.bgMusic.pause();
            this.updatePauseScreen();
        } else if (this.state === GameState.PAUSED) {
            this.state = GameState.RUNNING;
            this.screens.pause.style.display = 'none';
            this.audio.bgMusic.play();
        }
    }

    restartGame() {
        this.playSound('click');
        this.startGame();
    }

    showMenu() {
        this.playSound('click');
        this.state = GameState.MENU;
        this.screens.gameOver.style.display = 'none';
        this.screens.pause.style.display = 'none';
        this.screens.start.style.display = 'flex';
        this.audio.bgMusic.pause();
    }

    toggleSound() {
        const btn = document.getElementById('sound-btn');
        const icon = btn.querySelector('i');
        if (this.audio.bgMusic.muted) {
            this.audio.bgMusic.muted = false;
            icon.className = 'fas fa-volume-up';
            btn.querySelector('span').textContent = 'SOUND ON';
        } else {
            this.audio.bgMusic.muted = true;
            icon.className = 'fas fa-volume-mute';
            btn.querySelector('span').textContent = 'SOUND OFF';
        }
    }

    showHelp() {
        this.showMessage('Use WASD or Arrow Keys to move', 3000);
    }

    handleKeyDown(e) {
        if (this.state === GameState.MENU) return;

        switch(e.key.toLowerCase()) {
            case ' ':
            case 'p':
                e.preventDefault();
                this.togglePause();
                break;

            case 'w':
            case 'arrowup':
                if (this.snake.dy === 0) {
                    this.snake.dx = 0;
                    this.snake.dy = -this.gridSize;
                }
                break;

            case 's':
            case 'arrowdown':
                if (this.snake.dy === 0) {
                    this.snake.dx = 0;
                    this.snake.dy = this.gridSize;
                }
                break;

            case 'a':
            case 'arrowleft':
                if (this.snake.dx === 0) {
                    this.snake.dx = -this.gridSize;
                    this.snake.dy = 0;
                }
                break;

            case 'd':
            case 'arrowright':
                if (this.snake.dx === 0) {
                    this.snake.dx = this.gridSize;
                    this.snake.dy = 0;
                }
                break;

            case '1':
            case 's':
                this.activatePowerup('shield');
                break;

            case '2':
            case 'b':
                this.activatePowerup('boost');
                break;

            case '3':
            case 'q':
                this.activatePowerup('teleport');
                break;

            case '4':
            case 'm':
                this.activatePowerup('magnet');
                break;
        }
    }

    changeDirection(direction) {
        if (this.state !== GameState.RUNNING) return;

        switch(direction) {
            case 'up':
                if (this.snake.dy === 0) {
                    this.snake.dx = 0;
                    this.snake.dy = -this.gridSize;
                }
                break;
            case 'down':
                if (this.snake.dy === 0) {
                    this.snake.dx = 0;
                    this.snake.dy = this.gridSize;
                }
                break;
            case 'left':
                if (this.snake.dx === 0) {
                    this.snake.dx = -this.gridSize;
                    this.snake.dy = 0;
                }
                break;
            case 'right':
                if (this.snake.dx === 0) {
                    this.snake.dx = this.gridSize;
                    this.snake.dy = 0;
                }
                break;
        }
    }

    activatePowerup(power) {
        if (this.state !== GameState.RUNNING) return;
        if (this.powerupsState[power].cooldown > 0) return;

        this.playSound('powerup');

        switch(power) {
            case 'shield':
                this.powerupsState.shield = {
                    active: true,
                    cooldown: 10,
                    duration: 5
                };
                this.showMessage('QUANTUM SHIELD ACTIVATED', 1500);
                break;

            case 'boost':
                this.powerupsState.boost = {
                    active: true,
                    cooldown: 15,
                    duration: 3
                };
                this.speedMultiplier = 2.0;
                setTimeout(() => {
                    this.speedMultiplier = 1.0;
                }, 3000);
                this.showMessage('TIME WARP ENGAGED', 1500);
                break;

            case 'teleport':
                this.powerupsState.teleport = {
                    active: true,
                    cooldown: 20
                };
                // Teleport to random safe location
                this.teleportSnake();
                this.showMessage('QUANTUM JUMP COMPLETE', 1500);
                break;

            case 'magnet':
                this.powerupsState.magnet = {
                    active: true,
                    cooldown: 25,
                    duration: 5
                };
                this.showMessage('PARTICLE MAGNET ACTIVE', 1500);
                break;
        }

        // Update powerup UI
        this.updatePowerupUI(power);
    }

    teleportSnake() {
        let newX, newY;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            newX = Math.floor(Math.random() * this.gridWidth) * this.gridSize;
            newY = Math.floor(Math.random() * this.gridHeight) * this.gridSize;
            attempts++;

            // Check if position is safe (not on obstacle)
            let safe = true;
            for (const obstacle of this.obstacles) {
                if (obstacle.x === newX && obstacle.y === newY) {
                    safe = false;
                    break;
                }
            }

            if (safe) {
                this.snake.x = newX;
                this.snake.y = newY;
                // Move all snake cells to new position
                this.snake.cells = [];
                for (let i = 0; i < this.snake.maxCells; i++) {
                    this.snake.cells.push({
                        x: newX - (i * this.gridSize),
                        y: newY
                    });
                }
                break;
            }
        } while (attempts < maxAttempts);
    }

    updatePowerupUI(power) {
        const element = document.getElementById(`${power}-power`);
        if (!element) return;

        const statusEl = element.querySelector('.powerup-status');
        const cooldownEl = element.querySelector('.powerup-cooldown');

        if (this.powerupsState[power].cooldown > 0) {
            statusEl.textContent = 'CD';
            statusEl.className = 'powerup-status cooldown';
            element.style.opacity = '0.5';
            
            // Animate cooldown
            const cooldownTime = power === 'shield' ? 10 : power === 'boost' ? 15 : power === 'teleport' ? 20 : 25;
            cooldownEl.style.transform = 'scaleX(1)';
            cooldownEl.style.transition = `transform ${cooldownTime}s linear`;
            
            setTimeout(() => {
                cooldownEl.style.transform = 'scaleX(0)';
                statusEl.textContent = 'READY';
                statusEl.className = 'powerup-status ready';
                element.style.opacity = '1';
            }, this.powerupsState[power].cooldown * 1000);
        }
    }

    update(deltaTime) {
        if (this.state !== GameState.RUNNING) return;

        this.timeAlive += deltaTime / 1000;

        // Update powerup durations
        Object.keys(this.powerupsState).forEach(power => {
            if (this.powerupsState[power].duration > 0) {
                this.powerupsState[power].duration -= deltaTime / 1000;
                if (this.powerupsState[power].duration <= 0) {
                    this.powerupsState[power].active = false;
                }
            }
            
            if (this.powerupsState[power].cooldown > 0) {
                this.powerupsState[power].cooldown -= deltaTime / 1000;
            }
        });

        // Move snake
        const moveInterval = 1000 / (this.speed * this.speedMultiplier);
        const now = performance.now();

        if (now - this.lastMoveTime > moveInterval) {
            this.lastMoveTime = now;

            // Add current position to trail
            this.trail.push({ x: this.snake.x, y: this.snake.y, alpha: 1 });
            if (this.trail.length > 30) this.trail.shift();

            // Update trail alphas
            this.trail.forEach((point, i) => {
                point.alpha = i / this.trail.length;
            });

            // Move snake
            this.snake.x += this.snake.dx;
            this.snake.y += this.snake.dy;

            // Wrap around screen
            if (this.snake.x >= this.canvas.width) this.snake.x = 0;
            if (this.snake.x < 0) this.snake.x = this.canvas.width - this.gridSize;
            if (this.snake.y >= this.canvas.height) this.snake.y = 0;
            if (this.snake.y < 0) this.snake.y = this.canvas.height - this.gridSize;

            // Add new head position
            this.snake.cells.unshift({ x: this.snake.x, y: this.snake.y });

            // Keep snake at correct length
            if (this.snake.cells.length > this.snake.maxCells) {
                this.snake.cells.pop();
            }

            // Check collisions
            this.checkCollisions();

            // Check particle collection
            this.checkParticleCollection();

            // Check powerup collection
            this.checkPowerupCollection();

            // Magnet effect
            if (this.powerupsState.magnet.active) {
                this.applyMagnetEffect();
            }

            // Spawn new objects
            this.spawnObjects(now);

            // Increase difficulty
            this.increaseDifficulty(now);
        }

        // Update UI
        this.updateUI();
    }

    checkCollisions() {
        // Check collision with self
        for (let i = 1; i < this.snake.cells.length; i++) {
            if (this.snake.cells[i].x === this.snake.x && this.snake.cells[i].y === this.snake.y) {
                if (!this.powerupsState.shield.active) {
                    this.gameOver();
                    return;
                } else {
                    // Shield protects from self-collision
                    this.snake.cells.splice(i, this.snake.cells.length - i);
                    this.snake.maxCells = this.snake.cells.length;
                    this.showMessage('SHIELD ABSORBED IMPACT', 1000);
                }
            }
        }

        // Check collision with obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            if (this.snake.x === obstacle.x && this.snake.y === obstacle.y) {
                if (!this.powerupsState.shield.active) {
                    this.gameOver();
                    return;
                } else {
                    // Destroy obstacle with shield
                    this.obstacles.splice(i, 1);
                    this.score += 50;
                    this.showMessage('OBSTACLE DESTROYED', 800);
                }
            }
        }
    }

    checkParticleCollection() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            if (this.snake.x === particle.x && this.snake.y === particle.y) {
                // Collect particle
                this.particles.splice(i, 1);
                
                // Calculate score with combo multiplier
                const comboMultiplier = 1 + (this.combo * 0.1);
                const points = Math.floor(CONFIG.PARTICLE_VALUE * comboMultiplier);
                
                this.score += points;
                this.particlesCollected++;
                this.combo++;
                
                if (this.combo > this.maxCombo) {
                    this.maxCombo = this.combo;
                }

                // Update combo display
                this.updateComboDisplay();

                // Play sound
                this.playSound('collect');

                // Increase snake length every 5 particles
                if (this.particlesCollected % 5 === 0) {
                    this.snake.maxCells++;
                    this.showMessage('NEURAL LINK EXTENDED', 800);
                }

                // Clear combo timeout
                if (this.comboTimeout) {
                    clearTimeout(this.comboTimeout);
                }

                // Set combo timeout
                this.comboTimeout = setTimeout(() => {
                    if (this.combo > 1) {
                        this.showMessage(`COMBO x${this.combo} COMPLETE`, 1000);
                    }
                    this.combo = 0;
                    this.updateComboDisplay();
                }, 2000);

                break;
            }
        }
    }

    checkPowerupCollection() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            
            if (this.snake.x === powerup.x && this.snake.y === powerup.y) {
                this.powerups.splice(i, 1);
                this.activatePowerup(powerup.type);
                break;
            }
        }
    }

    applyMagnetEffect() {
        const magnetRadius = this.gridSize * 8;
        
        this.particles.forEach(particle => {
            const dx = this.snake.x - particle.x;
            const dy = this.snake.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < magnetRadius) {
                // Move particle toward snake
                const angle = Math.atan2(dy, dx);
                const speed = this.gridSize * 0.5;
                
                particle.x += Math.cos(angle) * speed;
                particle.y += Math.sin(angle) * speed;
                
                // Wrap around screen
                if (particle.x >= this.canvas.width) particle.x = 0;
                if (particle.x < 0) particle.x = this.canvas.width - this.gridSize;
                if (particle.y >= this.canvas.height) particle.y = 0;
                if (particle.y < 0) particle.y = this.canvas.height - this.gridSize;
            }
        });
    }

    spawnObjects(now) {
        // Spawn particles
        if (this.particles.length < CONFIG.MAX_PARTICLES && 
            (!this.lastParticleSpawn || now - this.lastParticleSpawn > 2000)) {
            this.spawnParticles(1);
            this.lastParticleSpawn = now;
        }

        // Spawn obstacles
        if (this.obstacles.length < CONFIG.MAX_OBSTACLES && 
            now - this.lastObstacleSpawn > CONFIG.OBSTACLE_SPAWN_INTERVAL) {
            this.spawnObstacles(1);
            this.lastObstacleSpawn = now;
        }

        // Spawn powerups
        if (this.powerups.length < CONFIG.MAX_POWERUPS && 
            now - this.lastPowerupSpawn > CONFIG.POWERUP_SPAWN_INTERVAL) {
            this.spawnPowerup();
            this.lastPowerupSpawn = now;
        }
    }

    spawnParticles(count) {
        for (let i = 0; i < count; i++) {
            let x, y;
            let attempts = 0;
            const maxAttempts = 50;

            do {
                x = Math.floor(Math.random() * this.gridWidth) * this.gridSize;
                y = Math.floor(Math.random() * this.gridHeight) * this.gridSize;
                attempts++;

                // Check if position is free
                let free = true;
                
                // Check snake
                for (const cell of this.snake.cells) {
                    if (cell.x === x && cell.y === y) {
                        free = false;
                        break;
                    }
                }

                // Check obstacles
                if (free) {
                    for (const obstacle of this.obstacles) {
                        if (obstacle.x === x && obstacle.y === y) {
                            free = false;
                            break;
                        }
                    }
                }

                // Check other particles
                if (free) {
                    for (const particle of this.particles) {
                        if (particle.x === x && particle.y === y) {
                            free = false;
                            break;
                        }
                    }
                }

                if (free || attempts >= maxAttempts) break;
            } while (true);

            this.particles.push({
                x, y,
                size: this.gridSize * 0.6,
                color: '#00f3ff',
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    spawnObstacles(count) {
        for (let i = 0; i < count; i++) {
            let x, y;
            let attempts = 0;
            const maxAttempts = 50;

            do {
                x = Math.floor(Math.random() * this.gridWidth) * this.gridSize;
                y = Math.floor(Math.random() * this.gridHeight) * this.gridSize;
                attempts++;

                // Don't spawn too close to snake
                const minDistance = this.gridSize * 5;
                let tooClose = false;
                
                for (const cell of this.snake.cells) {
                    const dx = cell.x - x;
                    const dy = cell.y - y;
                    if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
                        tooClose = true;
                        break;
                    }
                }

                if (!tooClose || attempts >= maxAttempts) break;
            } while (true);

            this.obstacles.push({
                x, y,
                size: this.gridSize,
                color: '#ff5555',
                glowColor: 'rgba(255, 85, 85, 0.3)'
            });
        }
    }

    spawnPowerup() {
        const types = ['shield', 'boost', 'teleport', 'magnet'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let x, y;
        let attempts = 0;
        const maxAttempts = 50;

        do {
            x = Math.floor(Math.random() * this.gridWidth) * this.gridSize;
            y = Math.floor(Math.random() * this.gridHeight) * this.gridSize;
            attempts++;

            // Check if position is free
            let free = true;
            
            // Check snake
            for (const cell of this.snake.cells) {
                if (cell.x === x && cell.y === y) {
                    free = false;
                    break;
                }
            }

            // Check obstacles
            if (free) {
                for (const obstacle of this.obstacles) {
                    if (obstacle.x === x && obstacle.y === y) {
                        free = false;
                        break;
                    }
                }
            }

            // Check particles
            if (free) {
                for (const particle of this.particles) {
                    if (particle.x === x && particle.y === y) {
                        free = false;
                        break;
                    }
                }
            }

            if (free || attempts >= maxAttempts) break;
        } while (true);

        this.powerups.push({
            x, y,
            type,
            size: this.gridSize,
            pulse: 0
        });
    }

    increaseDifficulty(now) {
        if (now - this.lastSpeedIncrease > CONFIG.SPEED_INCREASE_INTERVAL && 
            this.speed < CONFIG.MAX_SPEED) {
            this.speed++;
            this.lastSpeedIncrease = now;
            this.showMessage('SPEED INCREASED', 1000);
        }
    }

    gameOver() {
        this.state = GameState.GAME_OVER;
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('quantumSerpentHighScore', this.highScore);
        }

        // Play game over sound
        this.playSound('gameover');
        this.audio.bgMusic.pause();

        // Update game over screen
        this.updateGameOverScreen();

        // Show game over screen
        setTimeout(() => {
            this.screens.gameOver.style.display = 'flex';
        }, 1000);

        // Update leaderboard
        this.updateLeaderboard();
    }

    updateUI() {
        // Update stats
        this.uiElements.score.textContent = this.score.toLocaleString();
        this.uiElements.speed.textContent = `${(this.speed * this.speedMultiplier).toFixed(1)}x`;
        this.uiElements.length.textContent = this.snake ? this.snake.cells.length : 0;
        this.uiElements.particles.textContent = this.particlesCollected;
        this.uiElements.uptime.textContent = this.formatTime(this.timeAlive);

        // Update mission progress
        const particleProgress = Math.min(100, (this.particlesCollected / 50) * 100);
        const lengthProgress = Math.min(100, ((this.snake?.cells.length || 0) / 20) * 100);
        const timeProgress = Math.min(100, (this.timeAlive / 300) * 100);
        const totalProgress = (particleProgress + lengthProgress + timeProgress) / 3;
        
        this.uiElements.missionProgress.style.width = `${totalProgress}%`;
        this.uiElements.progressPercent.textContent = `${Math.floor(totalProgress)}%`;
        
        this.uiElements.objParticles.textContent = `${this.particlesCollected}/50`;
        this.uiElements.objLength.textContent = `${this.snake?.cells.length || 0}/20`;
        this.uiElements.objTime.textContent = `${this.formatTime(this.timeAlive)}/5:00`;

        // Update performance metrics (simulated)
        const cpuLoad = 30 + (this.speed / CONFIG.MAX_SPEED) * 40 + Math.random() * 5;
        const gpuLoad = 25 + (this.speed / CONFIG.MAX_SPEED) * 45 + Math.random() * 5;
        const memLoad = 40 + (this.particlesCollected / 100) * 30 + Math.random() * 10;
        
        this.uiElements.cpuBar.style.width = `${cpuLoad}%`;
        this.uiElements.gpuBar.style.width = `${gpuLoad}%`;
        this.uiElements.memBar.style.width = `${memLoad}%`;
        
        this.uiElements.cpuValue.textContent = `${Math.floor(cpuLoad)}%`;
        this.uiElements.gpuValue.textContent = `${Math.floor(gpuLoad)}%`;
        this.uiElements.memValue.textContent = `${Math.floor(memLoad)}%`;
    }

    updateComboDisplay() {
        this.uiElements.comboValue.textContent = `${this.combo}x`;
        
        if (this.combo > 1) {
            this.uiElements.comboValue.style.fontSize = `${2.5 + (this.combo * 0.1)}rem`;
            this.uiElements.comboMultiplier.textContent = `+${Math.floor((this.combo - 1) * 10)}%`;
        } else {
            this.uiElements.comboValue.style.fontSize = '2.5rem';
            this.uiElements.comboMultiplier.textContent = '';
        }
    }

    updatePauseScreen() {
        document.getElementById('pause-score').textContent = this.score.toLocaleString();
        document.getElementById('pause-time').textContent = this.formatTime(this.timeAlive);
        document.getElementById('pause-particles').textContent = this.particlesCollected;
    }

    updateGameOverScreen() {
        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-time').textContent = this.formatTime(this.timeAlive);
        document.getElementById('final-particles').textContent = this.particlesCollected;
        document.getElementById('final-length').textContent = this.snake?.cells.length || 0;
        document.getElementById('final-speed').textContent = `${this.speed}x`;
        document.getElementById('final-combo').textContent = this.maxCombo;
    }

    updateLeaderboard() {
        // Get existing leaderboard from localStorage
        let leaderboard = JSON.parse(localStorage.getItem('quantumSerpentLeaderboard')) || [];
        
        // Add current score if game is over
        if (this.state === GameState.GAME_OVER) {
            leaderboard.push({
                name: 'AGENT-7A9B',
                score: this.score,
                time: this.timeAlive,
                date: new Date().toISOString()
            });
            
            // Sort by score (descending) and keep top 5
            leaderboard.sort((a, b) => b.score - a.score);
            leaderboard = leaderboard.slice(0, 5);
            
            // Save to localStorage
            localStorage.setItem('quantumSerpentLeaderboard', JSON.stringify(leaderboard));
        }

        // Update UI
        const container = document.getElementById('leaderboard');
        container.innerHTML = '';

        leaderboard.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item ${entry.name === 'AGENT-7A9B' ? 'you' : ''}`;
            item.innerHTML = `
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-name">${entry.name}</div>
                <div class="leaderboard-score">${entry.score.toLocaleString()}</div>
            `;
            container.appendChild(item);
        });
    }

    showMessage(text, duration = 2000) {
        this.uiElements.gameMessage.textContent = text;
        this.uiElements.gameMessage.style.opacity = '1';
        
        setTimeout(() => {
            this.uiElements.gameMessage.style.opacity = '0';
        }, duration);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    playSound(type) {
        const audio = this.audio[type];
        if (audio && !audio.muted) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log(`Audio ${type} failed:`, e));
        }
    }

    render() {
        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(10, 10, 32, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw trail
        this.drawTrail();

        // Draw particles
        this.particles.forEach(particle => this.drawParticle(particle));

        // Draw obstacles
        this.obstacles.forEach(obstacle => this.drawObstacle(obstacle));

        // Draw powerups
        this.powerups.forEach(powerup => this.drawPowerup(powerup));

        // Draw snake
        if (this.snake) {
            this.drawSnake();
        }

        // Draw shield if active
        if (this.powerupsState.shield.active) {
            this.drawShield();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 100, 255, 0.05)';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawTrail() {
        this.trail.forEach((point, index) => {
            const alpha = point.alpha * 0.5;
            const radius = (this.gridSize / 2) * alpha;
            
            // Glow effect
            const gradient = this.ctx.createRadialGradient(
                point.x + this.gridSize / 2,
                point.y + this.gridSize / 2,
                0,
                point.x + this.gridSize / 2,
                point.y + this.gridSize / 2,
                radius
            );
            
            gradient.addColorStop(0, `rgba(0, 243, 255, ${alpha * 0.8})`);
            gradient.addColorStop(1, `rgba(0, 100, 255, 0)`);
            
            this.ctx.beginPath();
            this.ctx.arc(point.x + this.gridSize / 2, point.y + this.gridSize / 2, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        });
    }

    drawParticle(particle) {
        const time = performance.now() / 1000;
        particle.pulse += 0.1;
        const pulse = Math.sin(particle.pulse) * 0.2 + 0.8;
        const size = particle.size * pulse;

        // Outer glow
        const gradient = this.ctx.createRadialGradient(
            particle.x + this.gridSize / 2,
            particle.y + this.gridSize / 2,
            0,
            particle.x + this.gridSize / 2,
            particle.y + this.gridSize / 2,
            size
        );
        
        gradient.addColorStop(0, 'rgba(0, 243, 255, 0.8)');
        gradient.addColorStop(0.7, 'rgba(0, 200, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');

        this.ctx.beginPath();
        this.ctx.arc(particle.x + this.gridSize / 2, particle.y + this.gridSize / 2, size, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Inner core
        this.ctx.beginPath();
        this.ctx.arc(particle.x + this.gridSize / 2, particle.y + this.gridSize / 2, this.gridSize * 0.2, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00f3ff';
        this.ctx.fill();

        // Sparkle effect
        if (Math.random() < 0.1) {
            const angle = Math.random() * Math.PI * 2;
            const sparkleX = particle.x + this.gridSize / 2 + Math.cos(angle) * (size * 0.8);
            const sparkleY = particle.y + this.gridSize / 2 + Math.sin(angle) * (size * 0.8);
            
            this.ctx.beginPath();
            this.ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fill();
        }
    }

    drawObstacle(obstacle) {
        // Outer glow
        this.ctx.shadowColor = '#ff5555';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = 'rgba(255, 85, 85, 0.3)';
        this.ctx.fillRect(obstacle.x - 5, obstacle.y - 5, obstacle.size + 10, obstacle.size + 10);
        this.ctx.shadowBlur = 0;

        // Main body
        this.ctx.fillStyle = '#ff5555';
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.size, obstacle.size);

        // Inner pattern
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(obstacle.x + 4, obstacle.y + 4, obstacle.size - 8, obstacle.size - 8);

        // Hazard symbol
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + obstacle.size / 2, obstacle.y + 8);
        this.ctx.lineTo(obstacle.x + obstacle.size / 2, obstacle.y + obstacle.size - 8);
        this.ctx.moveTo(obstacle.x + 8, obstacle.y + obstacle.size / 2);
        this.ctx.lineTo(obstacle.x + obstacle.size - 8, obstacle.y + obstacle.size / 2);
        this.ctx.stroke();
    }

    drawPowerup(powerup) {
        const time = performance.now() / 1000;
        powerup.pulse += 0.05;
        const pulse = Math.sin(powerup.pulse) * 0.3 + 0.7;

        let color, symbol;
        
        switch(powerup.type) {
            case 'shield':
                color = '#00f3ff';
                symbol = '🛡️';
                break;
            case 'boost':
                color = '#ffff00';
                symbol = '⚡';
                break;
            case 'teleport':
                color = '#ff00ff';
                symbol = '🌀';
                break;
            case 'magnet':
                color = '#ff8800';
                symbol = '🧲';
                break;
        }

        // Glow effect
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 30 * pulse;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(powerup.x, powerup.y, powerup.size, powerup.size);
        this.ctx.shadowBlur = 0;

        // Symbol
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${this.gridSize * 0.8}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(symbol, powerup.x + powerup.size / 2, powerup.y + powerup.size / 2);
    }

    drawSnake() {
        this.snake.cells.forEach((cell, index) => {
            const alpha = 1 - (index / this.snake.cells.length) * 0.5;
            const size = this.gridSize * (0.9 + (index === 0 ? 0.2 : 0));

            // Cell body
            this.ctx.fillStyle = `rgba(0, 243, 255, ${alpha})`;
            this.ctx.fillRect(cell.x, cell.y, size, size);

            // Inner highlight
            this.ctx.fillStyle = `rgba(200, 255, 255, ${alpha * 0.5})`;
            this.ctx.fillRect(cell.x + 2, cell.y + 2, size - 4, size - 4);

            // Grid pattern on body
            this.ctx.strokeStyle = `rgba(0, 200, 255, ${alpha * 0.3})`;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(cell.x, cell.y, size, size);

            // Head effects
            if (index === 0) {
                // Eyes
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(cell.x + size * 0.3, cell.y + size * 0.3, size * 0.1, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(cell.x + size * 0.7, cell.y + size * 0.3, size * 0.1, 0, Math.PI * 2);
                this.ctx.fill();

                // Head glow
                this.ctx.shadowColor = '#00f3ff';
                this.ctx.shadowBlur = 30;
                this.ctx.fillStyle = `rgba(0, 243, 255, ${alpha * 0.3})`;
                this.ctx.fillRect(cell.x - 10, cell.y - 10, size + 20, size + 20);
                this.ctx.shadowBlur = 0;
            }
        });
    }

    drawShield() {
        const head = this.snake.cells[0];
        if (!head) return;

        const time = performance.now() / 1000;
        const pulse = Math.sin(time * 10) * 0.2 + 0.8;
        const radius = this.gridSize * 1.5 * pulse;

        // Shield glow
        const gradient = this.ctx.createRadialGradient(
            head.x + this.gridSize / 2,
            head.y + this.gridSize / 2,
            this.gridSize * 0.5,
            head.x + this.gridSize / 2,
            head.y + this.gridSize / 2,
            radius
        );
        
        gradient.addColorStop(0, 'rgba(0, 200, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');

        this.ctx.beginPath();
        this.ctx.arc(head.x + this.gridSize / 2, head.y + this.gridSize / 2, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Shield rings
        this.ctx.strokeStyle = `rgba(0, 243, 255, ${pulse})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(head.x + this.gridSize / 2, head.y + this.gridSize / 2, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(head.x + this.gridSize / 2, head.y + this.gridSize / 2, radius * 0.7, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    gameLoop() {
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        // Update game logic
        this.update(deltaTime);

        // Render game
        this.render();

        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new QuantumSerpent();
    
    // Add char index for animations
    document.querySelectorAll('.logo-char, .title-char').forEach((char, index) => {
        char.style.setProperty('--char-index', index);
    });
});
