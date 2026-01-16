import { CellAttributes } from '../value-objects/CellAttributes.js';
import { EventBus } from '../../../services/core/EventBus.js';

/**
 * Entity - Cellule de la carte (PURE DATA LAYER)
 * Domain events: cell:towerChanged
 */
export class Cell {
    /** @type {CellAttributes} */
    attributes = null;
    
    /** @type {HTMLElement|null} */
    element = null;
    
    /** @type {Tower|null} */
    tower = null;
    
    /**
     * @param {number} row
     * @param {number} col
     */
    constructor(row, col) {
        this.attributes = new CellAttributes(row, col, false, false);
    }
    
    /** @returns {number} */
    get row() {
        return this.attributes.row;
    }
    
    /** @returns {number} */
    get col() {
        return this.attributes.col;
    }
    
    /** @returns {boolean} */
    get isTarget() {
        return this.attributes.isTarget;
    }
    
    /** @returns {boolean} */
    get isOnPath() {
        return this.attributes.isOnPath;
    }
    
    /**
     * @param {boolean} value
     * @returns {void}
     */
    setTarget(value) {
        this.attributes.setTarget(value);
    }
    
    /**
     * Mark cell as part of a path
     * @param {boolean} value
     * @returns {void}
     */
    setOnPath(value) {
        this.attributes.setOnPath(value);
    }
    
    /**
     * @returns {string}
     */
    getLabel() {
        return `${this.row},${this.col}`;
    }
    
    /**
     * Set tower on this cell (PURE DATA - NO DOM)
     * Emits: cell:towerChanged domain event
     * @param {Tower} tower
     * @returns {void}
     */
    setTower(tower) {
        const oldTower = this.tower;
        this.tower = tower;
        
        // Emit domain event for view layer to react
        EventBus.emitGlobal('cell:towerChanged', {
            cell: this,
            oldTower,
            newTower: tower
        });
    }
    
    /**
     * Remove tower from this cell (PURE DATA - NO DOM)
     * Emits: cell:towerChanged domain event via setTower()
     * @returns {void}
     */
    removeTower() {
        // Reuse setTower to ensure event emission
        this.setTower(null);
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
