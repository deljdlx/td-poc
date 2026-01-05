/**
 * Gère la conversion entre coordonnées DOM et Canvas
 */
class CoordinateSystem {
    /** @type {number} */
    viewportWidth = window.innerWidth;
    
    /** @type {number} */
    viewportHeight = window.innerHeight;
    
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
        window.addEventListener('resize', this.updateViewportSize.bind(this));
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
}
