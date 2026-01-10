import { Event } from './Event.js';

/**
 * EnemyEvent - Base class for enemy-related events
 */
export class EnemyEvent extends Event {
    /**
     * @type {Enemy}
     */
    enemy;
    
    /**
     * @param {string} eventType - Specific enemy event type (hit, death, reachedEnd)
     * @param {Enemy} enemy - Enemy that emitted the event
     * @param {Object} [payload={}] - Additional event data
     */
    constructor(eventType, enemy, payload = {}) {
        super(`enemy:${eventType}`, enemy, payload);
        this.enemy = enemy;
    }
}

/**
 * EnemyHitEvent - Enemy took damage
 */
export class EnemyHitEvent extends EnemyEvent {
    /**
     * @type {number}
     */
    damage;
    
    /**
     * @type {number}
     */
    previousHealth;
    
    /**
     * @type {number}
     */
    currentHealth;
    
    /**
     * @param {Enemy} enemy
     * @param {number} damage
     * @param {number} previousHealth
     * @param {number} currentHealth
     */
    constructor(enemy, damage, previousHealth, currentHealth) {
        super('hit', enemy, { damage, previousHealth, currentHealth });
        this.damage = damage;
        this.previousHealth = previousHealth;
        this.currentHealth = currentHealth;
    }
}

/**
 * EnemyDeathEvent - Enemy was killed
 */
export class EnemyDeathEvent extends EnemyEvent {
    /**
     * @type {Object}
     */
    position;
    
    /**
     * @param {Enemy} enemy
     * @param {Object} position - {x, y}
     */
    constructor(enemy, position) {
        super('death', enemy, { position });
        this.position = position;
    }
}

/**
 * EnemyReachedEndEvent - Enemy reached end of path
 */
export class EnemyReachedEndEvent extends EnemyEvent {
    /**
     * @type {Object}
     */
    position;
    
    /**
     * @param {Enemy} enemy
     * @param {Object} position - {x, y}
     */
    constructor(enemy, position) {
        super('reachedEnd', enemy, { position });
        this.position = position;
    }
}

/**
 * EnemySpawnedEvent - Enemy was spawned on the map
 */
export class EnemySpawnedEvent extends EnemyEvent {
    /**
     * @type {Object}
     */
    position;
    
    /**
     * @param {Enemy} enemy
     * @param {Object} position - {x, y}
     */
    constructor(enemy, position) {
        super('spawned', enemy, { position });
        this.position = position;
    }
}
