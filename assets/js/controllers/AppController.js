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
