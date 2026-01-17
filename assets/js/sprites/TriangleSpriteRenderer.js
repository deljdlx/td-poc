import { SpriteRenderer } from './SpriteRenderer.js';

/**
 * TriangleSpriteRenderer - Triangle sprite with rotation
 */
export class TriangleSpriteRenderer extends SpriteRenderer {
    /**
     * @type {number}
     */
    rotation;
    
    /**
     * @type {number}
     */
    rotationSpeed;
    
    /**
     * @param {number} rotationSpeed - Rotation speed in radians/second (default: 2.5)
     */
    constructor(rotationSpeed = 2.5) {
        super();
        this.rotation = -Math.PI / 2; // Point upward
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
     * Draw triangle sprite with rotation
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} entity - Entity with {x, y, color, size}
     * @returns {void}
     */
    draw(ctx, entity) {
        const size = entity.size;
        const height = size * 1.5;
        
        ctx.save();
        ctx.translate(entity.x, entity.y);
        ctx.rotate(this.rotation);
        
        // Glow effect
        ctx.shadowBlur = 12;
        ctx.shadowColor = entity.color;
        
        // Draw triangle
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = entity.color;
        ctx.beginPath();
        ctx.moveTo(0, -height);
        ctx.lineTo(size, height);
        ctx.lineTo(-size, height);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}
