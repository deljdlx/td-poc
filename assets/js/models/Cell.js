/**
 * Représente une cellule de la grille
 */
export class Cell {
    /** @type {number} */
    row = 0;
    
    /** @type {number} */
    col = 0;
    
    /** @type {boolean} */
    selected = false;
    
    /** @type {boolean} */
    isTarget = false;
    
    /** @type {HTMLElement|null} */
    element = null;
    
    /**
     * @param {number} row
     * @param {number} col
     */
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }
    
    /**
     * @returns {void}
     */
    toggle() {
        this.selected = !this.selected;
    }
    
    /**
     * @param {boolean} value
     * @returns {void}
     */
    setTarget(value) {
        this.isTarget = value;
    }
    
    /**
     * @returns {string}
     */
    getLabel() {
        return `${this.row},${this.col}`;
    }
}
