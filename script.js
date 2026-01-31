/* ===== BASE STYLES ===== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary-color: #00f3ff;
    --secondary-color: #ff00ff;
    --accent-color: #00ff9d;
    --dark-bg: #0a0e17;
    --panel-bg: rgba(16, 22, 36, 0.85);
    --panel-border: rgba(0, 243, 255, 0.2);
    --text-primary: #ffffff;
    --text-secondary: #a0b3c9;
    --success-color: #00ff9d;
    --warning-color: #ffaa00;
    --danger-color: #ff4757;
    --grid-color: rgba(0, 243, 255, 0.05);
    --glow: 0 0 20px rgba(0, 243, 255, 0.5);
}

body {
    font-family: 'Exo 2', sans-serif;
    background: var(--dark-bg);
    color: var(--text-primary);
    overflow: hidden;
    height: 100vh;
    position: relative;
}

/* ===== LOADING SCREEN ===== */
.loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0a0e17 0%, #151b2d 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    transition: opacity 0.5s ease;
}

.loading-content {
    text-align: center;
    max-width: 600px;
    padding: 40px;
}

.loading-logo {
    margin-bottom: 50px;
}

.logo-icon {
    font-size: 4rem;
    color: var(--primary-color);
    margin-bottom: 20px;
    animation: pulse 2s infinite;
}

.loading-logo h1 {
    font-family: 'Orbitron', sans-serif;
    font-size: 3.5rem;
    font-weight: 900;
    letter-spacing: 3px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.loading-logo .accent {
    color: var(--accent-color);
}

.progress-bar {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
    margin: 30px 0 20px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
    border-radius: 3px;
    width: 0%;
    transition: width 0.3s ease;
}

.loading-text {
    font-size: 1.1rem;
    color: var(--text-secondary);
    margin-top: 10px;
}

.loading-tips {
    margin-top: 40px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    border-left: 3px solid var(--primary-color);
}

.tip {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-secondary);
}

.tip i {
    color: var(--accent-color);
}

/* ===== PARTICLE BACKGROUND ===== */
.particles-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
}

/* ===== MAIN INTERFACE ===== */
.main-interface {
    height: 100vh;
    display: flex;
    flex-direction: column;
    opacity: 0;
    animation: fadeIn 1s forwards 0.5s;
}

/* ===== HEADER ===== */
.game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 30px;
    background: rgba(10, 14, 23, 0.9);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--panel-border);
    position: relative;
    z-index: 100;
}

.header-left .logo {
    display: flex;
    align-items: center;
    gap: 15px;
}

.logo-icon {
    font-size: 2rem;
    color: var(--primary-color);
}

.logo-text h1 {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.8rem;
    font-weight: 900;
    letter-spacing: 2px;
}

.logo-text .tagline {
    font-size: 0.8rem;
    color: var(--text-secondary);
    letter-spacing: 1px;
}

.header-center .session-info {
    display: flex;
    gap: 30px;
}

.session-item {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-secondary);
}

.session-item i {
    color: var(--primary-color);
}

.header-controls {
    display: flex;
    gap: 10px;
}

.header-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--panel-border);
    color: var(--text-primary);
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-btn:hover {
    background: var(--primary-color);
    color: var(--dark-bg);
    transform: translateY(-2px);
}

/* ===== GAME AREA ===== */
.game-area {
    flex: 1;
    display: flex;
    padding: 20px;
    gap: 20px;
    overflow: hidden;
}

/* ===== DASHBOARDS ===== */
.dashboard {
    width: 320px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.panel {
    background: var(--panel-bg);
    border-radius: 12px;
    border: 1px solid var(--panel-border);
    backdrop-filter: blur(10px);
    overflow: hidden;
}

.panel-header {
    padding: 15px 20px;
    background: rgba(0, 243, 255, 0.1);
    border-bottom: 1px solid var(--panel-border);
}

.panel-header h3 {
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 10px;
}

.panel-header i {
    color: var(--primary-color);
}

/* ===== METRIC PANEL ===== */
.metric-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    padding: 20px;
}

.metric-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 15px;
    text-align: center;
    transition: transform 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.metric-card:hover {
    transform: translateY(-5px);
    border-color: var(--primary-color);
}

.metric-icon {
    font-size: 1.5rem;
    margin-bottom: 10px;
}

.metric-icon.fps {
    color: var(--success-color);
}

