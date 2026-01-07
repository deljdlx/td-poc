/**
 * TowerRangeView - DOM-based tower range indicator
 * Creates and manages the visual range display for towers
 */
export class TowerRangeView {
    /**
     * @type {HTMLElement}
     */
    element;
    
    /**
     * @type {Debug}
     */
    debug;
    
    /**
     * @type {CoordinateSystem}
     */
    coordSystem;
    
    /**
     * @param {DIContainer} diContainer
     */
    constructor(diContainer) {
        this.debug = diContainer.createDebug('TowerRangeView', true);
        this.coordSystem = diContainer.get('coordinateSystem');
        this.createElement();
    }
    
    /**
     * Create the DOM element for range indicator
     * @returns {void}
     */
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'tower-range-indicator';
        document.body.appendChild(this.element);
        this.debug.success('Tower range indicator created');
    }
    
    /**
     * Show range for a specific tower
     * @param {Tower} tower
     * @returns {void}
     */
    show(tower) {
        // Convert range from cells to pixels
        const rangePixels = this.coordSystem.cellsToPixels(tower.range);
        const diameter = rangePixels * 2;
        
        // Position at tower center
        this.element.style.left = tower.x + 'px';
        this.element.style.top = tower.y + 'px';
        this.element.style.width = diameter + 'px';
        this.element.style.height = diameter + 'px';
        
        // Show with animation
        requestAnimationFrame(() => {
            this.element.classList.add('visible');
        });
        
        this.debug.debug('Tower range shown', { 
            range: tower.range, 
            rangePixels, 
            position: { x: tower.x, y: tower.y }
        });
    }
    
    /**
     * Hide the range indicator
     * @returns {void}
     */
    hide() {
        this.element.classList.remove('visible');
        this.debug.debug('Tower range hidden');
    }
}
