/**
 * SimpleExplosionEffect - Basic explosion effect for standard missiles
 * Simple expanding circle with fade out
 */
export class SimpleExplosionEffect {
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
     * @type {number}
     */
    maxRadius;

    /**
     * @type {string}
     */
    color;

    /**
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {Object} config - Configuration
     */
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.age = 0;
        this.duration = config.duration || 0.3;
        this.maxRadius = config.maxRadius || 15;
        this.color = config.color || '#ff6b6b';
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
        const radius = this.maxRadius * progress;
        const opacity = 1 - progress;

        ctx.save();

        // Outer ring
        ctx.strokeStyle = `rgba(255, 107, 107, ${opacity * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner flash
        if (progress < 0.5) {
            const flashOpacity = (1 - progress / 0.5) * 0.6;
            ctx.fillStyle = `rgba(255, 200, 100, ${flashOpacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Check if effect is dead
     * @returns {boolean}
     */
    get isDead() {
        return !this.alive;
    }

    /**
     * Check if effect is alive
     * @returns {boolean}
     */
    isAlive() {
        return this.alive;
    }
}
