import { SpriteRenderer } from './SpriteRenderer.js';

/**
 * CircleSpriteRenderer - Circular sprite with glow and bright center
 * Default sprite for missiles
 */
export class CircleSpriteRenderer extends SpriteRenderer {
    /**
     * @type {boolean}
     */
    withBrightCenter;
    
    /**
     * @param {boolean} withBrightCenter - Add white center highlight (default: true)
     */
    constructor(withBrightCenter = true) {
        super();
        this.withBrightCenter = withBrightCenter;
    }
    
    /**
     * Draw circular sprite with glow
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} entity - Entity with {x, y, color, size}
     * @returns {void}
     */
    draw(ctx, entity) {
        ctx.save();
        
        // Main circle with glow
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 15;
        ctx.shadowColor = entity.color;
        ctx.fillStyle = entity.color;
        
        ctx.beginPath();
        ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright center
        if (this.withBrightCenter) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(entity.x, entity.y, entity.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}
