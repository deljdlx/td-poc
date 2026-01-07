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
     * @type {number}
     */
    range;
    
    /**
     * @type {Object}
     */
    coordSystem;
    
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
        this.range = 3.5; // Range in cells (logical unit)
        this.coordSystem = coordSystem;
        
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
    
    /**
     * Get distance to another entity
     * @param {Entity} entity
     * @returns {number} - Distance in pixels
     */
    getDistanceTo(entity) {
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Get all enemies within tower range
     * @param {EntityManager} entityManager
     * @returns {Array<Enemy>} - Enemies in range
     */
    getEnemiesInRange(entityManager) {
        const rangePixels = this.coordSystem.cellsToPixels(this.range);
        const enemies = entityManager.getEntities().filter(e => 
            e.getType() === 'enemy' && e.alive
        );
        
        return enemies.filter(enemy => {
            const distance = this.getDistanceTo(enemy);
            return distance <= rangePixels;
        });
    }
    
    /**
     * Get closest enemy within tower range
     * @param {EntityManager} entityManager
     * @returns {Enemy|null} - Closest enemy or null if none in range
     */
    getClosestEnemyInRange(entityManager) {
        const enemiesInRange = this.getEnemiesInRange(entityManager);
        
        if (enemiesInRange.length === 0) {
            return null;
        }
        
        let closest = enemiesInRange[0];
        let minDistance = this.getDistanceTo(closest);
        
        for (let i = 1; i < enemiesInRange.length; i++) {
            const distance = this.getDistanceTo(enemiesInRange[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closest = enemiesInRange[i];
            }
        }
        
        return closest;
    }
}
