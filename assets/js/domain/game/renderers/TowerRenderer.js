import { CircleSpriteRenderer } from '../../../sprites/CircleSpriteRenderer.js';

/**
 * TowerRenderer - Renders tower entities on canvas
 * Uses sprite renderer system for visual representation
 */
export class TowerRenderer {
    /**
     * @type {SpriteRenderer}
     */
    spriteRenderer;
    
    /**
     * @param {SpriteRenderer} spriteRenderer - Sprite rendering strategy
     */
    constructor(spriteRenderer = null) {
        this.spriteRenderer = spriteRenderer || new CircleSpriteRenderer();
    }

    /**
     * Render tower on canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {Tower} tower
     * @param {number} deltaTime - Time delta in seconds (optional, for sprite animation)
     * @returns {void}
     */
    render(ctx, tower, deltaTime = 0) {
        // Update sprite animation if it has an update method
        if (this.spriteRenderer.update && typeof this.spriteRenderer.update === 'function') {
            this.spriteRenderer.update(deltaTime);
        }
        
        // Delegate sprite rendering to spriteRenderer
        this.spriteRenderer.draw(ctx, tower);
    }
}
