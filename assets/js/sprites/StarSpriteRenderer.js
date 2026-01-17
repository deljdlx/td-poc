import { SpriteRenderer } from './SpriteRenderer.js';

/**
 * StarSpriteRenderer - Star-shaped sprite with rotation
 */
export class StarSpriteRenderer extends SpriteRenderer {
    /**
     * @type {number}
     */
    spikes;

    /**
     * @type {number}
     */
    rotation;

    /**
     * @type {number}
     */
    rotationSpeed;

    /**
     * @param {number} spikes - Number of star spikes (default: 5)
     * @param {number} rotationSpeed - Rotation speed in radians/second (default: 2)
     */
    constructor(spikes = 5, rotationSpeed = 2) {
        super();
        this.spikes = spikes;
        this.rotation = 0;
        this.rotationSpeed = rotationSpeed;
    }

    /**
     * Update rotation (call from game loop if needed)
     * @param {number} deltaTime - Time delta in seconds
     */
    update(deltaTime) {
        this.rotation += this.rotationSpeed * deltaTime;
    }

    /**
     * Draw star sprite with rotation
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} entity - Entity with {x, y, color, size}
     * @returns {void}
     */
    draw(ctx, entity) {
        // Étoiles nécessitent plus de taille pour être visibles
        const outerRadius = entity.size * 2.5;
        const innerRadius = entity.size * 1.2;

        ctx.save();
        ctx.translate(entity.x, entity.y);
        ctx.rotate(this.rotation);

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = entity.color;

        // Draw star
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = entity.color;
        ctx.beginPath();

        for (let i = 0; i < this.spikes * 2; i++) {
            const angle = (i * Math.PI) / this.spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
