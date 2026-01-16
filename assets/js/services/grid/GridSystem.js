import { GridModel } from '../../domain/map/GridModel.js';
import { GridView } from '../../views/GridView.js';

/**
 * GridSystem - Facade encapsulating grid logic and rendering
 * Manages GridModel and GridView lifecycle as a unified system
 * Ownership: OWNS GridModel and GridView, SHARES CoordinateSystem
 */
export class GridSystem {
    /** @type {GridModel} */
    model = null;
    
    /** @type {GridView} */
    view = null;
    
    /** @type {CoordinateSystem} */
    coordSystem = null;
    
    /** @type {Debug} */
    debug = null;
    
    /** @type {DIContainer} */
    container = null;
    
    /**
     * @param {number} rows - Number of rows
     * @param {number} cols - Number of columns
     * @param {string} containerId - DOM container ID for grid
     * @param {DIContainer} diContainer - DI container
     */
    constructor(rows, cols, containerId, diContainer) {
        this.container = diContainer;
        this.debug = diContainer.createDebug('GridSystem', true);
        this.coordSystem = diContainer.get('coordinateSystem');  // SHARED service
        
        // Create OWNED instances
        this.model = new GridModel(rows, cols, diContainer);
        this.view = new GridView(containerId, this.model, diContainer);
        
        this.debug.success('GridSystem created', { rows, cols });
    }
    
    /**
     * Initialize grid (render initial state)
     * @returns {void}
     */
    init() {
        this.view.render();
        this.debug.info('GridSystem initialized');
    }
    
    /**
     * Render paths on grid
     * @returns {void}
     */
    renderPaths() {
        this.view.renderPaths();
    }
    
    /**
     * Get grid model
     * @returns {GridModel}
     */
    getModel() {
        return this.model;
    }
    
    /**
     * Get grid view
     * @returns {GridView}
     */
    getView() {
        return this.view;
    }
    
    /**
     * Get cell at position
     * @param {number} row
     * @param {number} col
     * @returns {Cell|null}
     */
    getCell(row, col) {
        return this.model.getCell(row, col);
    }
    
    /**
     * Update cell visual state
     * @param {Cell} cell
     * @returns {void}
     */
    updateCell(cell) {
        this.view.updateCell(cell);
    }
    
    /**
     * Get all paths
     * @returns {Array<Path>}
     */
    getPaths() {
        return this.model.getPaths();
    }
    
    /**
     * Destroy grid system and cleanup all resources
     * @returns {void}
     */
    destroy() {
        this.debug.info('🧹 Destroying GridSystem...');
        
        // Destroy OWNED instances
        if (this.view?.destroy) {
            this.view.destroy();
        }
        
        // Note: coordSystem is SHARED (DI service), don't destroy it
        // Note: model has no destroy() (no listeners, pure data)
        
        // Null references
        this.model = null;
        this.view = null;
        this.coordSystem = null;
        this.container = null;
        
        this.debug.success('✅ GridSystem destroyed');
    }
}
