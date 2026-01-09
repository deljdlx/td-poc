import { Entity } from '../core/Entity.js';

/**
 * Missile - Projectile entity that travels from source to target
 * Managed by EntityManager, updated by GameClock
 */
export class Missile extends Entity {
    /**
     * @type {number}
     */
    targetX;
    
    /**
     * @type {number}
     */
    targetY;
    
    /**
     * @type {number}
     */
    speed;
    
    /**
     * @type {number}
     */
    vx;
    
    /**
     * @type {number}
     */
    vy;
    
    /**
     * @type {string}
     */
    color;
    
    /**
     * @type {number}
     */
    size;
    
    /**
     * @type {Array<Object>}
     */
    trail;
    
    /**
     * @type {number}
     */
    trailLength;
    
    /**
     * @type {Function|null}
     */
    onArrival;
    
    /**
     * @type {number}
     */
    age;
    
    /**
     * @type {number}
     */
    maxLifeTime;
    
    /**
     * @type {number}
     */
    splashRadius;
    
    /**
     * @type {number}
     */
    damage;
    
    /**
     * @type {Object}
     */
    coordSystem;
    
    /**
     * @type {number}
     */
    critChance;
    
    /**
     * @type {number}
     */
    critMultiplier;
    
    /**
     * @param {number} x - Start X position
     * @param {number} y - Start Y position
     * @param {number} targetX - Target X position
     * @param {number} targetY - Target Y position
     * @param {number} speed - Missile speed in pixels/second (default: 200)
     * @param {Function} onArrival - Callback when missile reaches target (receives impactX, impactY, splashRadiusPixels, damage, critChance, critMultiplier)
     * @param {number} maxLifeTime - Maximum lifetime in seconds (default: 3.0)
     * @param {number} splashRadius - Splash damage radius in CELLS (default: 0.5)
     * @param {number} damage - Damage amount (default: 25)
     * @param {Object} coordSystem - Coordinate system for conversions
     * @param {number} critChance - Critical hit chance 0.0-1.0 (default: 0.0 = 0%)
     * @param {number} critMultiplier - Critical damage multiplier (default: 1.5)
     */
    constructor(x, y, targetX, targetY, speed = 200, onArrival = null, maxLifeTime = 3.0, splashRadius = 0.5, damage = 25, coordSystem = null, critChance = 0.0, critMultiplier = 1.5) {
        super('missile', x, y);
        
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed;
        
        // Calculate direction vector
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize and scale by speed
        this.vx = (dx / distance) * speed;
        this.vy = (dy / distance) * speed;
        
        this.color = '#ff6b6b';
        this.size = 4;
        this.trail = [];
        this.trailLength = 10;
        this.onArrival = onArrival;
        this.age = 0;
        this.maxLifeTime = maxLifeTime;
        this.splashRadius = splashRadius; // In cells
        this.damage = damage;
        this.coordSystem = coordSystem;
        this.critChance = critChance;
        this.critMultiplier = critMultiplier;
    }
    
    /**
     * Update missile position and check arrival
     * @param {number} deltaTime - Time delta in seconds
     * @returns {void}
     */
    update(deltaTime) {
        // Increment age
        this.age += deltaTime;
        
        // Check if exceeded max lifetime
        if (this.age >= this.maxLifeTime) {
            this.kill();
            return;
        }
        
        // Store current position for trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailLength) {
            this.trail.shift();
        }
        
        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Check if reached target (threshold: 5 pixels)
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
        
        if (distanceToTarget < 5) {
            // Trigger arrival callback before death
            if (this.onArrival) {
                // Convert splash radius from cells to pixels for rendering
                const splashRadiusPixels = this.coordSystem ? this.coordSystem.cellsToPixels(this.splashRadius) : this.splashRadius;
                this.onArrival(this.targetX, this.targetY, splashRadiusPixels, this.damage, this.critChance, this.critMultiplier);
            }
            this.kill();
        }
    }
}
