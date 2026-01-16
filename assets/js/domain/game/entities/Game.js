import { GameState } from '../value-objects/GameState.js';
import { Tower } from '../../combat/entities/Tower.js';
import { Wave } from './Wave.js';
import { PathFactory } from '../../map/PathFactory.js';
import { Missile } from '../../combat/entities/Missile.js';
import { GameStateChangedEvent, GameOverEvent } from '../../../events/GameEvent.js';
import { TowerPlacedEvent } from '../../../events/TowerEvent.js';
import { EventBus } from '../../../services/core/EventBus.js';
import { missileTypes } from '../registries/MissileTypeRegistry.js';
import { towerTypes } from '../registries/TowerTypeRegistry.js';
import { GameClock } from '../../../services/engine/GameClock.js';
import { EntityManager } from '../../../services/engine/EntityManager.js';
import { PlayerManager } from '../../player/managers/PlayerManager.js';
import { WaveManager } from '../../../services/wave/WaveManager.js';
import { GridSystem } from '../../../services/grid/GridSystem.js';
import { CanvasView } from '../../../views/CanvasView.js';
import { TowerRangeView } from '../../../views/TowerRangeView.js';
import { TowerDragHandler } from '../../../ux/TowerDragHandler.js';
import { TowerStatsPopup } from '../../../views/TowerStatsPopup.js';
import { PlayerInfoPopup } from '../../../views/PlayerInfoPopup.js';
import { GameDebugPanel } from '../debug/GameDebugPanel.js';

