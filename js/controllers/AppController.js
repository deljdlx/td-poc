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
    
    /**
     * @returns {void}
     */
    init() {
        // Initialisation
        this.coordSystem = new CoordinateSystem();
        this.model = new GridModel(6, 8);
        this.gridView = new GridView('grid-container', this.model);
        this.canvasView = new CanvasView('canvas-layer', this.coordSystem);
        this.infoView = new InfoView();
        
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
