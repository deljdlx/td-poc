/**
 * TowerRangeEffect - Visual effect showing tower attack range
 * Displays on tower hover with gradient and animated ring
 */
export class TowerRangeEffect {
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
    radius;
    
    /**
     * @type {number}
     */
    opacity;
    
    /**
     * @type {number}
     */
    targetOpacity;
    
    /**
     * @type {number}
     */
    age;
    
    /**
     * @type {boolean}
     */
    alive;
    
    /**
     * @type {string}
     */
    color;
    
    /**
     * @type {boolean}
     */
    enablePulse;
    
    /**
     * @param {number} x - Tower center X
     * @param {number} y - Tower center Y
     * @param {number} radius - Range radius in pixels
     * @param {string} color - Base color (default: tower blue)
     * @param {boolean} enablePulse - Enable subtle pulse animation
     */
    constructor(x, y, radius, color = '#6366f1', enablePulse = true) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.enablePulse = enablePulse;
        
        this.opacity = 0;
        this.targetOpacity = 1;
        this.age = 0;
        this.alive = true;
    }
    
    /**
     * Update effect
     * @param {number} deltaTime - in seconds
     * @returns {void}
     */
    update(deltaTime) {
        this.age += deltaTime;
        
        // Smooth fade in/out
        const fadeSpeed = 5.0; // Higher = faster fade
        if (this.opacity < this.targetOpacity) {
            this.opacity = Math.min(this.targetOpacity, this.opacity + deltaTime * fadeSpeed);
        } else if (this.opacity > this.targetOpacity) {
            this.opacity = Math.max(this.targetOpacity, this.opacity - deltaTime * fadeSpeed);
        }
        
        // Mark as dead when fully faded out
        if (this.targetOpacity === 0 && this.opacity < 0.01) {
            this.alive = false;
        }
    }
    
    /**
     * Start fade out animation
     * @returns {void}
     */
    fadeOut() {
        this.targetOpacity = 0;
    }
    
    /**
     * Get current radius with pulse animation
     * @returns {number}
     */
    getCurrentRadius() {
        if (!this.enablePulse) {
            return this.radius;
        }
        
        // Subtle pulse: ±3% of radius over 2 seconds
        const pulseDuration = 2.0;
        const pulseAmplitude = 0.03;
        const pulseProgress = (this.age % pulseDuration) / pulseDuration;
        const pulseOffset = Math.sin(pulseProgress * Math.PI * 2) * pulseAmplitude;
        
        return this.radius * (1 + pulseOffset);
    }
    
    /**
     * Render effect on canvas
     * @param {CanvasRenderingContext2D} ctx
     * @returns {void}
     */
    draw(ctx) {
        if (this.opacity < 0.01) return;
        
        const currentRadius = this.getCurrentRadius();
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // 1. Radial gradient fill (coverage area)
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, currentRadius
        );
        
        // Parse color to extract RGB (assuming hex format)
        const r = parseInt(this.color.slice(1, 3), 16);
        const g = parseInt(this.color.slice(3, 5), 16);
        const b = parseInt(this.color.slice(5, 7), 16);
        
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`);
        gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.08)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 2. Outer ring with glow (precision indicator)
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 3. Inner ring (subtle detail)
        ctx.shadowBlur = 4;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    /**
     * Update position (when tower moves or for tracking)
     * @param {number} x
     * @param {number} y
     * @returns {void}
     */
    updatePosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    /**
     * Check if effect is still alive
     * @returns {boolean}
     */
    get isDead() {
        return !this.alive;
    }
}