/**
 * Game - Autonomous tower defense game instance
 * Creates and manages all game-specific components independently
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
     * @type {DIContainer}
     */
    container;
    
    /**
     * @type {Debug}
     */
    debug;
    
    /**
     * @type {CoordinateSystem}
     */
    coordSystem;
    
    /**
     * @type {GameClock}
     */
    gameClock;
    
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
     * @type {GridSystem}
     */
    gridSystem;
    
    /**
     * @type {GridModel}
     */
    gridModel;
    
    /**
     * @type {CanvasView}
     */
    canvasView;
    
    /**
     * @type {TowerRangeView}
     */
    towerRangeView;
    
    /**
     * @type {TowerDragHandler}
     */
    towerDragHandler;
    
    /**
     * @type {TowerStatsPopup}
     */
    towerStatsPopup;
    
    /**
     * @type {PlayerInfoPopup}
     */
    playerInfoPopup;
    
    /**
     * @type {GameDebugPanel}
     */
    debugPanel;
    
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
     * @type {Object} - Missile type blueprints (imported from registry)
     */
    missileTypes = missileTypes;
    
    /**
     * @type {Object} - Tower type blueprints (imported from registry)
     */
    towerTypes = towerTypes;
    
    /**
     * Create autonomous game instance
     * @param {DIContainer} container - Only for global services
     */
    constructor(container) {
        this.container = container;
        this.debug = container.createDebug('Game', true);
        this.events = EventBus.createHandler(this);
        
        // Get global services from DI
        this.coordSystem = container.get('coordinateSystem');
        
        // Create game-specific instances
        this.debug.info('🎮 Creating game components...');
        
        this.gameClock = new GameClock(container);
        this.entityManager = new EntityManager(container);
        this.playerManager = new PlayerManager(container);
        this.playerManager.createPlayer('player1', 'Player 1', '#6366f1');
        
        this.waveManager = new WaveManager(this.entityManager, this.coordSystem, container);
        this.waveManager.setGameEvents(this.events);
        
        this.gridSystem = new GridSystem(15, 10, 'grid-container', container);
        this.gridModel = this.gridSystem.getModel();
        
        this.canvasView = new CanvasView('canvas-layer', this.coordSystem, container);
        this.towerRangeView = new TowerRangeView(container);
        
        this.towerDragHandler = new TowerDragHandler(
            this.gridModel,
            this.gridSystem.getView(),
            this.coordSystem,
            this.entityManager,
            container
        );
        
        this.towerStatsPopup = new TowerStatsPopup(container);
        this.playerInfoPopup = new PlayerInfoPopup(this.playerManager, container);
        
        // Create debug panel owned by Game
        this.debugPanel = new GameDebugPanel(container, this);
        this.debugPanel.setGameClock(this.gameClock);
        
        this.debug.success('✅ Game components created');
    }
    
    /**
     * Initialize game (setup paths, initial towers, etc.)
     * @returns {void}
     */
    init() {
        this.debug.info('🎮 Initializing game...');
        
        // Initialize grid (render DOM elements)
        this.gridSystem.init();

        // Create perimeter path
        const perimeterPath = PathFactory.createPerimeter(
            this.gridModel,
            this.coordSystem,
            this.container
        );
        this.gridModel.addPath(perimeterPath);
        this.debug.success('Perimeter path created');
        
        // Render paths in DOM
        this.gridSystem.renderPaths();
        
        // Setup tower drag handler to listen for tower placement (BEFORE placing towers!)
        this.events.on('towerPlaced', (event) => {
            this.towerDragHandler.enableTowerDrag(event.cell);
        });
        
        // Place initial towers for testing
        this.placeRandomTowers(5);
        this.debug.success('Initial towers placed');
        
        // Log tower drag handlers status
        const towersCount = this.gridModel.getCellsWithTowers().length;
        this.debug.info(`Drag enabled on ${towersCount} towers`);
        
        // Setup game event listeners for business logic
        this.setupGameEventListeners();
        
        // Setup GameClock callbacks
        this.setupGameClock();
        
        // Setup grid interaction events
        this.setupGridEvents();
        
        this.state = GameState.READY;
        this.debug.success('Game initialized - Ready to start');
    }

    /**
     * Setup game event listeners for business logic (rewards, scoring, game over)
     * AND visual effects (explosions, animations)
     * COMMAND/EVENT PATTERN: Commands trigger validation + data mutation + domain events
     * @returns {void}
     */
    setupGameEventListeners() {
        this.debug.info('🎯 Setting up Game event listeners (command/event pattern)');
        
        // COMMAND: Tower move attempt → Validate and execute move
        EventBus.onGlobal('tower:moveAttempt', (data) => {
            const { tower, fromCell, toCell } = data;
            
            // Validate move (business logic)
            const isValid = this.moveTower(tower, fromCell, toCell);
            
            if (isValid) {
                // Update data layer (emits cell:towerChanged events)
                fromCell.removeTower();
                toCell.setTower(tower);
                
                // Synchronize tower position for canvas rendering
                tower.cell = toCell;
                const center = this.coordSystem.getElementCenter(toCell.element);
                tower.x = center.x;
                tower.y = center.y;
                
                // Emit DOMAIN EVENT for UI layer to react
                EventBus.emitGlobal('tower:moved', {
                    tower,
                    fromCell,
                    toCell
                });
                
                this.debug.success('Tower moved', {
                    from: { row: fromCell.row, col: fromCell.col },
                    to: { row: toCell.row, col: toCell.col }
                });
            }
        });
        
        // Tower shoot → Create missile
        EventBus.onGlobal('shoot', (data) => {
            this.createMissile(
                data.tower, 
                data.x, 
                data.y, 
                data.targetX, 
                data.targetY, 
                data.missileBlueprint
            );
        });
        
        // Missile impact → Visual effects + Combat logic
        EventBus.onGlobal('missile:impact', (event) => {
            this.debug.info('💥 Missile impact', { 
                x: event.x, 
                y: event.y, 
                splashRadius: event.splashRadius,
                explosionType: event.visualFx?.explosion?.type
            });
            
            // Visual effects based on blueprint configuration
            const explosionConfig = event.visualFx?.explosion || { type: 'firework', scale: 1.0 };
            
            // Choose explosion effect based on type
            switch(explosionConfig.type) {
                case 'firework':
                    // Pass all firework parameters from blueprint
                    const { type, ...fireworkParams } = explosionConfig;
                    this.canvasView.addFirework(event.x, event.y, fireworkParams);
                    break;
                case 'simple':
                    this.canvasView.addSimpleExplosion(event.x, event.y, explosionConfig);
                    break;
                case 'none':
                    // No explosion effect
                    break;
                default:
                    // Default to firework
                    const { type: _, ...defaultParams } = explosionConfig;
                    this.canvasView.addFirework(event.x, event.y, defaultParams);
            }
            
            // Always show splash zone
            this.canvasView.addSplashEffect(event.x, event.y, event.splashRadius);
            
            // Combat logic: apply splash damage
            this.applyDamage(event.missile, event.x, event.y);
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
     * Setup GameClock callbacks and configure game loop
     * @returns {void}
     */
    setupGameClock() {
        this.debug.info('⏰ Setting up GameClock...');
        
        const uiUpdateManager = this.container.get('uiUpdateManager');
        
        // Update gameplay (fixed timestep)
        this.gameClock.setUpdateCallback(this.update.bind(this));
        
        // Render callback (includes UI updates)
        this.gameClock.setRenderCallback((deltaTime) => {
            this.render(deltaTime);
            // Update UI components after render
            uiUpdateManager.update(deltaTime);
            // Update debug panel if available
            if (this.debugPanel) {
                this.debugPanel.update({
                    fps: this.gameClock.getFPS(),
                    entityCount: this.entityManager.getEntities().length
                });
            }
        });
        
        this.debug.success('✅ GameClock configured');
    }
    
    /**
     * Setup grid interaction events (clicks, hovers)
     * @returns {void}
     */
    setupGridEvents() {
        this.debug.info('🎯 Setting up grid events...');
        
        const container = document.getElementById('grid-container');
        
        // Store bound references for cleanup
        this.boundHandleCellClick = this.handleCellClick.bind(this);
        this.boundHandleCellHover = this.handleCellHover.bind(this);
        this.boundHandleCellLeave = this.handleCellLeave.bind(this);
        
        container.addEventListener('click', this.boundHandleCellClick);
        container.addEventListener('contextmenu', this.boundHandleCellClick);
        
        // Grid hover detection for tower range display
        container.addEventListener('mousemove', this.boundHandleCellHover);
        container.addEventListener('mouseleave', this.boundHandleCellLeave);
        
        // Player info button
        const playerInfoBtn = document.getElementById('player-info-btn');
        if (playerInfoBtn) {
            this.boundHandlePlayerInfoClick = () => {
                this.playerInfoPopup.show();
            };
            playerInfoBtn.addEventListener('click', this.boundHandlePlayerInfoClick);
        }
        
        this.debug.success('✅ Grid events configured');
    }
    
    /**
     * Handle cell click
     * @param {MouseEvent} event
     * @returns {void}
     */
    handleCellClick(event) {
        const target = event.target;
        
        if (!target.classList.contains('grid-cell')) {
            return;
        }
        
        const row = parseInt(target.dataset.row);
        const col = parseInt(target.dataset.col);
        const cell = this.gridSystem.getCell(row, col);
        
        if (!cell) {
            return;
        }
        
        // Check if cell has a tower
        if (cell.hasTower()) {
            this.debug.event(`Tower clicked at [${row}, ${col}]`);
            
            const tower = cell.getTower();
            
            // Click on tower to show stats
            event.preventDefault();
            this.debug.info('Opening tower stats popup');
            this.towerStatsPopup.show(tower);
        } else {
            // Empty cell clicked
            this.debug.event(`Empty cell clicked [${row}, ${col}]`);
        }
    }
    
    /**
     * Handle cell hover to show tower range
     * @param {MouseEvent} event
     * @returns {void}
     */
    handleCellHover(event) {
        const target = event.target;
        
        if (!target.classList.contains('grid-cell')) {
            this.towerRangeView.hide();
            return;
        }
        
        const row = parseInt(target.dataset.row);
        const col = parseInt(target.dataset.col);
        const cell = this.gridSystem.getCell(row, col);
        
        if (!cell || !cell.hasTower()) {
            this.towerRangeView.hide();
            return;
        }
        
        // Show range for this tower
        const tower = cell.getTower();
        this.towerRangeView.show(tower);
    }
    
    /**
     * Handle cell mouse leave
     * @returns {void}
     */
    handleCellLeave() {
        this.towerRangeView.hide();
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
        
        // Start game clock
        this.gameClock.start();
        
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
     * @param {string} towerTypeId - Tower type ID from registry (default: 'basic')
     * @returns {boolean} - True if tower was placed successfully
     */
    placeTower(cell, towerTypeId = 'basic') {
        const activePlayer = this.playerManager.getActivePlayer();
        
        if (!activePlayer) {
            this.debug.error('Cannot place tower - no active player');
            return false;
        }

        // Get tower blueprint
        const towerBlueprint = this.towerTypes[towerTypeId];
        if (!towerBlueprint) {
            this.debug.error(`Unknown tower type: ${towerTypeId}`);
            return false;
        }

        // Check if player can afford the tower
        const cost = towerBlueprint.cost;
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
        
        // Create and place tower from blueprint
        const tower = new Tower(
            cell, 
            activePlayer.id,
            this.container,
            this,
            towerBlueprint
        );
        
        // Emit tower created event (SOURCEABLE: business event)
        this.events.emit('towerCreated', {
            sourceable: true,
            metadata: {
                towerId: tower.id,
                towerType: towerTypeId,
                playerId: activePlayer.id,
                cost: cost,
                stats: {
                    damage: tower.attributes.damage,
                    range: tower.attributes.range,
                    fireRate: tower.attributes.fireRate,
                    critChance: tower.attributes.critChance,
                    critMultiplier: tower.attributes.critMultiplier
                },
                timestamp: Date.now()
            }
        });
        
        cell.setTower(tower);
        this.entityManager.addEntity(tower);
        activePlayer.addTower(tower);
        
        // Emit tower placed event (SOURCEABLE: business event)
        const event = new TowerPlacedEvent(tower, cell, {
            towerType: towerTypeId,
            cost: cost,
            playerId: activePlayer.id,
            cellPosition: { row: cell.row, col: cell.col },
            timestamp: Date.now()
        });
        this.events.emit('towerPlaced', event);
        
        this.debug.success('Tower placed', {
            player: activePlayer.name,
            totalTowers: activePlayer.towers.length
        });
        
        return true;
    }
    
    /**
     * Place N towers randomly on empty cells (for testing)
     * @param {number} count
     * @returns {Array<Cell>} - Array of cells where towers were placed
     */
    placeRandomTowers(count) {
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
            // Choose random tower type for architecture testing
            const towerTypeIds = ['basic', 'sniper', 'artillery'];
            const towerTypeId = towerTypeIds[Math.floor(Math.random() * towerTypeIds.length)];
            const towerBlueprint = this.towerTypes[towerTypeId];
            
            const tower = new Tower(
                cell, 
                activePlayer.id,
                this.container,
                this,
                towerBlueprint
            );
            
            // Emit tower created event (SOURCEABLE: business event)
            this.events.emit('towerCreated', {
                sourceable: true,
                metadata: {
                    towerId: tower.id,
                    towerType: towerTypeId,
                    playerId: activePlayer.id,
                    cost: 0, // Free tower for testing
                    stats: {
                        damage: tower.attributes.damage,
                        range: tower.attributes.range,
                        fireRate: tower.attributes.fireRate,
                        critChance: tower.attributes.critChance,
                        critMultiplier: tower.attributes.critMultiplier
                    },
                    timestamp: Date.now()
                }
            });
            
            cell.setTower(tower);
            this.entityManager.addEntity(tower);
            activePlayer.addTower(tower);
            
            // Emit tower placed event (SOURCEABLE: business event)
            const event = new TowerPlacedEvent(tower, cell, {
                towerType: towerTypeId,
                cost: 0, // Free tower for testing
                playerId: activePlayer.id,
                cellPosition: { row: cell.row, col: cell.col },
                timestamp: Date.now()
            });
            this.events.emit('towerPlaced', event);
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
        owner.wallet.add('money', enemy.attributes.goldReward);
        
        // Update stats
        owner.stats.enemiesKilled++;
        owner.score += enemy.attributes.goldReward;
        
        // Update global score
        this.globalScore += enemy.attributes.goldReward;
        
        // Emit sourceable event (BUSINESS EVENT for Event Sourcing)
        this.events.emit('enemyKilled', {
            sourceable: true,
            metadata: {
                enemyId: enemy.id,
                enemyType: enemy.attributes.type || 'basic',
                killerId: killer.id,
                killerType: killer.attributes?.type || 'unknown',
                playerId: owner.id,
                goldReward: enemy.attributes.goldReward,
                position: { x: enemy.x, y: enemy.y },
                timestamp: Date.now()
            }
        });
        
        this.debug.success(`💰 ${owner.name} earned ${enemy.attributes.goldReward} gold`, { 
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
     * @param {Object} missileBlueprint - Full missile blueprint (config + visualFx)
     * @returns {Missile}
     */
    createMissile(tower, startX, startY, targetX, targetY, missileBlueprint) {
        const missile = new Missile(
            tower,
            startX, startY,
            targetX, targetY,
            missileBlueprint.speed,
            missileBlueprint.lifetime,
            missileBlueprint.splashRadius,
            missileBlueprint.damage,
            this.coordSystem,
            missileBlueprint.visualFx
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
        const baseDamage = missile.attributes.damage;
        
        // Calculate splash radius from missile attributes
        const splashRadius = missile.attributes.splashRadius * this.coordSystem.getCellSize();
        
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
                const isCritical = Math.random() < tower.attributes.critChance;
                const finalDamage = isCritical ? Math.floor(baseDamage * tower.attributes.critMultiplier) : baseDamage;
                
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
                    this.debug.success(`💥 CRITICAL HIT! Enemy ${enemy.id} hit for ${finalDamage} damage (${tower.attributes.critMultiplier}x) - HP: ${enemy.attributes.health}/${enemy.attributes.maxHealth}`);
                } else {
                    this.debug.debug(`Enemy ${enemy.id} hit for ${finalDamage} damage - HP: ${enemy.attributes.health}/${enemy.attributes.maxHealth}`);
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
     * Render game (called every frame)
     * @param {number} deltaTime - in seconds
     * @returns {void}
     */
    render(deltaTime) {
        // Update and render effects (clears canvas)
        this.canvasView.updateAndRenderEffects(deltaTime);
        
        // Render game entities
        const entities = this.entityManager.getEntities();
        
        // Debug: log entity types once
        if (!this._loggedEntities && entities.length > 0) {
            const types = entities.map(e => e.getType());
            this.debug.info('Rendering entities:', { count: entities.length, types });
            this._loggedEntities = true;
        }
        
        this.canvasView.renderEntities(entities, deltaTime);
        
        // Update gold display in header
        this.updateGoldDisplay();
    }
    
    /**
     * Update gold display in header
     * @returns {void}
     */
    updateGoldDisplay() {
        const activePlayer = this.playerManager.getActivePlayer();
        if (activePlayer) {
            const goldElement = document.getElementById('gold-amount');
            if (goldElement) {
                goldElement.textContent = activePlayer.wallet.get('money');
            }
        }
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
     * Destroy game and cleanup all resources
     * @returns {void}
     */
    destroy() {
        this.debug.info('🧹 Destroying Game...');
        
        // 1. Stop game clock
        if (this.gameClock) {
            this.gameClock.stop();
        }
        
        // 2. Remove event listeners
        const container = document.getElementById('grid-container');
        if (container) {
            if (this.boundHandleCellClick) {
                container.removeEventListener('click', this.boundHandleCellClick);
                container.removeEventListener('contextmenu', this.boundHandleCellClick);
            }
            if (this.boundHandleCellHover) {
                container.removeEventListener('mousemove', this.boundHandleCellHover);
            }
            if (this.boundHandleCellLeave) {
                container.removeEventListener('mouseleave', this.boundHandleCellLeave);
            }
        }
        
        const playerInfoBtn = document.getElementById('player-info-btn');
        if (playerInfoBtn && this.boundHandlePlayerInfoClick) {
            playerInfoBtn.removeEventListener('click', this.boundHandlePlayerInfoClick);
        }
        
        // Clear bound references
        this.boundHandleCellClick = null;
        this.boundHandleCellHover = null;
        this.boundHandleCellLeave = null;
        this.boundHandlePlayerInfoClick = null;
        
        // 3. Destroy owned instances
        if (this.gridSystem?.destroy) {
            this.gridSystem.destroy();
        }
        
        if (this.canvasView?.destroy) {
            this.canvasView.destroy();
        }
        
        if (this.towerRangeView?.destroy) {
            this.towerRangeView.destroy();
        }
        
        if (this.towerDragHandler?.destroy) {
            this.towerDragHandler.destroy();
        }
        
        if (this.towerStatsPopup?.destroy) {
            this.towerStatsPopup.destroy();
        }
        
        if (this.playerInfoPopup?.destroy) {
            this.playerInfoPopup.destroy();
        }
        
        if (this.debugPanel?.destroy) {
            this.debugPanel.destroy();
        }
        
        // 4. Null out references
        this.gameClock = null;
        this.entityManager = null;
        this.playerManager = null;
        this.waveManager = null;
        this.gridSystem = null;
        this.gridModel = null;
        this.canvasView = null;
        this.towerRangeView = null;
        this.towerDragHandler = null;
        this.towerStatsPopup = null;
        this.playerInfoPopup = null;
        this.debugPanel = null;
        this.coordSystem = null;
        this.container = null;
        
        this.debug.success('✅ Game destroyed');
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
