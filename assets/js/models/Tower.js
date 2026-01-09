import { Entity } from './Entity.js';
import { TowerFiredEvent } from '../utils/events/TowerEvent.js';

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
     * @type {Object}
     */
    stats;
    
    /**
     * @type {number}
     */
    damage;
    
    /**
     * @type {number}
     */
    critChance;
    
    /**
     * @type {number}
     */
    critMultiplier;
    
    /**
     * @type {string}
     */
    playerId;
    
    /**
     * @type {Object<string, Array<Function>>}
     */
    eventListeners = {};
    
    /**
     * @param {Cell} cell - Grid cell where tower is placed
     * @param {string} playerId - ID of the player who owns this tower
     * @param {Function} onShoot - Callback to create missiles: (tower, x, y, targetX, targetY) => void
     * @param {DIContainer} diContainer
     */
    constructor(cell, playerId, onShoot, diContainer) {
        const debug = diContainer.createDebug('Tower', true);
        const coordSystem = diContainer.get('coordinateSystem');
        const entityManager = diContainer.get('entityManager');
        
        // Get cell center position
        const center = coordSystem.getElementCenter(cell.element);
        
        super('tower', center.x, center.y);
        
        this.cell = cell;
        this.playerId = playerId;
        this.onShoot = onShoot;
        this.color = '#6366f1'; // Blue for towers (will be player color later)
        this.size = 8;
        this.range = 3.5; // Range in cells (logical unit)
        this.coordSystem = coordSystem;
        this.entityManager = entityManager;
        this.cooldown = 1.0; // 1 second between shots
        this.currentCooldown = 0.0; // Start ready to shoot
        this.damage = 25; // Base damage
        this.critChance = 0.0; // 0% crit chance
        this.critMultiplier = 1.5; // 1.5x crit multiplier
        this.eventListeners = {};
        
        // Stats tracking
        this.stats = {
            shotsFired: 0,
            hits: 0,
            totalDamage: 0,
            kills: 0,
            criticalHits: 0
        };
        
        debug.success('Tower created', { row: cell.row, col: cell.col, x: center.x, y: center.y });
    }
    
    /**
     * Add event listener
     * @param {string} eventName
     * @param {Function} callback
     * @returns {void}
     */
    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }
    
    /**
     * Remove event listener
     * @param {string} eventName
     * @param {Function} callback
     * @returns {void}
     */
    off(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            return;
        }
        this.eventListeners[eventName] = this.eventListeners[eventName].filter(cb => cb !== callback);
    }
    
    /**
     * Trigger event
     * @param {string} eventName
     * @param {*} data - Event data
     * @returns {void}
     * @private
     */
    emit(eventName, data) {
        if (!this.eventListeners[eventName]) {
            return;
        }
        this.eventListeners[eventName].forEach(callback => {
            callback(data);
        });
    }
    
    /**
     * Shoot missile towards target position
     * @param {number} targetX
     * @param {number} targetY
     * @param {Enemy} [target=null] - Target enemy (optional)
     * @returns {boolean} - True if shot was fired, false if on cooldown
     */
    shoot(targetX, targetY, target = null) {
        if (!this.canShoot()) {
            return false;
        }
        
        if (this.onShoot) {
            this.onShoot(this, this.x, this.y, targetX, targetY);
        }
        
        // Track shot
        this.stats.shotsFired++;
        
        // Emit typed event
        const event = new TowerFiredEvent(this, target, null); // missile is null for now
        this.emit('fired', event);
        
        // Reset cooldown
        this.currentCooldown = this.cooldown;
        return true;
    }
    
    /**
     * Track a successful hit
     * @param {number} damage
     * @param {boolean} isCrit
     * @returns {void}
     */
    trackHit(damage, isCrit) {
        this.stats.hits++;
        this.stats.totalDamage += damage;
        if (isCrit) {
            this.stats.criticalHits++;
        }
    }
    
    /**
     * Track a kill
     * @returns {void}
     */
    trackKill() {
        this.stats.kills++;
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
                this.shoot(enemy.x, enemy.y, enemy);
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
