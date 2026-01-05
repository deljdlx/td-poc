/**
 * Représente une cellule de la grille
 */
class Cell {
    /** @type {number} */
    row = 0;
    
    /** @type {number} */
    col = 0;
    
    /** @type {boolean} */
    selected = false;
    
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
     * @returns {string}
     */
    getLabel() {
        return `${this.row},${this.col}`;
    }
}
