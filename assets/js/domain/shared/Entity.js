/**
 * Entity - Base class for all game entities
 * Abstract class defining common interface for missiles, towers, enemies, etc.
 */
export class Entity {
    /**
     * @type {number}
     * @static
     * @private
     */
    static _nextId = 1;

    /**
     * @type {number}
     */
    id;

    /**
     * @type {string}
     */
    type;

    /**
     * @type {number}
     */
    x;

    /**
     * @type {number}
     */
    y;

    /**
     * @type {boolean}
     */
    alive;

    /**
     * @param {string} type - Entity type identifier
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    constructor(type, x, y) {
        this.id = Entity._nextId++;
        this.type = type;
        this.x = x;
        this.y = y;
        this.alive = true;
    }

    /**
     * Update entity logic (must be implemented by subclasses)
     * @param {number} deltaTime - Time delta in seconds
     * @returns {void}
     */
    update(deltaTime) {
        throw new Error('Entity.update() must be implemented by subclass');
    }

    /**
     * Check if entity is still alive
     * @returns {boolean}
     */
    isAlive() {
        return this.alive;
    }

    /**
     * Get entity type
     * @returns {string}
     */
    getType() {
        return this.type;
    }

    /**
     * Mark entity as dead for cleanup
     * @returns {void}
     */
    kill() {
        this.alive = false;
    }
}
