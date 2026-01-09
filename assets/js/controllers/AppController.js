import { GridModel } from '../models/core/GridModel.js';
import { GridView } from '../views/GridView.js';
import { CanvasView } from '../views/CanvasView.js';
import { TowerRangeView } from '../views/TowerRangeView.js';
import { TowerDragHandler } from './TowerDragHandler.js';
import { Game } from '../models/gameplay/Game.js';

/**
 * Contrôleur principal de l'application
 */
export class AppController {
    /** @type {GridModel} */
    model = null;

    /** @type {GridView} */
    gridView = null;

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
    
    /** @type {TowerStatsPopup} */
    towerStatsPopup = null;
    
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
        
        // Initialisation avec injection
        this.model = new GridModel(15, 10, this.container);
        this.gridView = new GridView('grid-container', this.model, this.container);
        this.canvasView = new CanvasView('canvas-layer', this.coordSystem, this.container);
        this.towerRangeView = new TowerRangeView(this.container);
        
        // Initialize Game with all dependencies
        this.game = new Game(
            this.model,
            this.entityManager,
            this.playerManager,
            waveManager,
            this.coordSystem,
            this.container
        );
        
        // Initialize TowerDragHandler (UI service)
        this.towerDragHandler = new TowerDragHandler(
            this.model,
            this.gridView,
            this.coordSystem,
            this.entityManager,
            this.container
        );
        
        // Connect TowerDragHandler to Game (delegation pattern)
        this.towerDragHandler.setMoveCallback((tower, fromCell, toCell) => {
            return this.game.moveTower(tower, fromCell, toCell);
        });
        
        this.debug.success('Application initialisée avec succès', {
            rows: this.model.rows,
            cols: this.model.cols
        });
        
        // Rendu initial
        this.gridView.render();
        
        // Initialize Game (creates paths, etc.)
        this.game.init();
        this.gridView.renderPaths();
        
        // Listen to game events for visual effects
        this.game.events.on('missileImpact', (event) => {
            this.canvasView.addSimpleExplosion(event.x, event.y);
            this.canvasView.addSplashEffect(event.x, event.y, event.splashRadius);
        });
        
        // Tower shoot callback - delegate to Game
        const onTowerShoot = (tower, x, y, targetX, targetY) => {
            this.game.createMissile(tower, x, y, targetX, targetY);
        };
        
        // Placer des tours aléatoirement pour le test
        const placedCells = this.game.placeRandomTowers(5, onTowerShoot);
        
        // Enable drag and drop for placed towers
        placedCells.forEach(cell => {
            this.towerDragHandler.enableTowerDrag(cell);
            this.gridView.updateCell(cell);
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
    }
    
    /**
     * @returns {void}
     */
    bindEvents() {
        const container = document.getElementById('grid-container');
        container.addEventListener('click', this.handleCellClick.bind(this));
        container.addEventListener('contextmenu', this.handleCellClick.bind(this)); // Right-click
        
        // Grid hover detection for tower range display (on cells, not canvas)
        container.addEventListener('mousemove', this.handleCellHover.bind(this));
        container.addEventListener('mouseleave', this.handleCellLeave.bind(this));
        
        // Player info button
        const playerInfoBtn = document.getElementById('player-info-btn');
        if (playerInfoBtn) {
            playerInfoBtn.addEventListener('click', () => {
                this.playerInfoPopup.show();
            });
        }
        
        window.addEventListener('resize', this.handleResize.bind(this));
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
        const cell = this.model.getCell(row, col);
        
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
     * Find closest enemy to a tower
     * @param {Tower} tower
     * @returns {Enemy|null}
     */
    findClosestEnemy(tower) {
        const enemies = this.entityManager.getEntities().filter(e => e.getType() === 'enemy' && e.alive);
        
        if (enemies.length === 0) {
            return null;
        }
        
        let closest = null;
        let minDistance = Infinity;
        
        enemies.forEach(enemy => {
            const dx = enemy.x - tower.x;
            const dy = enemy.y - tower.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                closest = enemy;
            }
        });
        
        return closest;
    }

    /**
     * Spawn enemy at position
     * @param {number} x
     * @param {number} y
     * @returns {void}
     */
    spawnEnemy(x, y) {
        const enemy = new Enemy(x, y);
        this.entityManager.addEntity(enemy);
        this.debug.success('Enemy spawned', { x, y });
    }
    
    /**
     * @returns {void}
     */
    handleResize() {
        this.updateCanvas();
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
        const cell = this.model.getCell(row, col);
        
        if (!cell || !cell.hasTower()) {
            this.towerRangeView.hide();
            return;
        }
        
        // Show range for this tower
        const tower = cell.getTower();
        this.towerRangeView.show(tower);
        // this.debug.debug('Showing tower range', { row, col, range: tower.range });
    }
    
    /**
     * Handle cell mouse leave
     * @returns {void}
     */
    handleCellLeave() {
        this.towerRangeView.hide();
    }
    
    /**
     * @returns {void}
     */
    updateCanvas() {
        const selectedCells = this.model.getSelectedCells();
        this.debug.data('Mise à jour du canvas', {
            cellCount: selectedCells.length
        });
        this.canvasView.drawConnections(selectedCells);
    }
}
