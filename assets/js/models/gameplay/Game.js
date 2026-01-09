import { GameState } from './GameState.js';
import { Tower } from './Tower.js';
import { Wave } from './Wave.js';
import { PathFactory } from '../core/PathFactory.js';
import { GameStateChangedEvent, GameOverEvent } from '../../utils/events/GameEvent.js';

/**
 * Game - Core game logic and state management
 * Centralizes gameplay rules, economy, combat, and progression
 */
export class Game {
    /**
     * @type {GameState}
     */
    state = GameState.READY;
    
    /**
     * @type {number}
     */
    currentWaveNumber = 0;
    
    /**
     * @type {number}
     */
    globalScore = 0;
    
    /**
     * @type {GridModel}
     */
    gridModel;
    
    /**
     * @type {EntityManager}
     */
    entityManager;
    
    /**
     * @type {PlayerManager}
     */
    playerManager;
    
    /**
     * @type {WaveManager}
     */
    waveManager;
    
    /**
     * @type {CoordinateSystem}
     */
    coordSystem;
    
    /**
     * @type {DIContainer}
     */
    container;
    
    /**
     * @type {Debug}
     */
    debug;
    
    /**
     * @type {Object<string, Array<Function>>}
     */
    eventListeners = {};
    
    /**
     * @type {Object}
     */
    config = {
        difficulty: 1.0,
        startingWaveDelay: 1.0,
        waveEnemyIncrement: 2,
        towerCost: {
            money: 500
        }
    };
    
    /**
     * @param {GridModel} gridModel
     * @param {EntityManager} entityManager
     * @param {PlayerManager} playerManager
     * @param {WaveManager} waveManager
     * @param {CoordinateSystem} coordSystem
     * @param {DIContainer} container
     */
    constructor(gridModel, entityManager, playerManager, waveManager, coordSystem, container) {
        this.gridModel = gridModel;
        this.entityManager = entityManager;
        this.playerManager = playerManager;
        this.waveManager = waveManager;
        this.coordSystem = coordSystem;
        this.container = container;
        this.debug = container.createDebug('Game', true);
        this.eventListeners = {};
    }
    
    /**
     * Initialize game (setup paths, initial towers, etc.)
     * @returns {void}
     */
    init() {
        this.debug.info('🎮 Initializing game...');
        
        // Create perimeter path
        const perimeterPath = PathFactory.createPerimeter(
            this.gridModel,
            this.coordSystem,
            this.container
        );
        this.gridModel.addPath(perimeterPath);
        this.debug.success('Perimeter path created');
        
        this.state = GameState.READY;
        this.debug.success('Game initialized - Ready to start');
    }
    
    /**
     * Start the game
     * @returns {void}
     */
    start() {
        if (this.state !== GameState.READY) {
            this.debug.warning('Cannot start game - not in READY state', { currentState: this.state });
            return;
        }
        
        const oldState = this.state;
        this.state = GameState.RUNNING;
        
        // Emit state changed event
        const event = new GameStateChangedEvent(this, oldState, this.state);
        this.emit('stateChanged', event);
        
        this.debug.success('🎮 Game started!');
        
        // Start first wave
        this.nextWave();
    }
    
    /**
     * Pause the game
     * @returns {void}
     */
    pause() {
        if (this.state !== GameState.RUNNING) {
            return;
        }
        
        const oldState = this.state;
        this.state = GameState.PAUSED;
        
        const event = new GameStateChangedEvent(this, oldState, this.state);
        this.emit('stateChanged', event);
        
        this.debug.info('⏸️ Game paused');
    }
    
    /**
     * Resume the game
     * @returns {void}
     */
    resume() {
        if (this.state !== GameState.PAUSED) {
            return;
        }
        
        const oldState = this.state;
        this.state = GameState.RUNNING;
        
        const event = new GameStateChangedEvent(this, oldState, this.state);
        this.emit('stateChanged', event);
        
        this.debug.info('▶️ Game resumed');
    }
    
    /**
     * Trigger game over
     * @param {string} reason
     * @returns {void}
     */
    gameOver(reason = 'Unknown') {
        const oldState = this.state;
        this.state = GameState.GAME_OVER;
        
        // Emit state changed
        const stateEvent = new GameStateChangedEvent(this, oldState, this.state);
        this.emit('stateChanged', stateEvent);
        
        // Emit game over
        const gameOverEvent = new GameOverEvent(this, reason, this.globalScore);
        this.emit('over', gameOverEvent);
        
        this.debug.error('💀 GAME OVER', { reason, finalScore: this.globalScore });
    }
    
