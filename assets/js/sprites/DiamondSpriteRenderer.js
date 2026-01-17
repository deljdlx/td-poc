import { SpriteRenderer } from './SpriteRenderer.js';

/**
 * DiamondSpriteRenderer - Diamond sprite with rotation
 */
export class DiamondSpriteRenderer extends SpriteRenderer {
    /**
     * @type {number}
     */
    rotation;

    /**
     * @type {number}
     */
    rotationSpeed;

    /**
     * @param {number} rotationSpeed - Rotation speed in radians/second (default: 2)
     */
    constructor(rotationSpeed = 2) {
        super();
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
     * Draw diamond sprite with rotation
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} entity - Entity with {x, y, color, size}
     * @returns {void}
     */
    draw(ctx, entity) {
        const size = entity.size;

        ctx.save();
        ctx.translate(entity.x, entity.y);
        ctx.rotate(this.rotation);

        // Glow effect
        ctx.shadowBlur = 12;
        ctx.shadowColor = entity.color;

        // Draw diamond (square rotated 45°)
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = entity.color;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
