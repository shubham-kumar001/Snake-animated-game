// ===== GAME CONFIGURATION =====
const CONFIG = {
    GRID_SIZE: 25,
    INITIAL_SPEED: 8,
    MAX_SPEED: 25,
    PARTICLE_VALUE: 10,
    SPEED_INCREASE_INTERVAL: 30000,
    OBSTACLE_SPAWN_INTERVAL: 10000,
    POWERUP_SPAWN_INTERVAL: 15000,
    INITIAL_SNAKE_LENGTH: 3,
    MAX_OBSTACLES: 20,
    MAX_PARTICLES: 25,
    MAX_POWERUPS: 4,
    DIFFICULTY: {
        simplex: { speed: 6, obstacles: 5, particles: 15, spawnRate: 1.5 },
        standard: { speed: 8, obstacles: 10, particles: 12, spawnRate: 1.0 },
        quantum: { speed: 10, obstacles: 15, particles: 10, spawnRate: 0.8 },
        neural: { speed: 12, obstacles: 20, particles: 8, spawnRate: 0.6 }
    },
    ABILITIES: {
        shield: { cooldown: 10, duration: 5 },
        boost: { cooldown: 15, duration: 3 },
        teleport: { cooldown: 20 },
        magnet: { cooldown: 25, duration: 5 }
    },
    COMBO: {
        timeout: 2000,
        multiplier: 0.1,
        maxMultiplier: 2.0
    }
};

// ===== GAME ENGINE =====
class QuantumSerpent {
    constructor() {
        // Canvas and rendering
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = 'menu'; // menu, playing, paused, gameover
        this.difficulty = 'standard';
        
        // Game objects
        this.snake = null;
        this.particles = [];
        this.obstacles = [];
        this.powerups = [];
        this.trail = [];
        this.effects = [];
        
        // Game stats
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('quantumSerpentHighScore')) || 0;
        this.timeAlive = 0;
        this.particlesCollected = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboMultiplier = 1.0;
        this.comboTimeout = null;
        this.speed = CONFIG.INITIAL_SPEED;
        this.speedMultiplier = 1.0;
        this.missionProgress = 0;
        
        // Ability states
        this.abilities = {
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
        this.lastParticleSpawn = 0;
        this.lastFPSUpdate = 0;
        this.frameCount = 0;
        this.fps = 60;
        
        // Audio
        this.audio = {
            enabled: true,
            bgMusic: document.getElementById('bg-music'),
            collect: document.getElementById('collect-sound'),
            powerup: document.getElementById('powerup-sound'),
            gameover: document.getElementById('gameover-sound'),
            click: document.getElementById('click-sound'),
            shield: document.getElementById('shield-sound'),
            boost: document.getElementById('boost-sound'),
            teleport: document.getElementById('teleport-sound'),
            combo: document.getElementById('combo-sound')
        };
        
        // Initialize
        this.init();
    }
    
    // ===== INITIALIZATION =====
    init() {
        this.setupCanvas();
        this.setupUI();
        this.setupAudio();
        this.setupEventListeners();
        this.createBackgroundParticles();
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
        // Update high score display
        document.getElementById('high-score').textContent = this.highScore.toLocaleString();
        
        // Setup ability cards
        this.setupAbilityCards();
        
        // Show initial message
        this.showMessage('QUANTUM SYSTEM READY', 'Initiate neural link to begin', 3000);
    }
    
    setupAbilityCards() {
        const abilities = ['shield', 'boost', 'teleport', 'magnet'];
        abilities.forEach(ability => {
            const card = document.getElementById(`${ability}-ability`);
            if (card) {
                card.addEventListener('click', () => this.activateAbility(ability));
                this.updateAbilityUI(ability);
            }
        });
    }
    
    setupAudio() {
        // Set audio properties
        Object.values(this.audio).forEach(audio => {
            if (audio instanceof Audio) {
                audio.volume = 0.3;
                audio.loop = audio === this.audio.bgMusic;
            }
        });
        this.audio.click.volume = 0.1;
        this.audio.combo.volume = 0.2;
    }
    
