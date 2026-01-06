/**
 * Particle - Base class for all particle types
 * Handles physics (position, velocity, lifetime)
 * Subclasses implement their own draw() method
 */
export class Particle {
    /**
     * @type {number}
     */
    x;
    
    /**
     * @type {number}
     */
    y;
    
    /**
     * @type {number}
     */
    vx;
    
    /**
     * @type {number}
     */
    vy;
    
    /**
     * @type {number}
     */
    life;
    
    /**
     * @type {number}
     */
    maxLife;
    
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
    rotation;
    
    /**
     * @type {number}
     */
    rotationSpeed;
    
    /**
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     * @param {number} vx - Initial X velocity (pixels/second)
     * @param {number} vy - Initial Y velocity (pixels/second)
     * @param {string} color - Particle color
     * @param {number} size - Particle size
     * @param {number} maxLife - Maximum lifetime in seconds
     */
    constructor(x, y, vx, vy, color, size, maxLife = 2.0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = maxLife;
        this.maxLife = maxLife;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 4; // radians per second
    }
    
    /**
     * Update particle physics
     * @param {number} deltaTime - Time delta in seconds
     * @param {number} gravity - Gravity acceleration (pixels/second²)
     * @param {number} friction - Air friction coefficient (0-1)
     * @returns {boolean} - True if particle is still alive
     */
    update(deltaTime, gravity, friction) {
        // Apply gravity
        this.vy += gravity * deltaTime;
        
        // Apply air friction
        this.vx *= Math.pow(friction, deltaTime);
        this.vy *= Math.pow(friction, deltaTime);
        
        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Update rotation
        this.rotation += this.rotationSpeed * deltaTime;
        
        // Decrease life
        this.life -= deltaTime;
        
        return this.life > 0;
    }
    
    /**
     * Get current opacity based on lifetime
     * @returns {number} - Opacity (0-1)
     */
    getOpacity() {
        return Math.max(0, this.life / this.maxLife);
    }
    
    /**
     * Draw the particle (to be implemented by subclasses)
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        throw new Error('Particle.draw() must be implemented by subclass');
    }
}
