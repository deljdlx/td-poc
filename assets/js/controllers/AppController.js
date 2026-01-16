import { GridSystem } from '../services/grid/GridSystem.js';
import { CanvasView } from '../views/CanvasView.js';
import { TowerRangeView } from '../views/TowerRangeView.js';
import { TowerDragHandler } from '../ux/TowerDragHandler.js';
import { Game } from '../domain/game/entities/Game.js';
import { DebugPanel } from '../views/DebugPanel.js';
import { EventBus } from '../services/core/EventBus.js';

/**
 * AppController - Main application controller
 * 
 * Responsibilities:
 * 1. Create and initialize app-specific components (Grid, Game, Views)
 * 2. Wire up dependencies between components
 * 3. Start the game loop
 * 4. Handle UI events
 * 
 * Initialization flow:
 * 1. Get DI services (CoordinateSystem, GameClock, EntityManager, etc.)
 * 2. Create GridSystem (GridModel + GridView)
 * 3. Create Views (CanvasView, TowerRangeView)
 * 4. Create Game (with all dependencies including GridModel)
 * 5. Create UI handlers (TowerDragHandler, DebugPanel)
 * 6. Initialize Game (create paths, setup listeners)
 * 7. Bind events and start game loop
 */
export class AppController {
    /** @type {GridSystem} */
    gridSystem = null;

    /** @type {CanvasView} */
    canvasView = null;

    /** @type {CoordinateSystem} */
    coordSystem = null;

    /** @type {Debug} */
    debug = null;
    
    /** @type {DIContainer} */
    container = null;

    /** @type {GameClock} */
    gameClock = null;
    
    /** @type {EntityManager} */
    entityManager = null;
    
    /** @type {PlayerManager} */
    playerManager = null;
    
    /** @type {TowerDragHandler} */
    towerDragHandler = null;
    
    /** @type {Game} */
    game = null;
    
    /** @type {TowerRangeView} */
    towerRangeView = null;
    
    /** @type {DebugPanel} */
    debugPanel = null;
    
    /** @type {TowerStatsPopup} */
    towerStatsPopup = null;
    
    /** @type {Function|null} */
    boundHandleCellClick = null;
    
    /** @type {Function|null} */
    boundHandleCellHover = null;
    
    /** @type {Function|null} */
    boundHandleCellLeave = null;
    
    /** @type {Function|null} */
    boundHandlePlayerInfoClick = null;
    
    /**
     * @param {DIContainer} container
     */
    constructor(container) {
        this.container = container;
        // Injection du debug
        this.debug = container.createDebug('AppController', true);
    }
    
    /**
     * Initialize the application
     * Creates and wires up all components in the correct order
     * @returns {void}
     */
    init() {
        this.debug.info('🚀 Initializing application');
        
        // === PHASE 1: Get DI services ===
        this.debug.info('📦 Phase 1: Loading DI services');
        this.coordSystem = this.container.get('coordinateSystem');
        this.gameClock = this.container.get('gameClock');
        this.entityManager = this.container.get('entityManager');
        this.towerStatsPopup = this.container.get('towerStatsPopup');
        this.playerInfoPopup = this.container.get('playerInfoPopup');
        this.playerManager = this.container.get('playerManager');
        const uiUpdateManager = this.container.get('uiUpdateManager');
        const waveManager = this.container.get('waveManager');
        
        // === PHASE 2: Create core components ===
        this.debug.info('🏗️  Phase 2: Creating core components');
        this.gridSystem = new GridSystem(15, 10, 'grid-container', this.container);
        this.canvasView = new CanvasView('canvas-layer', this.coordSystem, this.container);
        this.towerRangeView = new TowerRangeView(this.container);
        
        // === PHASE 3: Create Game (central game logic) ===
        this.debug.info('🎮 Phase 3: Initializing Game');
        this.game = new Game(
            this.gridSystem.getModel(),
            this.entityManager,
            this.playerManager,
            waveManager,
            this.coordSystem,
            this.canvasView,
            this.container
        );
        
        // === PHASE 4: Create UI handlers ===
        this.debug.info('🖱️  Phase 4: Creating UI handlers');
        this.towerDragHandler = new TowerDragHandler(
            this.gridSystem.getModel(),
            this.gridSystem.getView(),
            this.coordSystem,
            this.entityManager,
            this.container
        );

        // === PHASE 5: Wire up cross-component events ===
        this.debug.info('🔌 Phase 5: Wiring events');
        EventBus.onGlobal('tower:moveAttempt', (data) => {
            const success = this.game.moveTower(data.tower, data.fromCell, data.toCell);
            if (success) {
                data.uiHandler.updateTowerUI(data.tower, data.fromCell, data.toCell);
            }
        });
        
        // === PHASE 6: Initialize components ===
        this.debug.info('⚙️  Phase 6: Initializing components');
        this.gridSystem.init();
        this.debugPanel = new DebugPanel(this.container);
        this.game.init();
        this.gridSystem.renderPaths();

        // === PHASE 7: Setup initial game state ===
        this.debug.info('🎯 Phase 7: Setting up initial game state');
        const placedCells = this.game.placeRandomTowers(5);
        placedCells.forEach(cell => {
            this.towerDragHandler.enableTowerDrag(cell);
            this.gridSystem.updateCell(cell);
        });
        
        // === PHASE 8: Bind events and start ===
        this.debug.info('▶️  Phase 8: Binding events and starting');
        this.bindEvents();
        this.setupGameClock();
        
        this.debug.success('✅ Application initialized successfully', {
            rows: this.gridSystem.getModel().rows,
            cols: this.gridSystem.getModel().cols,
            towers: placedCells.length
        });
        
        // Start the game (will start first wave)
        this.game.start();
    }

