import { SpriteRenderer } from './SpriteRenderer.js';

/**
 * SquareSpriteRenderer - Square sprite with rotation
 */
export class SquareSpriteRenderer extends SpriteRenderer {
    /**
     * @type {number}
     */
    rotation;

    /**
     * @type {number}
     */
    rotationSpeed;

    /**
     * @param {number} rotationSpeed - Rotation speed in radians/second (default: 3)
     */
    constructor(rotationSpeed = 3) {
        super();
        this.rotation = Math.PI / 4; // Start at 45°
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
     * Draw square sprite with rotation
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} entity - Entity with {x, y, color, size}
     * @returns {void}
     */
    draw(ctx, entity) {
        const halfSize = entity.size;

        ctx.save();
        ctx.translate(entity.x, entity.y);
        ctx.rotate(this.rotation);

        // Glow effect
        ctx.shadowBlur = 12;
        ctx.shadowColor = entity.color;

        // Draw square
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = entity.color;
        ctx.fillRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);

        ctx.restore();
    }
}
