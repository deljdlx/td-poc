import { Entity } from './Entity.js';

/**
 * Enemy - Enemy entity (static for now, will move later)
 * Represents hostile units that towers shoot at
 */
export class Enemy extends Entity {
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
    health;
    
    /**
     * @type {number}
     */
    maxHealth;
    
    /**
     * @param {number} x - Position X
     * @param {number} y - Position Y
     */
    constructor(x, y) {
        super('enemy', x, y);
        
        this.color = '#dc2626'; // Red for enemies
        this.size = 10;
        this.health = 100;
        this.maxHealth = 100;
    }
    
    /**
     * Take damage from missile
     * @param {number} amount
     * @returns {void}
     */
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.kill();
        }
    }
    
    /**
     * Check if enemy is dead
     * @returns {boolean}
     */
    isDead() {
        return this.health <= 0 || !this.alive;
    }
    
    /**
     * Update enemy (no movement for now)
     * @param {number} deltaTime
     * @returns {void}
     */
    update(deltaTime) {
        // Future: movement logic
    }
}
