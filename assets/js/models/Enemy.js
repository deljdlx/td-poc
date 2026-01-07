import { Entity } from './Entity.js';

/**
 * Enemy - Enemy entity that follows paths
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
     * @type {number}
     */
    speed;
    
    /**
     * @type {Path|null}
     */
    path = null;
    
    /**
     * @type {number}
     */
    currentPathIndex = 0;
    
    /**
     * @type {boolean}
     */
    reachedEnd = false;
    
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
        this.speed = 50; // pixels per second
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
     * Update enemy movement along path
     * @param {number} deltaTime - in seconds
     * @returns {void}
     */
    update(deltaTime) {
        if (!this.path || this.reachedEnd) {
            return;
        }
        
        this.moveAlongPath(deltaTime);
    }
    
    /**
     * Move enemy along the path
     * @param {number} deltaTime - in seconds
     * @returns {void}
     */
    moveAlongPath(deltaTime) {
        const currentElement = this.path.getElementAt(this.currentPathIndex);
        
        if (!currentElement) {
            this.reachedEnd = true;
            this.onReachEnd();
            return;
        }
        
        const nextElement = this.path.getNextElement(currentElement);
        
        if (!nextElement) {
            this.reachedEnd = true;
            this.onReachEnd();
            return;
        }
        
        // Get target position (use getBoundingClientRect for absolute viewport coords)
        const rect = nextElement.cell.domElement.getBoundingClientRect();
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;
        
        // Calculate direction
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if reached next waypoint
        if (distance < 2) {
            this.currentPathIndex++;
            return;
        }
        
        // Move toward target
        const moveDistance = this.speed * deltaTime;
        
        if (moveDistance >= distance) {
            // Reach target this frame
            this.x = targetX;
            this.y = targetY;
            this.currentPathIndex++;
        } else {
            // Move partial distance
            this.x += (dx / distance) * moveDistance;
            this.y += (dy / distance) * moveDistance;
        }
    }
    
    /**
     * Called when enemy reaches end of path
     * @returns {void}
     */
    onReachEnd() {
        // Enemy escaped - deal damage to player base, remove enemy
        this.kill();
    }
}