.metric-icon.latency {
    color: var(--primary-color);
}

.metric-icon.render {
    color: var(--secondary-color);
}

.metric-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-bottom: 5px;
}

.metric-value {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text-primary);
}

/* ===== STATS PANEL ===== */
.stats-grid {
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.stat-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 15px;
}

.stat-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.stat-label i {
    color: var(--primary-color);
}

.stat-value {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--accent-color);
    line-height: 1;
}

/* ===== POWER PANEL ===== */
.power-grid {
    padding: 20px;
}

.power-meter {
    margin-bottom: 20px;
}

.power-label {
    color: var(--text-secondary);
    margin-bottom: 10px;
    font-size: 0.9rem;
}

.meter-container {
    height: 30px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    overflow: hidden;
    position: relative;
    border: 1px solid var(--panel-border);
}

.meter-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--success-color), var(--accent-color));
    width: 50%;
    border-radius: 15px;
    transition: width 0.3s ease;
}

.meter-text {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    color: var(--dark-bg);
    text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
}

.power-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
}

.power-btn {
    width: 45px;
    height: 45px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--panel-border);
    color: var(--text-primary);
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.power-btn:hover {
    background: var(--primary-color);
    color: var(--dark-bg);
    transform: scale(1.1);
}

.power-display {
    flex: 1;
    text-align: center;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--accent-color);
}

/* ===== GAME CANVAS ===== */
.game-center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.canvas-container {
    width: 100%;
    max-width: 820px;
    background: var(--panel-bg);
    border-radius: 15px;
    border: 1px solid var(--panel-border);
    overflow: hidden;
}

.canvas-header {
    padding: 15px 20px;
    background: rgba(0, 243, 255, 0.1);
    border-bottom: 1px solid var(--panel-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.game-mode {
    display: flex;
    align-items: center;
    gap: 15px;
}

.mode-indicator {
    background: linear-gradient(45deg, var(--primary-color), var(--accent-color));
    padding: 5px 15px;
    border-radius: 20px;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--dark-bg);
}

.difficulty {
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.canvas-controls {
    display: flex;
    gap: 10px;
}

.canvas-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--panel-border);
    color: var(--text-primary);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.canvas-btn:hover {
    background: var(--primary-color);
    color: var(--dark-bg);
    transform: scale(1.1);
}

.canvas-wrapper {
    position: relative;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
}

#game-canvas {
    background: #050811;
    border-radius: 8px;
    border: 2px solid rgba(0, 243, 255, 0.2);
    box-shadow: 0 0 50px rgba(0, 243, 255, 0.1);
}

.canvas-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.hud-element {
    position: absolute;
    padding: 10px 15px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 8px;
    border: 1px solid var(--panel-border);
    backdrop-filter: blur(5px);
}

.hud-element.top-left {
    top: 20px;
    left: 20px;
}

.hud-element.top-right {
    top: 20px;
    right: 20px;
}

.hud-element.bottom-left {
    bottom: 20px;
    left: 20px;
}

.hud-element.bottom-right {
    bottom: 20px;
    right: 20px;
}

.hud-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-primary);
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
}

.hud-item i {
    color: var(--accent-color);
}

.canvas-footer {
    padding: 15px 20px;
    background: rgba(0, 243, 255, 0.1);
    border-top: 1px solid var(--panel-border);
}

