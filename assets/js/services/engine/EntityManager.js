/**
 * EntityManager - Manages all game entities lifecycle
 * Centralized manager for missiles, towers, enemies, projectiles, etc.
 */
export class EntityManager {
    /**
     * @type {Array<Entity>}
     */
    entities;
    
    /**
     * @type {Object}
     */
    debug;
    
    /**
     * @param {Object} container - DI container
     */
    constructor(container) {
        this.entities = [];
        this.debug = container.createDebug('EntityManager', true);
    }
    
    /**
     * Add an entity to the manager
     * @param {Entity} entity
     * @returns {void}
     */
    addEntity(entity) {
        this.entities.push(entity);
        this.debug.event(`Entity added: ${entity.getType()}`, {
            count: this.entities.length
        });
    }
    
    /**
     * Update all entities
     * @param {number} deltaTime - Time delta in seconds
     * @returns {void}
     */
    update(deltaTime) {
        for (const entity of this.entities) {
            if (entity.isAlive()) {
                entity.update(deltaTime);
            }
        }
        
        // Cleanup dead entities
        this.removeDeadEntities();
    }
    
    /**
     * Remove dead entities from the list
     * @returns {void}
     */
    removeDeadEntities() {
        const initialCount = this.entities.length;
        this.entities = this.entities.filter(entity => entity.isAlive());
        
        const removedCount = initialCount - this.entities.length;
        if (removedCount > 0) {
            this.debug.debug(`Removed ${removedCount} dead entities`, {
                remaining: this.entities.length
            });
        }
    }
    
    /**
     * Get all entities
     * @returns {Array<Entity>}
     */
    getEntities() {
        return this.entities;
    }
    
    /**
     * Get entities by type
     * @param {string} type - Entity type
     * @returns {Array<Entity>}
     */
    getEntitiesByType(type) {
        return this.entities.filter(entity => entity.getType() === type && entity.isAlive());
    }
    
    /**
     * Get all towers
     * @returns {Array<Tower>}
     */
    getTowers() {
        return this.getEntitiesByType('tower');
    }
    
    /**
     * Get entity count
     * @returns {number}
     */
    getEntityCount() {
        return this.entities.length;
    }
    
    /**
     * Clear all entities
     * @returns {void}
     */
    clear() {
        this.entities = [];
        this.debug.info('All entities cleared');
    }
}
