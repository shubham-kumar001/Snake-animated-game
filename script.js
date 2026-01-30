// Game Configuration
const config = {
    gridSize: 20,
    initialSpeed: 150,
    minSpeed: 80,
    speedStep: 10,
    foodPoints: 10,
    foodSpawnInterval: 10000, // 10 seconds
    canvasSize: 600
};

// Game State
let game = {
    snake: [],
    food: {},
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    score: 0,
    highScore: localStorage.getItem('snakeHighScore') || 0,
    speed: config.initialSpeed,
    gameLoop: null,
    isPaused: false,
    isGameOver: false,
    foodEaten: 0,
    level: 1,
    powerUps: 0,
    foodTimer: 10,
    foodTimerInterval: null,
    gridSize: config.gridSize,
    cellSize: config.canvasSize / config.gridSize
};

// DOM Elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const lengthElement = document.getElementById('length');
const foodEatenElement = document.getElementById('food-eaten');
const speedElement = document.getElementById('speed');
const levelElement = document.getElementById('level');
const powerUpsElement = document.getElementById('power-ups');
const foodTimerElement = document.getElementById('food-timer');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const speedUpBtn = document.getElementById('speed-up');
const speedDownBtn = document.getElementById('speed-down');
const speedDisplay = document.getElementById('speed-display');
const gameOverModal = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const finalLengthElement = document.getElementById('final-length');
const finalFoodElement = document.getElementById('final-food');
const playAgainBtn = document.getElementById('play-again-btn');

// Initialize Game
function initGame() {
    // Reset game state
    game.snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    
    game.direction = { x: 1, y: 0 };
    game.nextDirection = { x: 1, y: 0 };
    game.score = 0;
    game.speed = config.initialSpeed;
    game.isPaused = false;
    game.isGameOver = false;
    game.foodEaten = 0;
    game.level = 1;
    game.powerUps = 0;
    
    // Update UI
    updateUI();
    
    // Spawn initial food
    spawnFood();
    
    // Clear any existing game loop
    if (game.gameLoop) {
        clearInterval(game.gameLoop);
    }
    
    // Start food timer
    startFoodTimer();
    
    // Draw initial state
    draw();
    
    // Hide game over modal
    gameOverModal.style.display = 'none';
    
    // Update start button text
    startBtn.innerHTML = '<i class="fas fa-play"></i> START GAME';
}

// Start Food Timer
function startFoodTimer() {
    if (game.foodTimerInterval) {
        clearInterval(game.foodTimerInterval);
    }
    
    game.foodTimer = 10;
    updateFoodTimer();
    
    game.foodTimerInterval = setInterval(() => {
        if (!game.isPaused && !game.isGameOver) {
            game.foodTimer--;
            updateFoodTimer();
            
            if (game.foodTimer <= 0) {
                spawnFood();
                game.foodTimer = 10;
                updateFoodTimer();
            }
        }
    }, 1000);
}

// Update Food Timer Display
function updateFoodTimer() {
    foodTimerElement.textContent = game.foodTimer;
    foodTimerElement.style.color = game.foodTimer <= 3 ? '#ff5555' : '#00ffaa';
}

// Spawn Food at Random Position
function spawnFood() {
    let newFood;
    let foodOnSnake;
    
    do {
        foodOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * game.gridSize),
            y: Math.floor(Math.random() * game.gridSize),
            type: Math.random() > 0.9 ? 'powerup' : 'normal' // 10% chance of powerup
        };
        
        // Check if food spawns on snake
        for (let segment of game.snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                foodOnSnake = true;
                break;
            }
        }
    } while (foodOnSnake);
    
    game.food = newFood;
    game.foodTimer = 10;
    updateFoodTimer();
}