    setupEventListeners() {
        // Start button
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        
        // Difficulty selection
        document.querySelectorAll('.difficulty-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-option').forEach(opt => opt.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.difficulty = e.currentTarget.dataset.difficulty;
            });
        });
        
        // Control buttons
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('menu-btn').addEventListener('click', () => this.showMenu());
        document.getElementById('pause-menu-btn').addEventListener('click', () => this.showMenu());
        document.getElementById('help-btn').addEventListener('click', () => this.showHelp());
        document.getElementById('share-btn').addEventListener('click', () => this.shareScore());
        
        // Sound button
        document.getElementById('sound-btn').addEventListener('click', () => this.toggleSound());
        
        // Movement controls
        document.querySelectorAll('.movement-cell[data-direction]').forEach(cell => {
            cell.addEventListener('click', (e) => {
                const direction = e.currentTarget.dataset.direction;
                this.changeDirection(direction);
            });
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    createBackgroundParticles() {
        const container = document.getElementById('particles-bg');
        for (let i = 0; i < 100; i++) {
            const particle = document.createElement('div');
            particle.className = 'bg-particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 3 + 1}px;
                height: ${Math.random() * 3 + 1}px;
                background: rgba(${Math.random() * 100 + 155}, ${Math.random() * 100 + 155}, 255, ${Math.random() * 0.2 + 0.1});
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float ${Math.random() * 20 + 10}s linear infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            container.appendChild(particle);
        }
    }
    
    // ===== GAME STATE MANAGEMENT =====
    startGame() {
        this.playSound('click');
        
        // Reset game state
        this.state = 'playing';
        this.score = 0;
        this.timeAlive = 0;
        this.particlesCollected = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboMultiplier = 1.0;
        this.speed = CONFIG.DIFFICULTY[this.difficulty].speed;
        this.speedMultiplier = 1.0;
        this.missionProgress = 0;
        
        // Reset abilities
        Object.keys(this.abilities).forEach(key => {
            this.abilities[key] = { active: false, cooldown: 0, duration: 0 };
        });
        this.updateAllAbilityUI();
        
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
                y: this.snake.y,
                angle: 0,
                pulse: i * 0.2
            });
        }
        
        // Clear game objects
        this.particles = [];
        this.obstacles = [];
        this.powerups = [];
        this.trail = [];
        this.effects = [];
        
        // Spawn initial objects
        this.spawnParticles(CONFIG.DIFFICULTY[this.difficulty].particles);
        this.spawnObstacles(CONFIG.DIFFICULTY[this.difficulty].obstacles);
        
        // Reset timing
        this.lastFrameTime = performance.now();
        this.lastMoveTime = 0;
        this.lastSpeedIncrease = 0;
        this.lastObstacleSpawn = 0;
        this.lastPowerupSpawn = 0;
        this.lastParticleSpawn = 0;
        
        // Hide screens
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('pause-screen').style.display = 'none';
        
        // Start music
        this.audio.bgMusic.currentTime = 0;
        this.audio.bgMusic.play().catch(console.log);
        
        // Show message
        this.showMessage('QUANTUM FIELD ENGAGED', 'Neural link established', 2000);
        
        // Update UI
        this.updateComboUI();
        this.updateMissionUI();
    }
    
    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pause-screen').style.display = 'flex';
            this.updatePauseScreen();
            this.audio.bgMusic.pause();
        } else if (this.state === 'paused') {
            this.state = 'playing';
            document.getElementById('pause-screen').style.display = 'none';
            this.audio.bgMusic.play();
        }
    }
    
    showMenu() {
        this.playSound('click');
        this.state = 'menu';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('pause-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
        this.audio.bgMusic.pause();
    }
    
    toggleSound() {
        const btn = document.getElementById('sound-btn');
        const icon = btn.querySelector('i');
        this.audio.enabled = !this.audio.enabled;
        
        if (this.audio.enabled) {
            icon.className = 'fas fa-volume-up';
            btn.querySelector('span').textContent = 'SOUND ON';
            this.audio.bgMusic.volume = 0.3;
        } else {
            icon.className = 'fas fa-volume-mute';
            btn.querySelector('span').textContent = 'SOUND OFF';
            this.audio.bgMusic.volume = 0;
        }
    }
    
    showHelp() {
        this.showMessage('HELP', 'Check the control guide below', 3000);
    }
    
    shareScore() {
        this.showMessage('SHARE', 'Score copied to clipboard!', 2000);
        navigator.clipboard.writeText(`I scored ${this.score} in QUANTUMSERPENT!`);
    }
    
    // ===== INPUT HANDLING =====
    handleKeyDown(e) {
        if (this.state === 'menu') return;
        
        switch(e.key.toLowerCase()) {
            case ' ':
            case 'p':
            case 'escape':
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
                this.activateAbility('shield');
                break;
                
            case '2':
            case 'b':
                this.activateAbility('boost');
                break;
                
            case '3':
            case 'q':
                this.activateAbility('teleport');
                break;
                
            case '4':
            case 'm':
                this.activateAbility('magnet');
                break;
        }
    }
    
    changeDirection(direction) {
        if (this.state !== 'playing') return;
        
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
    
    // ===== ABILITIES =====
    activateAbility(ability) {
        if (this.state !== 'playing') return;
        if (this.abilities[ability].cooldown > 0) return;
        
        switch(ability) {
            case 'shield':
                this.activateShield();
                break;
            case 'boost':
                this.activateBoost();
                break;
            case 'teleport':
                this.activateTeleport();
                break;
            case 'magnet':
                this.activateMagnet();
                break;
        }
        
        this.updateAbilityUI(ability);
    }
    
    activateShield() {
        this.abilities.shield = {
            active: true,
            cooldown: CONFIG.ABILITIES.shield.cooldown,
            duration: CONFIG.ABILITIES.shield.duration
        };
        
        this.playSound('shield');
        this.showMessage('QUANTUM SHIELD', 'Invulnerability activated', 1500);
        this.createEffect(this.snake.x, this.snake.y, 'shield');
    }
    
    activateBoost() {
        this.abilities.boost = {
            active: true,
            cooldown: CONFIG.ABILITIES.boost.cooldown,
            duration: CONFIG.ABILITIES.boost.duration
        };
        
        this.speedMultiplier = 2.0;
        setTimeout(() => {
            this.speedMultiplier = 1.0;
        }, CONFIG.ABILITIES.boost.duration * 1000);
        
        this.playSound('boost');
        this.showMessage('TIME WARP', 'Speed doubled', 1500);
        this.createEffect(this.snake.x, this.snake.y, 'boost');
    }
    
    activateTeleport() {
        this.abilities.teleport = {
            active: true,
            cooldown: CONFIG.ABILITIES.teleport.cooldown
        };
        
        this.teleportSnake();
        this.playSound('teleport');
        this.showMessage('QUANTUM JUMP', 'Teleport successful', 1500);
        this.createEffect(this.snake.x, this.snake.y, 'teleport');
    }
    
    activateMagnet() {
        this.abilities.magnet = {
            active: true,
            cooldown: CONFIG.ABILITIES.magnet.cooldown,
            duration: CONFIG.ABILITIES.magnet.duration
        };
        
        this.playSound('powerup');
        this.showMessage('PARTICLE MAGNET', 'Attracting particles', 1500);
        this.createEffect(this.snake.x, this.snake.y, 'magnet');
    }
    
    teleportSnake() {
        let newX, newY;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            newX = Math.floor(Math.random() * this.gridWidth) * this.gridSize;
            newY = Math.floor(Math.random() * this.gridHeight) * this.gridSize;
            attempts++;
            
            // Check if position is safe
            let safe = true;
            for (const obstacle of this.obstacles) {
                if (obstacle.x === newX && obstacle.y === newY) {
                    safe = false;
                    break;
                }
            }
            
            if (safe) {
                // Create teleport effects
                this.createEffect(this.snake.x, this.snake.y, 'teleport-out');
                this.snake.x = newX;
                this.snake.y = newY;
                this.createEffect(newX, newY, 'teleport-in');
                
                // Move all snake cells to new position
                this.snake.cells = [];
                for (let i = 0; i < this.snake.maxCells; i++) {
                    this.snake.cells.push({
                        x: newX - (i * this.gridSize),
                        y: newY,
                        angle: 0,
                        pulse: i * 0.2
                    });
                }
                break;
            }
        } while (attempts < maxAttempts);
    }
    
    updateAbilityUI(ability) {
        const card = document.getElementById(`${ability}-ability`);
        if (!card) return;
        
        const statusEl = card.querySelector('.ability-status');
        const cooldownEl = card.querySelector('.ability-cooldown');
        const abilityState = this.abilities[ability];
        
        if (abilityState.cooldown > 0) {
            card.classList.add('cooldown');
            statusEl.textContent = 'CD';
            statusEl.className = 'ability-status cooldown';
            
            // Animate cooldown
            const cooldownTime = CONFIG.ABILITIES[ability].cooldown;
            cooldownEl.style.transition = `transform ${cooldownTime}s linear`;
            cooldownEl.style.transform = 'scaleX(1)';
            
            setTimeout(() => {
                cooldownEl.style.transform = 'scaleX(0)';
                card.classList.remove('cooldown');
                statusEl.textContent = 'READY';
                statusEl.className = 'ability-status ready';
            }, abilityState.cooldown * 1000);
        } else if (abilityState.active) {
            statusEl.textContent = 'ACTIVE';
            statusEl.className = 'ability-status ready';
        } else {
            statusEl.textContent = 'READY';
            statusEl.className = 'ability-status ready';
        }
    }
    
    updateAllAbilityUI() {
        Object.keys(this.abilities).forEach(ability => this.updateAbilityUI(ability));
    }
    
    // ===== GAME LOGIC =====
    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        this.timeAlive += deltaTime / 1000;
        
        // Update abilities
        this.updateAbilities(deltaTime);
        
        // Move snake
        this.updateSnake(deltaTime);
        
        // Update effects
        this.updateEffects(deltaTime);
        
        // Spawn objects
        this.spawnObjects();
        
        // Increase difficulty
        this.increaseDifficulty();
        
        // Update UI
        this.updateGameUI();
    }
    
    updateAbilities(deltaTime) {
        Object.keys(this.abilities).forEach(ability => {
            const state = this.abilities[ability];
            
            if (state.duration > 0) {
                state.duration -= deltaTime / 1000;
                if (state.duration <= 0) {
                    state.active = false;
                    if (ability === 'boost') {
                        this.speedMultiplier = 1.0;
                    }
                }
            }
            
            if (state.cooldown > 0) {
                state.cooldown -= deltaTime / 1000;
            }
        });
    }
    
    updateSnake(deltaTime) {
        const moveInterval = 1000 / (this.speed * this.speedMultiplier);
        const now = performance.now();
        
        if (now - this.lastMoveTime > moveInterval) {
            this.lastMoveTime = now;
            
            // Add trail
            this.trail.push({
                x: this.snake.x,
                y: this.snake.y,
                alpha: 1,
                life: 1.0
            });
            if (this.trail.length > 30) this.trail.shift();
            
            // Update trail
            this.trail.forEach(point => {
                point.life -= 0.03;
                point.alpha = point.life;
            });
            
            // Move snake
            this.snake.x += this.snake.dx;
            this.snake.y += this.snake.dy;
            
            // Wrap around screen
            if (this.snake.x >= this.canvas.width) this.snake.x = 0;
            if (this.snake.x < 0) this.snake.x = this.canvas.width - this.gridSize;
            if (this.snake.y >= this.canvas.height) this.snake.y = 0;
            if (this.snake.y < 0) this.snake.y = this.canvas.height - this.gridSize;
            
            // Add new head
            this.snake.cells.unshift({
                x: this.snake.x,
                y: this.snake.y,
                angle: Math.atan2(this.snake.dy, this.snake.dx),
                pulse: 0
            });
            
            // Maintain length
            if (this.snake.cells.length > this.snake.maxCells) {
                this.snake.cells.pop();
            }
            
            // Update cell pulses
            this.snake.cells.forEach((cell, i) => {
                cell.pulse += 0.1;
            });
            
            // Check collisions
            this.checkCollisions();
            
            // Check particle collection
            this.checkParticleCollection();
            
            // Check powerup collection
            this.checkPowerupCollection();
            
            // Apply magnet effect
            if (this.abilities.magnet.active) {
                this.applyMagnetEffect();
            }
        }
    }
    
    checkCollisions() {
        // Self collision
        for (let i = 1; i < this.snake.cells.length; i++) {
            if (this.snake.cells[i].x === this.snake.x && this.snake.cells[i].y === this.snake.y) {
                if (!this.abilities.shield.active) {
                    this.gameOver();
                    return;
                } else {
                    // Shield protects from self-collision
                    this.snake.cells.splice(i, this.snake.cells.length - i);
                    this.snake.maxCells = this.snake.cells.length;
                    this.showMessage('SHIELD ABSORBED', 'Impact negated', 1000);
                }
            }
        }
        
        // Obstacle collision
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            if (this.snake.x === obstacle.x && this.snake.y === obstacle.y) {
                if (!this.abilities.shield.active) {
                    this.gameOver();
                    return;
                } else {
                    // Destroy obstacle with shield
                    this.obstacles.splice(i, 1);
                    this.score += 100;
                    this.showMessage('OBSTACLE DESTROYED', '+100 points', 800);
                    this.createEffect(obstacle.x, obstacle.y, 'explosion');
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
                const points = Math.floor(CONFIG.PARTICLE_VALUE * this.comboMultiplier);
                this.score += points;
                this.particlesCollected++;
                this.combo++;
                
                if (this.combo > this.maxCombo) {
                    this.maxCombo = this.combo;
                }
                
                // Update combo
                this.updateCombo();
                
                // Play sound
                this.playSound('collect');
                if (this.combo > 1) {
                    this.playSound('combo');
                }
                
                // Create collection effect
                this.createEffect(particle.x, particle.y, 'collect');
                
                // Grow snake every 5 particles
                if (this.particlesCollected % 5 === 0) {
                    this.snake.maxCells++;
                    this.showMessage('NEURAL EXPANSION', 'Length increased', 800);
                }
                
                break;
            }
        }
    }
    
    checkPowerupCollection() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            
            if (this.snake.x === powerup.x && this.snake.y === powerup.y) {
                this.powerups.splice(i, 1);
                this.activateAbility(powerup.type);
                this.createEffect(powerup.x, powerup.y, 'powerup');
                break;
            }
        }
    }
    
    applyMagnetEffect() {
        const magnetRadius = this.gridSize * 10;
        const magnetStrength = this.gridSize * 0.8;
        
        this.particles.forEach(particle => {
            const dx = this.snake.x - particle.x;
            const dy = this.snake.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < magnetRadius && distance > 0) {
                const angle = Math.atan2(dy, dx);
                const force = magnetStrength * (1 - distance / magnetRadius);
                
                particle.x += Math.cos(angle) * force;
                particle.y += Math.sin(angle) * force;
                
                // Wrap around
                if (particle.x >= this.canvas.width) particle.x = 0;
                if (particle.x < 0) particle.x = this.canvas.width - this.gridSize;
                if (particle.y >= this.canvas.height) particle.y = 0;
                if (particle.y < 0) particle.y = this.canvas.height - this.gridSize;
            }
        });
    }
    
    updateCombo() {
        // Update combo multiplier
        this.comboMultiplier = 1 + Math.min(this.combo * CONFIG.COMBO.multiplier, CONFIG.COMBO.maxMultiplier);
        
        // Update combo UI
        this.updateComboUI();
        
        // Clear existing timeout
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
        }
        
        // Set new timeout
        this.comboTimeout = setTimeout(() => {
            if (this.combo > 1) {
                this.showMessage(`COMBO x${this.combo}`, 'Complete!', 1000);
            }
            this.combo = 0;
            this.comboMultiplier = 1.0;
            this.updateComboUI();
        }, CONFIG.COMBO.timeout);
    }
    
    // ===== OBJECT SPAWNING =====
    spawnObjects() {
        const now = performance.now();
        
        // Spawn particles
        if (this.particles.length < CONFIG.MAX_PARTICLES && 
            now - this.lastParticleSpawn > 2000 * CONFIG.DIFFICULTY[this.difficulty].spawnRate) {
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
            const { x, y } = this.findEmptyPosition();
            this.particles.push({
                x, y,
                size: this.gridSize * 0.6,
                color: '#00f3ff',
                pulse: Math.random() * Math.PI * 2,
                rotation: Math.random() * Math.PI * 2
            });
        }
    }
    
    spawnObstacles(count) {
        for (let i = 0; i < count; i++) {
            const { x, y } = this.findEmptyPosition(this.gridSize * 5);
            this.obstacles.push({
                x, y,
                size: this.gridSize,
                color: '#ff5555',
                rotation: Math.random() * Math.PI * 2,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }
    
    spawnPowerup() {
        const types = ['shield', 'boost', 'teleport', 'magnet'];
        const type = types[Math.floor(Math.random() * types.length)];
        const { x, y } = this.findEmptyPosition(this.gridSize * 3);
        
        this.powerups.push({
            x, y,
            type,
            size: this.gridSize,
            pulse: 0,
            rotation: 0
        });
    }
    
    findEmptyPosition(minDistance = 0) {
        let x, y;
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
            x = Math.floor(Math.random() * this.gridWidth) * this.gridSize;
            y = Math.floor(Math.random() * this.gridHeight) * this.gridSize;
            attempts++;
            
            // Check distance from snake
            let safe = true;
            if (minDistance > 0) {
                for (const cell of this.snake.cells) {
                    const dx = cell.x - x;
                    const dy = cell.y - y;
                    if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
                        safe = false;
                        break;
                    }
                }
            }
            
            // Check other objects
            if (safe) {
                const allObjects = [...this.obstacles, ...this.particles, ...this.powerups];
                for (const obj of allObjects) {
                    if (obj.x === x && obj.y === y) {
                        safe = false;
                        break;
                    }
                }
            }
            
            if (safe || attempts >= maxAttempts) break;
        } while (true);
        
        return { x, y };
    }
    
    // ===== DIFFICULTY =====
    increaseDifficulty() {
        const now = performance.now();
        if (now - this.lastSpeedIncrease > CONFIG.SPEED_INCREASE_INTERVAL && 
            this.speed < CONFIG.MAX_SPEED) {
            this.speed++;
            this.lastSpeedIncrease = now;
            this.showMessage('SPEED INCREASED', 'Adapt to the flow', 1000);
        }
    }
    
    // ===== EFFECTS =====
    createEffect(x, y, type) {
        const effect = {
            x, y,
            type,
            life: 1.0,
            size: this.gridSize,
            rotation: 0,
            particles: []
        };
        
        switch(type) {
            case 'collect':
                // Create sparkle particles
                for (let i = 0; i < 8; i++) {
                    effect.particles.push({
                        x: 0, y: 0,
                        dx: Math.cos(i * Math.PI / 4) * 2,
                        dy: Math.sin(i * Math.PI / 4) * 2,
                        size: 4,
                        color: '#00f3ff',
                        life: 1.0
                    });
                }
                break;
                
            case 'explosion':
                // Create explosion particles
                for (let i = 0; i < 12; i++) {
                    effect.particles.push({
                        x: 0, y: 0,
                        dx: Math.cos(i * Math.PI / 6) * (Math.random() * 3 + 2),
                        dy: Math.sin(i * Math.PI / 6) * (Math.random() * 3 + 2),
                        size: Math.random() * 6 + 3,
                        color: '#ff5555',
                        life: 1.0
                    });
                }
                break;
                
            case 'shield':
                effect.size = this.gridSize * 2;
                break;
                
            case 'boost':
                effect.size = this.gridSize * 1.5;
                break;
        }
        
        this.effects.push(effect);
    }
    
    updateEffects(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.life -= deltaTime / 1000;
            
            if (effect.life <= 0) {
                this.effects.splice(i, 1);
                continue;
            }
            
            effect.rotation += 0.1;
            
            // Update particles
            effect.particles.forEach(particle => {
                particle.x += particle.dx;
                particle.y += particle.dy;
                particle.life -= 0.02;
            });
        }
    }
    
    // ===== GAME OVER =====
    gameOver() {
        this.state = 'gameover';
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('quantumSerpentHighScore', this.highScore);
        }
        
        // Play game over sound
        this.playSound('gameover');
        this.audio.bgMusic.pause();
        
        // Create explosion effect
        this.createEffect(this.snake.x, this.snake.y, 'explosion');
        
        // Update game over screen
        this.updateGameOverScreen();
        
        // Update leaderboard
        this.updateLeaderboard();
        
        // Show game over screen
        setTimeout(() => {
            document.getElementById('game-over-screen').style.display = 'flex';
        }, 1500);
    }
    
    // ===== UI UPDATES =====
    updateGameUI() {
        // Update stats
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('speed').textContent = `${(this.speed * this.speedMultiplier).toFixed(1)}x`;
        document.getElementById('length').textContent = this.snake ? this.snake.cells.length : 0;
        document.getElementById('particles').textContent = this.particlesCollected;
        document.getElementById('uptime').textContent = this.formatTime(this.timeAlive);
        document.getElementById('high-score').textContent = this.highScore.toLocaleString();
        
        // Update mission
        this.updateMissionUI();
        
        // Update performance metrics (simulated)
        this.updatePerformanceMetrics();
        
        // Update FPS
        this.updateFPS();
    }
    
    updateMissionUI() {
        const particleProgress = Math.min(100, (this.particlesCollected / 50) * 100);
        const lengthProgress = Math.min(100, ((this.snake?.cells.length || 0) / 20) * 100);
        const timeProgress = Math.min(100, (this.timeAlive / 300) * 100);
        this.missionProgress = (particleProgress + lengthProgress + timeProgress) / 3;
        
        document.getElementById('mission-progress').style.width = `${this.missionProgress}%`;
        document.getElementById('progress-percent').textContent = `${Math.floor(this.missionProgress)}%`;
        document.getElementById('particles-needed').textContent = this.particlesCollected;
        document.getElementById('length-target').textContent = this.snake?.cells.length || 0;
        document.getElementById('mission-time').textContent = this.formatTime(this.timeAlive);
    }
    
    updateComboUI() {
        const comboValue = document.getElementById('combo-value');
        const comboMultiplier = document.getElementById('combo-multiplier');
        const comboFill = document.getElementById('combo-fill');
        const comboTime = document.getElementById('combo-time');
        
        comboValue.textContent = `${this.combo}x`;
        comboMultiplier.textContent = `+${Math.floor((this.comboMultiplier - 1) * 100)}%`;
        
        // Animate combo value
        if (this.combo > 0) {
            const scale = 1 + (this.combo * 0.05);
            comboValue.style.transform = `scale(${scale})`;
            comboValue.style.color = this.getComboColor(this.combo);
        } else {
            comboValue.style.transform = 'scale(1)';
            comboValue.style.color = '#ff00ff';
        }
        
        // Update combo bar
        comboFill.style.width = `${(this.combo / 10) * 100}%`;
        comboTime.textContent = `${(CONFIG.COMBO.timeout / 1000).toFixed(1)}s`;
    }
    
    getComboColor(combo) {
        if (combo >= 10) return '#ff0000';
        if (combo >= 7) return '#ff8800';
        if (combo >= 5) return '#ffff00';
        if (combo >= 3) return '#88ff00';
        return '#00ffff';
    }
    
    updatePerformanceMetrics() {
        // Simulated performance data
        const cpuLoad = 30 + (this.speed / CONFIG.MAX_SPEED) * 40 + Math.random() * 5;
        const gpuLoad = 25 + (this.speed / CONFIG.MAX_SPEED) * 45 + Math.random() * 5;
        const memLoad = 40 + (this.particlesCollected / 100) * 30 + Math.random() * 10;
        
        document.getElementById('cpu-bar').style.width = `${cpuLoad}%`;
        document.getElementById('gpu-bar').style.width = `${gpuLoad}%`;
        document.getElementById('mem-bar').style.width = `${memLoad}%`;
        
        document.getElementById('cpu-value').textContent = `${Math.floor(cpuLoad)}%`;
        document.getElementById('gpu-value').textContent = `${Math.floor(gpuLoad)}%`;
        document.getElementById('mem-value').textContent = `${Math.floor(memLoad)}%`;
    }
    
    updateFPS() {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastFPSUpdate > 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = now;
            
            document.getElementById('fps').textContent = this.fps;
        }
    }
    
    updatePauseScreen() {
        document.getElementById('pause-score').textContent = this.score.toLocaleString();
        document.getElementById('pause-time').textContent = this.formatTime(this.timeAlive);
        document.getElementById('pause-particles').textContent = this.particlesCollected;
        document.getElementById('pause-combo').textContent = `${this.combo}x`;
    }
    
    updateGameOverScreen() {
        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-time').textContent = this.formatTime(this.timeAlive);
        document.getElementById('final-particles').textContent = this.particlesCollected;
        document.getElementById('final-length').textContent = this.snake?.cells.length || 0;
        document.getElementById('final-speed').textContent = `${this.speed}x`;
        document.getElementById('final-combo').textContent = `${this.maxCombo}x`;
    }
    
    updateLeaderboard() {
        let leaderboard = JSON.parse(localStorage.getItem('quantumSerpentLeaderboard')) || [];
        
        if (this.state === 'gameover') {
            leaderboard.push({
                name: 'AGENT-7A9B',
                score: this.score,
                time: this.timeAlive,
                difficulty: this.difficulty,
                date: new Date().toISOString()
            });
            
            leaderboard.sort((a, b) => b.score - a.score);
            leaderboard = leaderboard.slice(0, 10);
            
            localStorage.setItem('quantumSerpentLeaderboard', JSON.stringify(leaderboard));
        }
        
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
    
    // ===== RENDERING =====
    render() {
        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(10, 10, 32, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw trail
        this.drawTrail();
        
        // Draw effects
        this.effects.forEach(effect => this.drawEffect(effect));
        
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
        
        // Draw shield
        if (this.abilities.shield.active) {
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
        this.trail.forEach(point => {
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
        particle.rotation += 0.05;
        const pulse = Math.sin(particle.pulse) * 0.2 + 0.8;
        const size = particle.size * pulse;
        
        // Save context
        this.ctx.save();
        this.ctx.translate(particle.x + this.gridSize / 2, particle.y + this.gridSize / 2);
        this.ctx.rotate(particle.rotation);
        
        // Outer glow
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, 'rgba(0, 243, 255, 0.8)');
        gradient.addColorStop(0.7, 'rgba(0, 200, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Inner core
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.gridSize * 0.2, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00f3ff';
        this.ctx.fill();
        
        // Sparkle effect
        if (Math.random() < 0.1) {
            const angle = Math.random() * Math.PI * 2;
            const sparkleX = Math.cos(angle) * (size * 0.8);
            const sparkleY = Math.sin(angle) * (size * 0.8);
            
            this.ctx.beginPath();
            this.ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    drawObstacle(obstacle) {
        const time = performance.now() / 1000;
        obstacle.pulse += 0.05;
        obstacle.rotation += 0.02;
        const pulse = Math.sin(obstacle.pulse) * 0.1 + 0.9;
        
        this.ctx.save();
        this.ctx.translate(obstacle.x + this.gridSize / 2, obstacle.y + this.gridSize / 2);
        this.ctx.rotate(obstacle.rotation);
        
        // Outer glow
        this.ctx.shadowColor = '#ff5555';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = `rgba(255, 85, 85, ${0.3 * pulse})`;
        this.ctx.fillRect(-this.gridSize / 2 - 5, -this.gridSize / 2 - 5, this.gridSize + 10, this.gridSize + 10);
        this.ctx.shadowBlur = 0;
        
        // Main body
        this.ctx.fillStyle = '#ff5555';
        this.ctx.fillRect(-this.gridSize / 2, -this.gridSize / 2, this.gridSize, this.gridSize);
        
        // Inner pattern
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(-this.gridSize / 2 + 4, -this.gridSize / 2 + 4, this.gridSize - 8, this.gridSize - 8);
        
        // Hazard symbol
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.gridSize / 2 + 8);
        this.ctx.lineTo(0, this.gridSize / 2 - 8);
        this.ctx.moveTo(-this.gridSize / 2 + 8, 0);
        this.ctx.lineTo(this.gridSize / 2 - 8, 0);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawPowerup(powerup) {
        const time = performance.now() / 1000;
        powerup.pulse += 0.1;
        powerup.rotation += 0.03;
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
        
        this.ctx.save();
        this.ctx.translate(powerup.x + this.gridSize / 2, powerup.y + this.gridSize / 2);
        this.ctx.rotate(powerup.rotation);
        
        // Glow effect
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 30 * pulse;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(-powerup.size / 2, -powerup.size / 2, powerup.size, powerup.size);
        this.ctx.shadowBlur = 0;
        
        // Symbol
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${this.gridSize * 0.8}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(symbol, 0, 0);
        
        this.ctx.restore();
    }
    
    drawSnake() {
        this.snake.cells.forEach((cell, index) => {
            const alpha = 1 - (index / this.snake.cells.length) * 0.5;
            const pulse = Math.sin(cell.pulse) * 0.1 + 0.9;
            const size = this.gridSize * (0.9 + (index === 0 ? 0.2 : 0)) * pulse;
            
            this.ctx.save();
            this.ctx.translate(cell.x + this.gridSize / 2, cell.y + this.gridSize / 2);
            if (index === 0) {
                this.ctx.rotate(cell.angle);
            }
            
            // Cell body
            this.ctx.fillStyle = `rgba(0, 243, 255, ${alpha})`;
            this.ctx.fillRect(-size / 2, -size / 2, size, size);
            
            // Inner highlight
            this.ctx.fillStyle = `rgba(200, 255, 255, ${alpha * 0.5})`;
            this.ctx.fillRect(-size / 2 + 2, -size / 2 + 2, size - 4, size - 4);
            
            // Grid pattern
            this.ctx.strokeStyle = `rgba(0, 200, 255, ${alpha * 0.3})`;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(-size / 2, -size / 2, size, size);
            
            // Head effects
            if (index === 0) {
                // Eyes
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(-size * 0.2, -size * 0.2, size * 0.1, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(size * 0.2, -size * 0.2, size * 0.1, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Head glow
                this.ctx.shadowColor = '#00f3ff';
                this.ctx.shadowBlur = 30;
                this.ctx.fillStyle = `rgba(0, 243, 255, ${alpha * 0.3})`;
                this.ctx.fillRect(-size / 2 - 10, -size / 2 - 10, size + 20, size + 20);
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.restore();
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
    
    drawEffect(effect) {
        const alpha = effect.life;
        
        switch(effect.type) {
            case 'collect':
                // Draw sparkle particles
                effect.particles.forEach(particle => {
                    if (particle.life <= 0) return;
                    
                    this.ctx.fillStyle = `rgba(0, 243, 255, ${particle.life})`;
                    this.ctx.beginPath();
                    this.ctx.arc(
                        effect.x + this.gridSize / 2 + particle.x,
                        effect.y + this.gridSize / 2 + particle.y,
                        particle.size * particle.life,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fill();
                });
                break;
                
            case 'explosion':
                // Draw explosion particles
                effect.particles.forEach(particle => {
                    if (particle.life <= 0) return;
                    
                    this.ctx.fillStyle = `rgba(255, 85, 85, ${particle.life})`;
                    this.ctx.beginPath();
                    this.ctx.arc(
                        effect.x + this.gridSize / 2 + particle.x,
                        effect.y + this.gridSize / 2 + particle.y,
                        particle.size * particle.life,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fill();
                });
                break;
                
            case 'shield':
                const shieldRadius = effect.size * alpha;
                const shieldGradient = this.ctx.createRadialGradient(
                    effect.x + this.gridSize / 2,
                    effect.y + this.gridSize / 2,
                    0,
                    effect.x + this.gridSize / 2,
                    effect.y + this.gridSize / 2,
                    shieldRadius
                );
                shieldGradient.addColorStop(0, `rgba(0, 200, 255, ${alpha * 0.3})`);
                shieldGradient.addColorStop(1, `rgba(0, 100, 255, 0)`);
                
                this.ctx.beginPath();
                this.ctx.arc(effect.x + this.gridSize / 2, effect.y + this.gridSize / 2, shieldRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = shieldGradient;
                this.ctx.fill();
                break;
        }
    }
    
    // ===== UTILITIES =====
    showMessage(title, subtitle, duration = 2000) {
        const titleEl = document.getElementById('game-message');
        const subtitleEl = document.getElementById('message-subtitle');
        
        titleEl.textContent = title;
        subtitleEl.textContent = subtitle;
        
        titleEl.style.opacity = '1';
        subtitleEl.style.opacity = '1';
        
        setTimeout(() => {
            titleEl.style.opacity = '0';
            subtitleEl.style.opacity = '0';
        }, duration);
    }
    
    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    playSound(type) {
        const audio = this.audio[type];
        if (audio && this.audio.enabled) {
            audio.currentTime = 0;
            audio.play().catch(console.log);
        }
    }
    
    // ===== GAME LOOP =====
    gameLoop() {
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        // Update game
        this.update(deltaTime);
        
        // Render game
        this.render();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ===== INITIALIZE GAME =====
window.addEventListener('load', () => {
    const game = new QuantumSerpent();
    
    // Add logo letter animations
    document.querySelectorAll('.logo-letter').forEach((letter, index) => {
        letter.style.setProperty('--delay', `${index * 0.1}s`);
    });
});