    /**
     * Trigger victory
     * @returns {void}
     */
    victory() {
        this.state = GameState.VICTORY;
        this.debug.success('🎉 VICTORY!', { finalScore: this.globalScore });
    }
    
    /**
     * Start next wave
     * @returns {void}
     */
    nextWave() {
        const perimeterPath = this.gridModel.getPaths()[0];
        
        if (!perimeterPath) {
            this.debug.error('Cannot start wave - no path available');
            return;
        }
        
        this.currentWaveNumber++;
        
        // Progressive difficulty: more enemies each wave
        const enemyCount = 10 + (this.currentWaveNumber - 1) * this.config.waveEnemyIncrement;
        
        const wave = new Wave(
            [
                { 
                    type: 'basic', 
                    health: 100 * this.config.difficulty, 
                    speed: 1.0, 
                    count: enemyCount 
                }
            ],
            this.config.startingWaveDelay,
            perimeterPath
        );
        
        this.waveManager.startWave(wave, this.currentWaveNumber);
        this.debug.success(`Wave ${this.currentWaveNumber} started`, { 
            enemyCount,
            difficulty: this.config.difficulty 
        });
    }
    
    /**
     * Place a tower on a cell
     * @param {Cell} cell
     * @param {Function} onShoot - Callback when tower shoots
     * @returns {boolean} - True if tower was placed successfully
     */
    placeTower(cell, onShoot) {
        const activePlayer = this.playerManager.getActivePlayer();
        
        if (!activePlayer) {
            this.debug.error('Cannot place tower - no active player');
            return false;
        }
        
        // Check if player can afford the tower
        const cost = this.config.towerCost.money;
        if (!activePlayer.wallet.has('money', cost)) {
            this.debug.warning('Cannot place tower - insufficient funds', {
                required: cost,
                available: activePlayer.wallet.get('money')
            });
            return false;
        }
        
        // Deduct cost
        activePlayer.wallet.spend('money', cost);
        this.debug.info(`Tower purchased for ${cost} gold`, {
            remaining: activePlayer.wallet.get('money')
        });
        
        // Create and place tower
        const tower = new Tower(
            cell, 
            activePlayer.id, 
            onShoot, 
            this.container
        );
        
        cell.setTower(tower);
        this.entityManager.addEntity(tower);
        activePlayer.addTower(tower);
        
        this.debug.success('Tower placed', {
            player: activePlayer.name,
            totalTowers: activePlayer.towers.length
        });
        
        return true;
    }
    
    /**
     * Place N towers randomly on empty cells (for testing)
     * @param {number} count
     * @param {Function} onShoot
     * @returns {Array<Cell>} - Array of cells where towers were placed
     */
    placeRandomTowers(count, onShoot) {
        const emptyCells = this.gridModel.getEmptyCells();
        
        if (emptyCells.length < count) {
            this.debug.warning(`Not enough empty cells for ${count} towers, placing ${emptyCells.length}`);
            count = emptyCells.length;
        }
        
        const shuffled = emptyCells.sort(() => Math.random() - 0.5);
        const selectedCells = shuffled.slice(0, count);
        
        const activePlayer = this.playerManager.getActivePlayer();
        if (!activePlayer) {
            this.debug.error('Cannot place towers - no active player');
            return [];
        }
        
        // For random placement (testing), give free towers
        selectedCells.forEach(cell => {
            const tower = new Tower(
                cell, 
                activePlayer.id, 
                onShoot, 
                this.container
            );
            
            cell.setTower(tower);
            this.entityManager.addEntity(tower);
            activePlayer.addTower(tower);
        });
        
        this.debug.success(`Placed ${count} free towers for testing`, {
            totalTowers: activePlayer.towers.length
        });
        
        return selectedCells;
    }
    