// Update Game State
function update() {
    if (game.isPaused || game.isGameOver) return;
    
    // Update direction
    game.direction = { ...game.nextDirection };
    
    // Calculate new head position
    const head = { ...game.snake[0] };
    head.x += game.direction.x;
    head.y += game.direction.y;
    
    // Check wall collision
    if (head.x < 0 || head.x >= game.gridSize || head.y < 0 || head.y >= game.gridSize) {
        gameOver();
        return;
    }
    
    // Check self collision
    for (let segment of game.snake) {
        if (segment.x === head.x && segment.y === head.y) {
            gameOver();
            return;
        }
    }
    
    // Add new head to snake
    game.snake.unshift(head);
    
    // Check food collision
    if (head.x === game.food.x && head.y === game.food.y) {
        // Increase score
        const points = game.food.type === 'powerup' ? config.foodPoints * 3 : config.foodPoints;
        game.score += points;
        game.foodEaten++;
        
        // Update level
        game.level = Math.floor(game.foodEaten / 5) + 1;
        
        // Increase speed with level (with a maximum limit)
        if (game.foodEaten % 5 === 0 && game.speed > config.minSpeed) {
            game.speed = Math.max(config.minSpeed, game.speed - config.speedStep);
        }
        
        // Update power-ups count
        if (game.food.type === 'powerup') {
            game.powerUps++;
        }
        
        // Spawn new food
        spawnFood();
    } else {
        // Remove tail if no food eaten
        game.snake.pop();
    }
    
    // Update UI
    updateUI();
}

// Draw Game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a1520';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw snake
    drawSnake();
    
    // Draw food
    drawFood();
    
    // Draw score on canvas
    drawCanvasScore();
}

// Draw Grid
function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.1)';
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = 0; x <= game.gridSize; x++) {
        ctx.beginPath();
        ctx.moveTo(x * game.cellSize, 0);
        ctx.lineTo(x * game.cellSize, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= game.gridSize; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * game.cellSize);
        ctx.lineTo(canvas.width, y * game.cellSize);
        ctx.stroke();
    }
}

