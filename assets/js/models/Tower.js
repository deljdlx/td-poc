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
     * @type {number}
     */
    cooldown;
    
    /**
     * @type {number}
     */
    currentCooldown;
    
    /**
     * @type {EntityManager}
     */
    entityManager;
    
    /**
     * @param {Cell} cell - Grid cell where tower is placed
     * @param {Function} onShoot - Callback to create missiles: (x, y, targetX, targetY) => void
     * @param {DIContainer} diContainer
     */
    constructor(cell, onShoot, diContainer) {
        const debug = diContainer.createDebug('Tower', true);
        const coordSystem = diContainer.get('coordinateSystem');
        const entityManager = diContainer.get('entityManager');
        
        // Get cell center position
        const center = coordSystem.getElementCenter(cell.element);
        
        super('tower', center.x, center.y);
        
        this.cell = cell;
        this.onShoot = onShoot;
        this.color = '#6366f1'; // Blue for towers
        this.size = 8;
        this.range = 3.5; // Range in cells (logical unit)
        this.coordSystem = coordSystem;
        this.entityManager = entityManager;
        this.cooldown = 1.0; // 1 second between shots
        this.currentCooldown = 0.0; // Start ready to shoot
        
        debug.success('Tower created', { row: cell.row, col: cell.col, x: center.x, y: center.y });
    }
    
    /**
     * Shoot missile towards target position
     * @param {number} targetX
     * @param {number} targetY
     * @returns {boolean} - True if shot was fired, false if on cooldown
     */
    shoot(targetX, targetY) {
        if (!this.canShoot()) {
            return false;
        }
        
        if (this.onShoot) {
            this.onShoot(this.x, this.y, targetX, targetY);
        }
        
        // Reset cooldown
        this.currentCooldown = this.cooldown;
        return true;
    }
    
    /**
     * Update tower - manage cooldown and auto-targeting
     * @param {number} deltaTime
     * @returns {void}
     */
    update(deltaTime) {
        // Decrement cooldown
        if (this.currentCooldown > 0) {
            this.currentCooldown -= deltaTime;
            if (this.currentCooldown < 0) {
                this.currentCooldown = 0;
            }
        }
        
        // Auto-targeting: shoot closest enemy in range when cooldown ready
        if (this.canShoot()) {
            const enemy = this.getClosestEnemyInRange(this.entityManager);
            if (enemy) {
                this.shoot(enemy.x, enemy.y);
            }
        }
    }
    
    /**
     * Check if tower can shoot (cooldown ready)
     * @returns {boolean}
     */
    canShoot() {
        return this.currentCooldown <= 0;
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
