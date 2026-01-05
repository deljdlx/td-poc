/**
 * Contrôleur principal de l'application
 */
class AppController {
    /** @type {GridModel} */
    model = null;
    
    /** @type {GridView} */
    gridView = null;
    
    /** @type {CanvasView} */
    canvasView = null;
    
    /** @type {InfoView} */
    infoView = null;
    
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
        
        // Initialisation avec injection
        this.model = new GridModel(6, 8, this.container);
        this.gridView = new GridView('grid-container', this.model, this.container);
        this.canvasView = new CanvasView('canvas-layer', this.coordSystem, this.container);
        this.infoView = new InfoView(this.container);
        
        this.debug.success('Application initialisée avec succès', {
            rows: this.model.rows,
            cols: this.model.cols
        });
        
        // Rendu initial
        this.gridView.render();
        
        // Bind events
        this.bindEvents();
        
        // Configurer et démarrer GameClock
        this.setupGameClock();
    }
    
    /**
     * Configure la GameClock
     * @returns {void}
     */
    setupGameClock() {
        // Update gameplay (fixed timestep)
        this.gameClock.setUpdateCallback(this.updateGameplay.bind(this));
        
        // Render (variable timestep)
        this.gameClock.setRenderCallback(this.render.bind(this));
        
        // Démarrer
        this.gameClock.start();
    }
    
    /**
     * Update gameplay (appelé à 60 Hz fixe)
     * @param {number} deltaTime - en secondes
     * @returns {void}
     */
    updateGameplay(deltaTime) {
        // Update all game entities (missiles, towers, enemies, etc.)
        this.entityManager.update(deltaTime);
    }
    
    /**
     * Render (appelé chaque frame)
     * @param {number} deltaTime - en secondes
     * @returns {void}
     */
    render(deltaTime) {
        // Update et render des effets autonomes
        this.canvasView.updateAndRenderEffects(deltaTime);
        
        // Render game entities
        this.canvasView.renderEntities(this.entityManager.getEntities());
    }
    
    /**
     * @returns {void}
     */
    bindEvents() {
        const container = document.getElementById('grid-container');
        container.addEventListener('click', this.handleCellClick.bind(this));
        
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
        
        if (cell) {
            this.debug.event(`Click sur cellule [${row}, ${col}]`, {
                before: cell.selected,
                after: !cell.selected
            });
            
            // Effet feu d'artifice au centre de la cellule
            const center = this.coordSystem.getElementCenter(cell.element);
            this.canvasView.addFirework(center.x, center.y);
            
            // Créer un missile vers le centre de la grille
            const targetCell = this.model.getCell(
                Math.floor(this.model.rows / 2),
                Math.floor(this.model.cols / 2)
            );
            if (targetCell) {
                const targetCenter = this.coordSystem.getElementCenter(targetCell.element);
                const missile = new Missile(center.x, center.y, targetCenter.x, targetCenter.y, 200);
                this.entityManager.addEntity(missile);
            }
            
            cell.toggle();
            this.gridView.updateCell(cell);
            this.updateCanvas();
            this.updateInfo();
        }
    }
    
    /**
     * @returns {void}
     */
    handleResize() {
        this.updateCanvas();
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
    
    /**
     * @returns {void}
     */
    updateInfo() {
        const count = this.model.getSelectedCells().length;
        this.infoView.updateCount(count);
    }
}