    /**
     * Move tower from one cell to another (business logic)
     * @param {Tower} tower
     * @param {Cell} fromCell
     * @param {Cell} toCell
     * @returns {boolean} - True if move is allowed and executed
     */
    moveTower(tower, fromCell, toCell) {
        // Validation: can't move to same cell
        if (fromCell === toCell) {
            this.debug.info('Cannot move to same cell');
            return false;
        }
        
        // Validation: can't move to path
        if (toCell.isOnPath) {
            this.debug.warning('Cannot move tower to path cell');
            return false;
        }
        
        // Validation: can't move to occupied cell
        if (toCell.hasTower()) {
            this.debug.warning('Target cell already occupied');
            return false;
        }
        
        // Optional: Apply movement cost (disabled for now)
        // const moveCost = 50;
        // const owner = this.playerManager.players.find(p => p.id === tower.playerId);
        // if (owner && !owner.wallet.has('money', moveCost)) {
        //     this.debug.warning('Insufficient funds to move tower');
        //     return false;
        // }
        // owner.wallet.spend('money', moveCost);
        
        this.debug.success('Tower move validated', {
            from: { row: fromCell.row, col: fromCell.col },
            to: { row: toCell.row, col: toCell.col }
        });
        
        return true;
    }
    
    /**
     * Handle enemy killed event
     * @param {Enemy} enemy
     * @param {Tower} killer - Tower that killed the enemy
     * @returns {void}
     */
    handleEnemyKilled(enemy, killer) {
        // Find tower owner
        const owner = this.playerManager.players.find(p => p.id === killer.playerId);
        
        if (!owner) {
            this.debug.warning('Enemy killed but no owner found for tower', { 
                towerId: killer.id,
                playerId: killer.playerId 
            });
            return;
        }
        
        // Award gold
        owner.wallet.add('money', enemy.goldReward);
        
        // Update stats
        owner.stats.enemiesKilled++;
        owner.score += enemy.goldReward;
        
        // Update global score
        this.globalScore += enemy.goldReward;
        
        this.debug.success(`💰 ${owner.name} earned ${enemy.goldReward} gold`, { 
            total: owner.wallet.get('money'),
            kills: owner.stats.enemiesKilled
        });
    }
    
    /**
     * Handle enemy reached end of path
     * @param {Enemy} enemy
     * @returns {void}
     */
    handleEnemyReachedEnd(enemy) {
        const activePlayer = this.playerManager.getActivePlayer();
        
        if (!activePlayer) {
            return;
        }
        
        // Deduct lives (emits PlayerDamagedEvent)
        activePlayer.takeDamage(1);
        this.debug.warning(`❤️ Enemy reached end! Lives: ${activePlayer.lives}/20`);
        
        // Check game over
        if (activePlayer.lives <= 0) {
            this.gameOver('All lives lost');
        }
    }
    
    /**
     * Update game logic
     * @param {number} deltaTime - in seconds
     * @returns {void}
     */
    update(deltaTime) {
        if (this.state !== GameState.RUNNING) {
            return;
        }
        
        // Update wave spawning
        this.waveManager.update(deltaTime);
        
        // Update all entities
        this.entityManager.update(deltaTime);
        
        // Check wave completion and start next
        // (This could be event-driven instead)
    }
    
    /**
     * Get current game state
     * @returns {GameState}
     */
    getState() {
        return this.state;
    }
    
    /**
     * Check if game is running
     * @returns {boolean}
     */
    isRunning() {
        return this.state === GameState.RUNNING;
    }
    
    /**
     * Serialize game state to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            state: this.state,
            currentWaveNumber: this.currentWaveNumber,
            globalScore: this.globalScore,
            config: this.config,
            players: this.playerManager.players.map(p => ({
                id: p.id,
                name: p.name,
                wallet: p.wallet.toJSON(),
                lives: p.lives,
                score: p.score,
                stats: p.stats
            }))
        };
    }
    
    /**
     * Add event listener
     * @param {string} eventName
     * @param {Function} callback
     * @returns {void}
     */
    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }
    
    /**
     * Remove event listener
     * @param {string} eventName
     * @param {Function} callback
     * @returns {void}
     */
    off(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            return;
        }
        this.eventListeners[eventName] = this.eventListeners[eventName].filter(cb => cb !== callback);
    }
    
    /**
     * Trigger event
     * @param {string} eventName
     * @param {*} data - Event data
     * @returns {void}
     * @private
     */
    emit(eventName, data) {
        if (!this.eventListeners[eventName]) {
            return;
        }
        this.eventListeners[eventName].forEach(callback => {
            callback(data);
        });
    }
}
