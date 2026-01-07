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
     * @type {string}
     */
    enemyType;
    
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
     * @type {HTMLElement|null}
     */
    domElement = null;
    
    /**
     * @param {number} x - Position X
     * @param {number} y - Position Y
     */
    constructor(x, y) {
        super('enemy', x, y);
        
        this.enemyType = 'basic';
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
            console.warn(`Enemy ${this.id}: currentElement is null at index ${this.currentPathIndex}/${this.path.getLength()}`);
            // Retour au début du path
            this.currentPathIndex = 0;
            return;
        }
        
        const nextElement = this.path.getNextElement(currentElement);
        
        if (!nextElement) {
            console.log(`Enemy ${this.id}: Fin du path, retour au début`);
            // Fin du path atteinte, retour au début (comportement en boucle)
            this.currentPathIndex = 0;
            return;
        }
        
        // Get target position (use getBoundingClientRect for absolute viewport coords)
        if (!nextElement.cell || !nextElement.cell.element) {
            console.error(`Enemy ${this.id}: nextElement.cell ou nextElement.cell.element est null!`, nextElement);
            this.currentPathIndex = 0;
            return;
        }
        
        const rect = nextElement.cell.element.getBoundingClientRect();
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;
        
        console.log(`Enemy ${this.id}: pos=(${this.x.toFixed(0)}, ${this.y.toFixed(0)}) -> target=(${targetX.toFixed(0)}, ${targetY.toFixed(0)}) index=${this.currentPathIndex}`);
        
        // Calculate direction
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if reached next waypoint
        if (distance < 2) {
            this.currentPathIndex++;
            // Si on dépasse la fin, retour au début
            if (this.currentPathIndex >= this.path.getLength()) {
                this.currentPathIndex = 0;
            }
            return;
        }
        
        // Move toward target
        const moveDistance = this.speed * deltaTime;
        
        if (moveDistance >= distance) {
            // Reach target this frame
            this.x = targetX;
            this.y = targetY;
            this.currentPathIndex++;
            // Si on dépasse la fin, retour au début
            if (this.currentPathIndex >= this.path.getLength()) {
                this.currentPathIndex = 0;
            }
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

