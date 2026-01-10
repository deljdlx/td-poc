/**
 * Gère la conversion entre coordonnées DOM et Canvas
 */
export class CoordinateSystem {
    /** @type {number} */
    viewportWidth = window.innerWidth;
    
    /** @type {number} */
    viewportHeight = window.innerHeight;
    
    /** @type {Function|null} */
    boundUpdateViewportSize = null;
    
    constructor() {
        this.updateViewportSize();
        this.handleResize();
    }
    
    /**
     * @returns {void}
     */
    updateViewportSize() {
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
    }
    
    /**
     * @returns {void}
     */
    handleResize() {
        this.boundUpdateViewportSize = this.updateViewportSize.bind(this);
        window.addEventListener('resize', this.boundUpdateViewportSize);
    }
    
    /**
     * Obtient la position absolue d'un élément dans le viewport
     * @param {HTMLElement} element
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getElementAbsolutePosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
    }
    
    /**
     * Obtient le centre absolu d'un élément
     * @param {HTMLElement} element
     * @returns {{x: number, y: number}}
     */
    getElementCenter(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
    
    /**
     * Get the size of a cell in pixels by reading from DOM
     * @returns {number}
     */
    getCellSize() {
        // Get cell directly from DOM
        const gridContainer = document.getElementById('grid-container');
        if (!gridContainer) {
            console.warn('Grid container not found, returning default cell size');
            return 50; // Fallback
        }
        
        const firstCell = gridContainer.querySelector('.grid-cell');
        if (!firstCell) {
            console.warn('No grid cell found in DOM, returning default cell size');
            return 50;
        }
        
        const rect = firstCell.getBoundingClientRect();
        return rect.width; // Assuming square cells
    }
    
    /**
     * Convert cells to pixels
     * @param {number} cells - Number of cells
     * @returns {number} - Pixels
     */
    cellsToPixels(cells) {
        return cells * this.getCellSize();
    }
    
    /**
     * Convert pixels to cells
     * @param {number} pixels - Number of pixels
     * @returns {number} - Cells
     */
    pixelsToCells(pixels) {
        const cellSize = this.getCellSize();
        return cellSize > 0 ? pixels / cellSize : 0;
    }
    
    /**
     * Destroy CoordinateSystem and cleanup
     * @returns {void}
     */
    destroy() {
        if (this.boundUpdateViewportSize) {
            window.removeEventListener('resize', this.boundUpdateViewportSize);
            this.boundUpdateViewportSize = null;
        }
    }
}
