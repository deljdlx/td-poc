import { Entity } from '../../../models/core/Entity.js';
import { MissileAttributes } from '../value-objects/MissileAttributes.js';
import { AttributesProxy } from '../../shared/AttributesProxy.js';
import { EventBus } from '../../../services/core/EventBus.js';

/**
 * Missile - Projectile entity that travels from source to target
 * Managed by EntityManager, updated by GameClock
 * 
 * Domain Entity (Combat Bounded Context)
 */
export class Missile extends Entity {
    /**
     * @type {Tower} Tower that fired this missile
     */
    tower;
    
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
     * @type {number}
     */
    age;
    
    /**
     * @type {number}
     */
    maxLifeTime;
    
    /**
     * @type {MissileAttributes} - Base attributes (internal storage)
     * @private
     */
    _attributes;
    
    /**
     * @type {AttributesProxy} - Proxy for attribute access with modifiers
     * @private
     */
    _attributesProxy;
    
    /**
     * @type {Object} - Visual effects configuration from blueprint
     */
    visualFx;
    
    /**
     * @type {Object}
     */
    coordSystem;
    
    /**
     * @param {Tower} tower - Tower that fired this missile
     * @param {number} x - Start X position
     * @param {number} y - Start Y position
     * @param {number} targetX - Target X position
     * @param {number} targetY - Target Y position
     * @param {number} speed - Missile speed in CELLS/second (will be converted to pixels/sec)
     * @param {number} maxLifeTime - Maximum lifetime in seconds (default: 3.0)
     * @param {number} splashRadius - Splash damage radius in CELLS (default: 0.5)
     * @param {number} damage - Damage amount (default: 25)
     * @param {Object} coordSystem - Coordinate system for conversions
     * @param {Object} visualFx - Visual effects configuration from blueprint
     */
    constructor(tower, x, y, targetX, targetY, speed = 4.0, maxLifeTime = 3.0, splashRadius = 0.5, damage = 25, coordSystem = null, visualFx = null) {
        super('missile', x, y);
        
        this.tower = tower;
        this.targetX = targetX;
        this.targetY = targetY;
        
        // Convert speed from cells/sec to pixels/sec (business logic → rendering)
        const speedInPixels = coordSystem ? coordSystem.cellsToPixels(speed) : speed * 50;
        this.speed = speedInPixels;
        
        // Calculate direction vector
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize and scale by speed (in pixels)
        this.vx = (dx / distance) * speedInPixels;
        this.vy = (dy / distance) * speedInPixels;
        
        // Visual effects from blueprint or defaults
        this.visualFx = visualFx || {
            trail: { color: '#ff6b6b', width: 2, length: 10 },
            explosion: { type: 'simple', scale: 1.0 }
        };
        
        this.color = this.visualFx.trail.color;
        this.size = 4;
        this.trail = [];
        this.trailLength = this.visualFx.trail.length || 10;
        this.age = 0;
        this.maxLifeTime = maxLifeTime;
        
        // Gameplay attributes (munition stats)
        this._attributes = new MissileAttributes(damage, splashRadius);
        this._attributesProxy = new AttributesProxy(this._attributes, this);
        
        this.coordSystem = coordSystem;
    }
    
    /**
     * Get attributes with modifiers applied
     * @returns {AttributesProxy}
     */
    get attributes() {
        return this._attributesProxy;
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
            // Emit impact event before death
            const splashRadiusPixels = this.coordSystem ? this.coordSystem.cellsToPixels(this.attributes.splashRadius) : this.attributes.splashRadius;
            EventBus.emitGlobal('missile:impact', {
                missile: this,
                x: this.targetX,
                y: this.targetY,
                splashRadius: splashRadiusPixels,
                visualFx: this.visualFx
            });
            this.kill();
        }
    }
}
