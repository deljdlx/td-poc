import { GameState } from './GameState.js';
import { Tower } from './Tower.js';
import { Wave } from './Wave.js';
import { PathFactory } from '../core/PathFactory.js';
import { Missile } from './Missile.js';
import { GameStateChangedEvent, GameOverEvent } from '../../events/GameEvent.js';
import { EventBus } from '../../utils/EventBus.js';

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
     * @type {Object} - Event handler from EventBus
     */
    events;
    
    /**
     * @type {Object}
     */
    config = {
        difficulty: 1.0,
        startingWaveDelay: 1.0,
        waveEnemyIncrement: 2,
        towerCost: {
            money: 500
        },
        missile: {
            speed: 300,        // pixels/sec
            lifetime: 3.0,     // seconds
            splashRadius: 0.5  // cells
        }
    };
    
    /**
     * @param {GridModel} gridModel
     * @param {EntityManager} entityManager
     * @param {PlayerManager} playerManager
     * @param {WaveManager} waveManager
     * @param {CoordinateSystem} coordSystem
     * @param {CanvasView} canvasView
     * @param {DIContainer} container
     */
    constructor(gridModel, entityManager, playerManager, waveManager, coordSystem, canvasView, container) {
        this.gridModel = gridModel;
        this.entityManager = entityManager;
        this.playerManager = playerManager;
        this.waveManager = waveManager;
        this.coordSystem = coordSystem;
        this.canvasView = canvasView;
        this.container = container;
        this.debug = container.createDebug('Game', true);
        this.events = EventBus.createHandler(this);
        
        // Give WaveManager access to Game events
        this.waveManager.setGameEvents(this.events);
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
        
        // Setup game event listeners for business logic
        this.setupGameEventListeners();
        
        this.state = GameState.READY;
        this.debug.success('Game initialized - Ready to start');
    }
    
    /**
     * Setup game event listeners for business logic (rewards, scoring, game over)
     * AND visual effects (explosions, animations)
     * @returns {void}
     */
    setupGameEventListeners() {
        this.debug.info('🎯 Setting up Game event listeners (business logic + visual effects)');
        
        // Missile impact → Visual effects
        this.events.on('missileImpact', (event) => {
            this.canvasView.addSimpleExplosion(event.x, event.y);
            this.canvasView.addSplashEffect(event.x, event.y, event.splashRadius);
        });
        
        // Listen to enemy spawned events to setup per-enemy listeners
        this.events.on('enemySpawned', (event) => {
            const enemy = event.enemy;
            
            // Enemy death → Handle rewards (gold, score) and visual effects
            enemy.events.on('death', (deathEvent) => {
                this.debug.event(`💀 Enemy ${enemy.id} died at (${deathEvent.position.x}, ${deathEvent.position.y})`);
                
                // Business logic: award gold and update stats
                if (deathEvent.killer) {
                    this.handleEnemyKilled(enemy, deathEvent.killer);
                } else {
                    this.debug.info(`Enemy ${enemy.id} died from non-combat cause`);
                }
                
                // Visual effects handled by DOMEnemyRenderer
            });
            
            // Enemy reached end → Game over logic
            enemy.events.on('reachedEnd', (endEvent) => {
                this.handleEnemyReachedEnd(enemy);
            });
        });
        
        this.debug.success('✅ Game event listeners configured');
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
        this.events.emit('stateChanged', event);
        
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
        this.events.emit('stateChanged', event);
        
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
        this.events.emit('stateChanged', event);
        
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
        this.events.emit('stateChanged', stateEvent);
        
        // Emit game over
        const gameOverEvent = new GameOverEvent(this, reason, this.globalScore);
        this.events.emit('over', gameOverEvent);
        
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
     * Create and fire missile from tower to target
     * @param {Tower} tower - Firing tower
     * @param {number} startX - Start X position
     * @param {number} startY - Start Y position
     * @param {number} targetX - Target X position
     * @param {number} targetY - Target Y position
     * @returns {Missile}
     */
    createMissile(tower, startX, startY, targetX, targetY) {
        const missile = new Missile(
            tower,
            startX, startY,
            targetX, targetY,
            this.config.missile.speed,
            (missile, impactX, impactY, splashRadiusPixels) => {
                // Emit visual FX event
                this.events.emit('missileImpact', { 
                    x: impactX, 
                    y: impactY, 
                    splashRadius: splashRadiusPixels 
                });
                
                // Apply damage (missile knows tower + damage)
                this.applyDamage(missile, impactX, impactY);
            },
            this.config.missile.lifetime,
            this.config.missile.splashRadius,
            this.config.missile.damage, // Damage from config (munition type)
            this.coordSystem
        );
        
        this.entityManager.addEntity(missile);
        this.debug.event('🚀 Missile created', { 
            towerId: tower.id,
            target: { x: targetX.toFixed(0), y: targetY.toFixed(0) }
        });
        
        return missile;
    }
    
    /**
     * Apply damage to enemies in splash zone
     * @param {Missile} missile - Missile that exploded (contains tower + damage)
     * @param {number} impactX - Impact X position
     * @param {number} impactY - Impact Y position
     * @returns {void}
     * @private
     */
    applyDamage(missile, impactX, impactY) {
        const tower = missile.tower;
        const baseDamage = missile.damage;
        
        // Calculate splash radius from config
        const splashRadius = this.config.missile.splashRadius * this.coordSystem.getCellSize();
        
        const enemies = this.entityManager.getEntitiesByType('enemy');
        let hitCount = 0;
        
        this.debug.info(`💥 Checking ${enemies.length} enemies for splash damage at (${impactX.toFixed(0)}, ${impactY.toFixed(0)}) radius: ${splashRadius.toFixed(0)}px`);
        
        enemies.forEach(enemy => {
            const dx = enemy.x - impactX;
            const dy = enemy.y - impactY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if enemy is in splash zone
            if (distance <= splashRadius) {
                // Calculate critical hit using tower stats (tireur)
                const isCritical = Math.random() < tower.critChance;
                const finalDamage = isCritical ? Math.floor(baseDamage * tower.critMultiplier) : baseDamage;
                
                const wasAlive = enemy.alive;
                enemy.takeDamage(finalDamage, tower); // Pass tower as attacker
                hitCount++;
                
                // Track hit and damage
                tower.trackHit(finalDamage, isCritical);
                
                // Track kill if enemy died (business logic handled by event listener)
                if (wasAlive && !enemy.alive) {
                    tower.trackKill();
                    // handleEnemyKilled will be called by death event listener
                }
                
                if (isCritical) {
                    this.debug.success(`💥 CRITICAL HIT! Enemy ${enemy.id} hit for ${finalDamage} damage (${tower.critMultiplier}x) - HP: ${enemy.health}/${enemy.maxHealth}`);
                } else {
                    this.debug.debug(`Enemy ${enemy.id} hit for ${finalDamage} damage - HP: ${enemy.health}/${enemy.maxHealth}`);
                }
            }
        });
        
        if (hitCount > 0) {
            this.debug.success(`🎯 Missile hit ${hitCount} enemy(ies) in splash zone (radius: ${splashRadius}px)`);
        } else {
            this.debug.warning('❌ Missile missed - no enemies in splash zone');
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
}