    /**
     * Setup GameClock callbacks and start the game loop
     * @returns {void}
     */
    setupGameClock() {
        const uiUpdateManager = this.container.get('uiUpdateManager');
        
        // Update gameplay (fixed timestep)
        this.gameClock.setUpdateCallback(this.updateGameplay.bind(this));
        
        // Render callback (includes UI updates)
        this.gameClock.setRenderCallback((deltaTime) => {
            this.render(deltaTime);
            // Update UI components after render
            uiUpdateManager.update(deltaTime);
            // Update debug panel info
            if (this.debugPanel) {
                this.debugPanel.update({
                    fps: this.gameClock.getFPS(),
                    entityCount: this.entityManager.getEntities().length
                });
            }
        });
        
        // Start the clock
        this.gameClock.start();
    }
    
    /**
     * Update gameplay (called at fixed 60Hz timestep)
     * @param {number} deltaTime - in seconds
     * @returns {void}
     */
    updateGameplay(deltaTime) {
        // Delegate all gameplay logic to Game
        this.game.update(deltaTime);
    }
    
    /**
     * Render (called every frame)
     * @param {number} deltaTime - in seconds
     * @returns {void}
     */
    render(deltaTime) {
        // Update et render des effets autonomes (efface le canvas)
        this.canvasView.updateAndRenderEffects(deltaTime);
        
        // Render game entities (paths sont statiques en DOM, pas besoin de redraw)
        this.canvasView.renderEntities(this.entityManager.getEntities(), deltaTime);
        
        // Update gold display in header
        this.updateGoldDisplay();
    }
    
    /**
     * Update gold display in header
     * @returns {void}
     */
    updateGoldDisplay() {
        const activePlayer = this.game.playerManager.getActivePlayer();
        if (activePlayer) {
            const goldElement = document.getElementById('gold-amount');
            if (goldElement) {
                goldElement.textContent = activePlayer.wallet.get('money');
            }
        }
    }
    
    /**
     * @returns {void}
     */
    bindEvents() {
        const container = document.getElementById('grid-container');
        
        // Store bound references for cleanup
        this.boundHandleCellClick = this.handleCellClick.bind(this);
        this.boundHandleCellHover = this.handleCellHover.bind(this);
        this.boundHandleCellLeave = this.handleCellLeave.bind(this);
        
        container.addEventListener('click', this.boundHandleCellClick);
        container.addEventListener('contextmenu', this.boundHandleCellClick); // Right-click
        
        // Grid hover detection for tower range display (on cells, not canvas)
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
    }
    
    /**
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
            
            // Click on tower to show stats (auto-targeting handles shooting)
            event.preventDefault();
            this.debug.info('Opening tower stats popup');
            this.towerStatsPopup.show(tower);
        } else {
            // Empty cell clicked
            this.debug.event(`Empty cell clicked [${row}, ${col}]`);
            // Possibilité d'ajouter des événements personnalisés ici
        }
    }
    
    /**
     * Handle cell hover to show tower range
     * @param {MouseEvent} event
     * @returns {void}
     */
    handleCellHover(event) {
        // Check if hovering over a cell with a tower
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
     * Destroy AppController and cleanup all resources
     * @returns {void}
     */
    destroy() {
        this.debug.info('🧹 Destroying AppController...');
        
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
        
        // 3. Destroy OWNED instances
        if (this.gridSystem?.destroy) {
            this.gridSystem.destroy();
        }
        
        if (this.canvasView?.destroy) {
            this.canvasView.destroy();
        }
        
        if (this.towerRangeView?.destroy) {
            this.towerRangeView.destroy();
        }
        
        if (this.game?.destroy) {
            this.game.destroy();
        }
        
        if (this.towerDragHandler?.destroy) {
            this.towerDragHandler.destroy();
        }
        
        // 4. Null out references
        this.gridSystem = null;
        this.canvasView = null;
        this.towerRangeView = null;
        this.game = null;
        this.towerDragHandler = null;
        this.coordSystem = null;
        this.gameClock = null;
        this.entityManager = null;
        this.playerManager = null;
        this.towerStatsPopup = null;
        this.playerInfoPopup = null;
        this.container = null;
        
        this.debug.success('✅ AppController destroyed');
    }
}
// Cache buster: 1768587927