.status-bar {
    display: flex;
    justify-content: space-between;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.status-item i {
    color: var(--primary-color);
}

.status-value {
    color: var(--success-color);
    font-weight: 600;
}

/* ===== RIGHT DASHBOARD COMPONENTS ===== */
.mission-info {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.mission-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.mission-label {
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.mission-value {
    color: var(--text-primary);
    font-weight: 600;
    font-size: 1.1rem;
}

.mission-progress {
    margin-top: 5px;
}

/* ===== INVENTORY PANEL ===== */
.inventory-grid {
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.inventory-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 15px;
    text-align: center;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    position: relative;
    overflow: hidden;
}

.inventory-item:hover {
    transform: translateY(-5px);
    border-color: var(--primary-color);
}

.inventory-item[data-type="shield"] {
    border-color: rgba(0, 200, 255, 0.3);
}

.inventory-item[data-type="speed"] {
    border-color: rgba(255, 100, 0, 0.3);
}

.inventory-item[data-type="time"] {
    border-color: rgba(255, 255, 0, 0.3);
}

.inventory-item[data-type="multiplier"] {
    border-color: rgba(200, 0, 255, 0.3);
}

.inventory-icon {
    font-size: 2rem;
    margin-bottom: 10px;
}

.inventory-count {
    font-family: 'Orbitron', sans-serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--accent-color);
    margin-bottom: 5px;
}

.inventory-name {
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-weight: 600;
}

/* ===== ANALYTICS PANEL ===== */
.analytics-content {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.analytics-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.analytics-label {
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.analytics-value {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--text-primary);
}

/* ===== LEADERBOARD PREVIEW ===== */
.leaderboard-list {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.leaderboard-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    transition: all 0.3s ease;
}

.leaderboard-item.current {
    background: linear-gradient(90deg, rgba(0, 243, 255, 0.2), rgba(0, 255, 157, 0.2));
    border: 1px solid var(--primary-color);
}

.leaderboard-item:hover {
    transform: translateX(5px);
    background: rgba(255, 255, 255, 0.1);
}

.rank {
    background: var(--primary-color);
    color: var(--dark-bg);
    width: 25px;
    height: 25px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
}

.player {
    flex: 1;
    padding: 0 15px;
    font-weight: 600;
    color: var(--text-primary);
}

.score {
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    color: var(--accent-color);
}

/* ===== GAME CONTROLS ===== */
.game-controls {
    padding: 20px 30px;
    background: rgba(10, 14, 23, 0.9);
    backdrop-filter: blur(10px);
    border-top: 1px solid var(--panel-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.control-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.control-label {
    color: var(--text-secondary);
    font-size: 0.9rem;
    letter-spacing: 1px;
    text-transform: uppercase;
}

.control-keys {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.key-row {
    display: flex;
    gap: 5px;
}

.key {
    width: 70px;
    height: 70px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid var(--panel-border);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text-primary);
}

.key:hover {
    background: rgba(0, 243, 255, 0.2);
    transform: translateY(-3px);
}

.key:active {
    transform: translateY(0);
}

.key i {
    font-size: 1.5rem;
    margin-bottom: 5px;
}

.key span {
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.action-buttons {
    display: flex;
    gap: 15px;
}

.action-btn {
    padding: 15px 25px;
    border-radius: 10px;
    border: none;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    letter-spacing: 1px;
}

.action-btn.primary {
    background: linear-gradient(45deg, var(--primary-color), var(--accent-color));
    color: var(--dark-bg);
}

.action-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    border: 1px solid var(--panel-border);
}

.action-btn.tertiary {
    background: rgba(255, 0, 255, 0.1);
    color: var(--text-primary);
    border: 1px solid rgba(255, 0, 255, 0.3);
}

.action-btn:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

.quick-keys {
    display: flex;
    gap: 10px;
}

.key-function {
    width: 90px;
}

/* ===== GAME OVER SCREEN ===== */
.game-over-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(5, 8, 17, 0.95);
    backdrop-filter: blur(10px);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.game-over-content {
    max-width: 800px;
    width: 90%;
    background: var(--panel-bg);
    border-radius: 20px;
    border: 2px solid var(--panel-border);
    overflow: hidden;
    padding: 40px;
    text-align: center;
}

.game-over-header {
    margin-bottom: 40px;
}

.result-icon {
    font-size: 4rem;
    color: var(--danger-color);
    margin-bottom: 20px;
    animation: shake 0.5s ease;
}

.game-over-header h2 {
    font-family: 'Orbitron', sans-serif;
    font-size: 2.5rem;
    margin-bottom: 10px;
    color: var(--text-primary);
}

.result-subtitle {
    color: var(--text-secondary);
    font-size: 1.2rem;
}

.result-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin: 40px 0;
}

.result-stat {
    background: rgba(255, 255, 255, 0.05);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-label {
    display: block;
    color: var(--text-secondary);
    margin-bottom: 10px;
    font-size: 0.9rem;
}

.stat-value {
    display: block;
    font-family: 'Orbitron', sans-serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--accent-color);
}

.result-actions {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin: 40px 0;
}

.result-btn {
    padding: 15px 30px;
    border-radius: 10px;
    border: none;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    min-width: 200px;
    justify-content: center;
}

.result-btn.primary {
    background: linear-gradient(45deg, var(--primary-color), var(--accent-color));
    color: var(--dark-bg);
}

.result-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    border: 1px solid var(--panel-border);
}

.result-btn.tertiary {
    background: rgba(255, 0, 255, 0.1);
    color: var(--text-primary);
    border: 1px solid rgba(255, 0, 255, 0.3);
}

.result-btn:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

.result-ranking {
    margin-top: 40px;
    padding-top: 40px;
    border-top: 1px solid var(--panel-border);
}

.result-ranking h3 {
    color: var(--text-secondary);
    margin-bottom: 20px;
    font-size: 1.2rem;
}

.ranking-badge {
    background: linear-gradient(45deg, #ffd700, #ffaa00);
    padding: 15px 30px;
    border-radius: 25px;
    display: inline-block;
    margin-bottom: 15px;
}

.rank-title {
    display: block;
    font-family: 'Orbitron', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--dark-bg);
}

.rank-score {
    display: block;
    font-size: 0.9rem;
    color: var(--dark-bg);
}

.rank-message {
    color: var(--text-secondary);
    font-size: 0.9rem;
}

/* ===== SETTINGS MODAL ===== */
.settings-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

.modal-content {
    width: 90%;
    max-width: 800px;
    background: var(--panel-bg);
    border-radius: 20px;
    border: 2px solid var(--panel-border);
    overflow: hidden;
}

.modal-header {
    padding: 25px 30px;
    background: rgba(0, 243, 255, 0.1);
    border-bottom: 1px solid var(--panel-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h2 {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.8rem;
    display: flex;
    align-items: center;
    gap: 15px;
}

.modal-close {
    background: none;
    border: none;
    color: var(--text-primary);
    font-size: 1.5rem;
    cursor: pointer;
    transition: color 0.3s ease;
}

.modal-close:hover {
    color: var(--danger-color);
}

.modal-body {
    padding: 30px;
}

.settings-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;
    border-bottom: 1px solid var(--panel-border);
    padding-bottom: 10px;
}

.tab {
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--text-secondary);
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
}

.tab.active {
    background: var(--primary-color);
    color: var(--dark-bg);
}

.tab:hover:not(.active) {
    background: rgba(255, 255, 255, 0.1);
}

.setting-item {
    margin-bottom: 25px;
}

.setting-item label {
    display: block;
    margin-bottom: 10px;
    color: var(--text-primary);
    font-weight: 600;
}

.setting-item select,
.setting-item input[type="range"] {
    width: 100%;
    padding: 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    color: var(--text-primary);
    font-family: 'Exo 2', sans-serif;
}

.setting-item input[type="checkbox"] {
    margin-right: 10px;
    transform: scale(1.2);
}

/* ===== NOTIFICATIONS ===== */
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 3000;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.notification {
    background: var(--panel-bg);
    border-radius: 10px;
    padding: 15px 20px;
    border-left: 4px solid var(--primary-color);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease;
    max-width: 300px;
    backdrop-filter: blur(10px);
}

.notification.success {
    border-left-color: var(--success-color);
}

.notification.warning {
    border-left-color: var(--warning-color);
}

.notification.danger {
    border-left-color: var(--danger-color);
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.notification i {
    font-size: 1.2rem;
}

.notification.success i {
    color: var(--success-color);
}

.notification.warning i {
    color: var(--warning-color);
}

.notification.danger i {
    color: var(--danger-color);
}

.notification p {
    color: var(--text-primary);
    font-size: 0.9rem;
}

/* ===== ANIMATIONS ===== */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 1600px) {
    .dashboard {
        width: 280px;
    }
    
    .metric-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 1200px) {
    .game-area {
        flex-direction: column;
    }
    
    .dashboard {
        width: 100%;
        flex-direction: row;
        flex-wrap: wrap;
    }
    
    .panel {
        flex: 1;
        min-width: 300px;
    }
    
    .game-controls {
        flex-direction: column;
        gap: 20px;
    }
    
    .controls-left,
    .controls-center,
    .controls-right {
        width: 100%;
    }
}

@media (max-width: 768px) {
    .game-header {
        flex-direction: column;
        gap: 15px;
    }
    
    .header-center .session-info {
        flex-direction: column;
        gap: 10px;
        text-align: center;
    }
    
    .result-stats {
        grid-template-columns: 1fr;
    }
    
    .result-actions {
        flex-direction: column;
    }
    
    .result-btn {
        width: 100%;
    }
    
    #game-canvas {
        width: 95vw;
        height: 95vw;
        max-width: 500px;
        max-height: 500px;
    }
}
