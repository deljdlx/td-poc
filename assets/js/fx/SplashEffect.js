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
     * @type {Array<Object>}
     */
    rings;
    
    /**
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} radius - Splash radius
     * @param {number} duration - Effect duration in seconds
     */
    constructor(x, y, radius, duration = 0.8) {
        this.x = x;
        this.y = y;
        this.maxRadius = radius;
        this.age = 0;
        this.duration = duration;
        this.alive = true;
        
        // Create multiple rings with different timings
        this.rings = [
            { delay: 0, speed: 1.2 },
            { delay: 0.08, speed: 1.0 },
            { delay: 0.16, speed: 0.85 },
            { delay: 0.24, speed: 0.7 }
        ];
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
        
        // Render each ring
        this.rings.forEach(ring => {
            const ringAge = Math.max(0, this.age - ring.delay);
            const ringProgress = Math.min(1, (ringAge / this.duration) * ring.speed);
            
            if (ringProgress > 0 && ringProgress < 1) {
                const currentRadius = this.maxRadius * ringProgress;
                const opacity = (1 - ringProgress);
                
                // Outer glow (thick and bright)
                ctx.strokeStyle = `rgba(255, 80, 20, ${opacity * 0.9})`;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
                ctx.stroke();
                
                // Inner bright ring
                ctx.strokeStyle = `rgba(255, 220, 100, ${opacity})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
        
        // Flash at center (much brighter and larger)
        if (progress < 0.4) {
            const flashOpacity = (1 - progress / 0.4);
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.maxRadius * 0.5
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${flashOpacity})`);
            gradient.addColorStop(0.3, `rgba(255, 200, 50, ${flashOpacity * 0.8})`);
            gradient.addColorStop(0.6, `rgba(255, 100, 50, ${flashOpacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 80, 20, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.maxRadius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw splash zone indicator (more visible)
        if (progress < 0.6) {
            const zoneOpacity = (1 - progress / 0.6) * 0.35;
            ctx.fillStyle = `rgba(255, 120, 50, ${zoneOpacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.maxRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add bright ring at splash zone boundary
            ctx.strokeStyle = `rgba(255, 200, 100, ${zoneOpacity * 1.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.maxRadius, 0, Math.PI * 2);
            ctx.stroke();
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
