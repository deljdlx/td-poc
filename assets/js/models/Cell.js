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
    
    /** @type {boolean} */
    isOnPath = false;
    
    /** @type {HTMLElement|null} */
    element = null;
    
    /** @type {Tower|null} */
    tower = null;
    
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
     * Mark cell as part of a path
     * @param {boolean} value
     * @returns {void}
     */
    setOnPath(value) {
        this.isOnPath = value;
    }
    
    /**
     * @returns {string}
     */
    getLabel() {
        return `${this.row},${this.col}`;
    }
    
    /**
     * Set tower on this cell
     * @param {Tower} tower
     * @returns {void}
     */
    setTower(tower) {
        this.tower = tower;
    }
    
    /**
     * Get tower on this cell
     * @returns {Tower|null}
     */
    getTower() {
        return this.tower;
    }
    
    /**
     * Check if cell has a tower
     * @returns {boolean}
     */
    hasTower() {
        return this.tower !== null;
    }
}