// Draw Snake
function drawSnake() {
    // Draw each segment
    for (let i = 0; i < game.snake.length; i++) {
        const segment = game.snake[i];
        
        // Gradient for snake (head is brighter)
        const gradient = i === 0 
            ? ctx.createLinearGradient(
                segment.x * game.cellSize, 
                segment.y * game.cellSize, 
                segment.x * game.cellSize + game.cellSize, 
                segment.y * game.cellSize + game.cellSize
              )
            : ctx.createLinearGradient(
                segment.x * game.cellSize, 
                segment.y * game.cellSize, 
                segment.x * game.cellSize + game.cellSize, 
                segment.y * game.cellSize + game.cellSize
              );
        
        if (i === 0) {
            // Head gradient
            gradient.addColorStop(0, '#00ffaa');
            gradient.addColorStop(1, '#00aaff');
        } else {
            // Body gradient (darker towards tail)
            const intensity = 1 - (i / game.snake.length) * 0.7;
            gradient.addColorStop(0, `rgba(0, ${Math.floor(255 * intensity)}, ${Math.floor(200 * intensity)}, 1)`);
            gradient.addColorStop(1, `rgba(0, ${Math.floor(200 * intensity)}, ${Math.floor(255 * intensity)}, 1)`);
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            segment.x * game.cellSize + 1, 
            segment.y * game.cellSize + 1, 
            game.cellSize - 2, 
            game.cellSize - 2
        );
        
        // Add inner highlight
        ctx.fillStyle = i === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(
            segment.x * game.cellSize + 3, 
            segment.y * game.cellSize + 3, 
            game.cellSize - 6, 
            game.cellSize - 6
        );
        
        // Draw eyes on head
        if (i === 0) {
            ctx.fillStyle = '#001122';
            
            // Left eye
            ctx.beginPath();
            const leftEyeX = game.direction.x === 1 ? segment.x * game.cellSize + game.cellSize - 6 : 
                           game.direction.x === -1 ? segment.x * game.cellSize + 6 : 
                           segment.x * game.cellSize + game.cellSize / 2 - 3;
            const leftEyeY = game.direction.y === 1 ? segment.y * game.cellSize + game.cellSize - 6 : 
                           game.direction.y === -1 ? segment.y * game.cellSize + 6 : 
                           segment.y * game.cellSize + game.cellSize / 2 - 3;
            ctx.arc(leftEyeX, leftEyeY, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Right eye
            ctx.beginPath();
            const rightEyeX = game.direction.x === 1 ? segment.x * game.cellSize + game.cellSize - 6 : 
                            game.direction.x === -1 ? segment.x * game.cellSize + 6 : 
                            segment.x * game.cellSize + game.cellSize / 2 + 3;
            const rightEyeY = game.direction.y === 1 ? segment.y * game.cellSize + game.cellSize - 6 : 
                            game.direction.y === -1 ? segment.y * game.cellSize + 6 : 
                            segment.y * game.cellSize + game.cellSize / 2 + 3;
            ctx.arc(rightEyeX, rightEyeY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Draw Food
function drawFood() {
    if (!game.food) return;
    
    const x = game.food.x * game.cellSize;
    const y = game.food.y * game.cellSize;
    
    // Create gradient for food
    const gradient = ctx.createRadialGradient(
        x + game.cellSize/2, 
        y + game.cellSize/2, 
        0,
        x + game.cellSize/2, 
        y + game.cellSize/2, 
        game.cellSize/2
    );
    
    if (game.food.type === 'powerup') {
        // Power-up food (glowing)
        gradient.addColorStop(0, '#ffaa00');
        gradient.addColorStop(0.7, '#ff5500');
        gradient.addColorStop(1, 'rgba(255, 85, 0, 0)');
        
        // Add pulsing effect
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        ctx.globalAlpha = pulse;
    } else {
        // Normal food
        gradient.addColorStop(0, '#ff3366');
        gradient.addColorStop(0.7, '#ff0066');
        gradient.addColorStop(1, 'rgba(255, 0, 102, 0)');
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(
        x + game.cellSize/2, 
        y + game.cellSize/2, 
        game.cellSize/2 - 2, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
    
    // Reset global alpha
    ctx.globalAlpha = 1;
    
    // Add shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(
        x + game.cellSize/2 - 3, 
        y + game.cellSize/2 - 3, 
        3, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
}

// Draw Score on Canvas
function drawCanvasScore() {
    ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.font = 'bold 16px Orbitron';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${game.score}`, 10, 25);
    ctx.fillText(`LENGTH: ${game.snake.length}`, 10, 50);
    ctx.fillText(`LEVEL: ${game.level}`, canvas.width - 100, 25);
    ctx.fillText(`SPEED: ${getSpeedLabel()}`, canvas.width - 100, 50);
    
    // Pause indicator
    if (game.isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ffaa';
        ctx.font = 'bold 40px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('GAME PAUSED', canvas.width/2, canvas.height/2 - 20);
        ctx.font = '20px Exo 2';
        ctx.fillText('Press SPACE to resume', canvas.width/2, canvas.height/2 + 30);
    }
}

// Update UI Elements
function updateUI() {
    scoreElement.textContent = game.score;
    lengthElement.textContent = game.snake.length;
    foodEatenElement.textContent = game.foodEaten;
    levelElement.textContent = game.level;
    powerUpsElement.textContent = game.powerUps;
    speedElement.textContent = getSpeedLabel();
    speedDisplay.textContent = getSpeedLabel();
    
    // Update high score
    if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('snakeHighScore', game.highScore);
    }
    highScoreElement.textContent = game.highScore;
}

// Get Speed Label
function getSpeedLabel() {
    if (game.speed >= 140) return 'SLOW';
    if (game.speed >= 100) return 'NORMAL';
    if (game.speed >= 80) return 'FAST';
    return 'EXTREME';
}

// Game Over
function gameOver() {
    game.isGameOver = true;
    
    // Clear intervals
    clearInterval(game.gameLoop);
    clearInterval(game.foodTimerInterval);
    
    // Update final stats
    finalScoreElement.textContent = game.score;
    finalLengthElement.textContent = game.snake.length;
    finalFoodElement.textContent = game.foodEaten;
    
    // Show game over modal
    setTimeout(() => {
        gameOverModal.style.display = 'flex';
    }, 500);
}

// Start Game Loop
function startGame() {
    if (game.gameLoop) {
        clearInterval(game.gameLoop);
    }
    
    game.isPaused = false;
    game.gameLoop = setInterval(() => {
        update();
        draw();
    }, game.speed);
    
    startBtn.innerHTML = '<i class="fas fa-play"></i> GAME RUNNING';
}

// Pause/Resume Game
function togglePause() {
    game.isPaused = !game.isPaused;
    
    if (game.isPaused) {
        pauseBtn.innerHTML = '<i class="fas fa-play"></i> RESUME';
        clearInterval(game.gameLoop);
    } else {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> PAUSE';
        startGame();
    }
    
    // Update canvas to show pause screen
    draw();
}

// Change Speed
function changeSpeed(amount) {
    const newSpeed = game.speed - (amount * config.speedStep);
    
    // Limit speed range
    if (newSpeed >= config.minSpeed && newSpeed <= config.initialSpeed) {
        game.speed = newSpeed;
        
        // If game is running, restart game loop with new speed
        if (!game.isPaused && !game.isGameOver) {
            clearInterval(game.gameLoop);
            startGame();
        }
        
        // Update UI
        updateUI();
    }
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    // Prevent default behavior for arrow keys and space
    if ([37, 38, 39, 40, 32].includes(e.keyCode)) {
        e.preventDefault();
    }
    
    switch(e.key) {
        case 'ArrowUp':
            if (game.direction.y === 0) {
                game.nextDirection = { x: 0, y: -1 };
            }
            break;
        case 'ArrowDown':
            if (game.direction.y === 0) {
                game.nextDirection = { x: 0, y: 1 };
            }
            break;
        case 'ArrowLeft':
            if (game.direction.x === 0) {
                game.nextDirection = { x: -1, y: 0 };
            }
            break;
        case 'ArrowRight':
            if (game.direction.x === 0) {
                game.nextDirection = { x: 1, y: 0 };
            }
            break;
        case ' ':
            togglePause();
            break;
        case 'r':
        case 'R':
            initGame();
            break;
    }
});

startBtn.addEventListener('click', () => {
    if (game.isGameOver) {
        initGame();
    } else if (!game.gameLoop || game.isPaused) {
        startGame();
    }
});

pauseBtn.addEventListener('click', togglePause);

restartBtn.addEventListener('click', initGame);

playAgainBtn.addEventListener('click', () => {
    initGame();
    startGame();
});

speedUpBtn.addEventListener('click', () => changeSpeed(1));
speedDownBtn.addEventListener('click', () => changeSpeed(-1));

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    // Determine swipe direction
    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0 && game.direction.x === 0) {
            game.nextDirection = { x: 1, y: 0 }; // Right
        } else if (dx < 0 && game.direction.x === 0) {
            game.nextDirection = { x: -1, y: 0 }; // Left
        }
    } else {
        // Vertical swipe
        if (dy > 0 && game.direction.y === 0) {
            game.nextDirection = { x: 0, y: 1 }; // Down
        } else if (dy < 0 && game.direction.y === 0) {
            game.nextDirection = { x: 0, y: -1 }; // Up
        }
    }
});

// Initialize the game
initGame();

// Animation for power-ups panel
const powerupItems = document.querySelectorAll('.powerup-item');
powerupItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
        item.style.transform = 'scale(1.1)';
    });
    
    item.addEventListener('mouseleave', () => {
        item.style.transform = 'scale(1)';
    });
});
