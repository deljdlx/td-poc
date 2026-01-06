/**
 * Missile - Projectile entity that travels from source to target
 * Managed by EntityManager, updated by GameClock
 */
class Missile extends Entity {
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
     * @param {number} x - Start X position
     * @param {number} y - Start Y position
     * @param {number} targetX - Target X position
     * @param {number} targetY - Target Y position
     * @param {number} speed - Missile speed in pixels/second (default: 200)
     * @param {Function} onArrival - Callback when missile reaches target
     * @param {number} maxLifeTime - Maximum lifetime in seconds (default: 3.0)
     */
    constructor(x, y, targetX, targetY, speed = 200, onArrival = null, maxLifeTime = 3.0) {
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
                this.onArrival(this.targetX, this.targetY);
            }
            this.kill();
        }
    }
    
    /**
     * Draw missile on canvas
     * @param {CanvasRenderingContext2D} ctx
     * @returns {void}
     */
    draw(ctx) {
        ctx.save();
        
        // Draw trail
        if (this.trail.length > 1) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4;
            
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                const alpha = i / this.trail.length;
                ctx.globalAlpha = alpha * 0.4;
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
        }
        
        // Draw missile head with glow
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright center
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
