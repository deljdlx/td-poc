import { Entity } from './Entity.js';

/**
 * Tower - Defensive tower entity that shoots missiles at targets
 * Placed on grid cells, shoots on demand (click)
 */
export class Tower extends Entity {
    /**
     * @type {Cell}
     */
    cell;
    
    /**
     * @type {Function}
     */
    onShoot;
    
    /**
     * @type {string}
     */
    color;
    
    /**
     * @type {number}
     */
    size;
    
    /**
     * @param {Cell} cell - Grid cell where tower is placed
     * @param {Function} onShoot - Callback to create missiles: (x, y, targetX, targetY) => void
     * @param {DIContainer} diContainer
     */
    constructor(cell, onShoot, diContainer) {
        const debug = diContainer.createDebug('Tower', true);
        const coordSystem = diContainer.get('coordinateSystem');
        
        // Get cell center position
        const center = coordSystem.getElementCenter(cell.element);
        
        super('tower', center.x, center.y);
        
        this.cell = cell;
        this.onShoot = onShoot;
        this.color = '#6366f1'; // Blue for towers
        this.size = 8;
        
        debug.success('Tower created', { row: cell.row, col: cell.col, x: center.x, y: center.y });
    }
    
    /**
     * Shoot missile towards target position
     * @param {number} targetX
     * @param {number} targetY
     * @returns {void}
     */
    shoot(targetX, targetY) {
        if (this.onShoot) {
            this.onShoot(this.x, this.y, targetX, targetY);
        }
    }
    
    /**
     * Update tower (no automatic behavior for now)
     * @param {number} deltaTime
     * @returns {void}
     */
    update(deltaTime) {
        // Towers are passive for now
        // Future: cooldown management, auto-targeting, etc.
    }
}
