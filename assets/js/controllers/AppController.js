import { GridSystem } from '../services/grid/GridSystem.js';
import { CanvasView } from '../views/CanvasView.js';
import { TowerRangeView } from '../views/TowerRangeView.js';
import { TowerDragHandler } from '../ux/TowerDragHandler.js';
import { Game } from '../models/gameplay/Game.js';
import { DebugPanel } from '../views/DebugPanel.js';
import { EventBus } from '../services/core/EventBus.js';

/**
 * Contrôleur principal de l'application
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
     * @returns {void}
     */
    init() {
        this.debug.info('🚀 Initialisation de l\'application');
        
        // Récupération des services via DI
        this.coordSystem = this.container.get('coordinateSystem');
        this.gameClock = this.container.get('gameClock');
        this.entityManager = this.container.get('entityManager');
        this.towerStatsPopup = this.container.get('towerStatsPopup');
        this.playerInfoPopup = this.container.get('playerInfoPopup');
        this.playerManager = this.container.get('playerManager');
        const uiUpdateManager = this.container.get('uiUpdateManager');
        const waveManager = this.container.get('waveManager');
        
        // Initialize GridSystem (encapsulates GridModel + GridView)
        this.gridSystem = new GridSystem(15, 10, 'grid-container', this.container);
        this.canvasView = new CanvasView('canvas-layer', this.coordSystem, this.container);
        this.towerRangeView = new TowerRangeView(this.container);
        
        // Initialize Game with all dependencies (including CanvasView for visual effects)
        this.game = new Game(
            this.gridSystem.getModel(),
            this.entityManager,
            this.playerManager,
            waveManager,
            this.coordSystem,
            this.canvasView,
            this.container
        );
        
        // Initialize TowerDragHandler (UI service)
        this.towerDragHandler = new TowerDragHandler(
            this.gridSystem.getModel(),
            this.gridSystem.getView(),
            this.coordSystem,
            this.entityManager,
            this.container
        );

        // Listen to tower move attempts and delegate to Game
        EventBus.onGlobal('tower:moveAttempt', (data) => {
            const success = this.game.moveTower(data.tower, data.fromCell, data.toCell);
            if (success) {
                data.uiHandler.updateTowerUI(data.tower, data.fromCell, data.toCell);
            }
        });
        
        this.debug.success('Application initialisée avec succès', {
            rows: this.gridSystem.getModel().rows,
            cols: this.gridSystem.getModel().cols
        });
        
        // Initialize GridSystem (render grid)
        this.gridSystem.init();
        
        // Initialize Debug Panel
        this.debugPanel = new DebugPanel(this.container);
        
        // Initialize Game (creates paths, etc.)
        this.game.init();
        this.gridSystem.renderPaths();

        // Placer des tours aléatoirement pour le test
        const placedCells = this.game.placeRandomTowers(5);
        
        // Enable drag and drop for placed towers
        placedCells.forEach(cell => {
            this.towerDragHandler.enableTowerDrag(cell);
            this.gridSystem.updateCell(cell);
        });
        
        // Bind events
        this.bindEvents();
        
        // Configurer et démarrer GameClock
        this.setupGameClock();
        
        // Start the game (will start first wave)
        this.game.start();
    }

    /**
     * Configure la GameClock
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
        
        // Démarrer
        this.gameClock.start();
    }
    
    /**
     * Update gameplay (appelé à 60 Hz fixe)
     * @param {number} deltaTime - en secondes
     * @returns {void}
     */
    updateGameplay(deltaTime) {
        // Delegate to Game
        this.game.update(deltaTime);
    }
    
    /**
     * Render (appelé chaque frame)
     * @param {number} deltaTime - en secondes
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
