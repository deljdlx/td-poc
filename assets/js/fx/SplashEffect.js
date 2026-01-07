/**
 * SplashEffect - Visual effect for missile splash zone
 * Shows expanding rings with fade out
 */
export class SplashEffect {
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
    maxRadius;
    
    /**
     * @type {number}
     */
    age;
    
    /**
     * @type {number}
     */
    duration;
    
    /**
     * @type {boolean}
     */
    alive;
    
    /**
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} radius - Splash radius
     * @param {number} duration - Effect duration in seconds
     */
    constructor(x, y, radius, duration = 0.4) {
        this.x = x;
        this.y = y;
        this.maxRadius = radius;
        this.age = 0;
        this.duration = duration;
        this.alive = true;
    }
    
    /**
     * Update effect
     * @param {number} deltaTime - in seconds
     * @returns {void}
     */
    update(deltaTime) {
        this.age += deltaTime;
        
        if (this.age >= this.duration) {
            this.alive = false;
        }
    }
    
    /**
     * Render effect on canvas
     * @param {CanvasRenderingContext2D} ctx
     * @returns {void}
     */
    draw(ctx) {
        const progress = this.age / this.duration;
        
        ctx.save();
        
        // Single expanding ring
        const currentRadius = this.maxRadius * progress;
        const opacity = (1 - progress) * 0.6;
        
        // Outer ring
        ctx.strokeStyle = `rgba(255, 120, 50, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Subtle center flash
        if (progress < 0.3) {
            const flashOpacity = (1 - progress / 0.3) * 0.3;
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.maxRadius * 0.3
            );
            gradient.addColorStop(0, `rgba(255, 200, 100, ${flashOpacity})`);
            gradient.addColorStop(1, 'rgba(255, 120, 50, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.maxRadius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Subtle splash zone indicator
        if (progress < 0.4) {
            const zoneOpacity = (1 - progress / 0.4) * 0.15;
            ctx.fillStyle = `rgba(255, 150, 80, ${zoneOpacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.maxRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    /**
     * Check if effect is still alive
     * @returns {boolean}
     */
    isAlive() {
        return this.alive;
    }
}
