import { CircleSpriteRenderer } from './sprites/CircleSpriteRenderer.js';

/**
 * EnemyRenderer - Renders enemy entities on canvas
 * Uses sprite renderer system for visual representation
 */
export class EnemyRenderer {
    /**
     * @type {SpriteRenderer}
     */
    spriteRenderer;
    
    /**
     * @param {SpriteRenderer} spriteRenderer - Sprite rendering strategy
     */
    constructor(spriteRenderer = null) {
        this.spriteRenderer = spriteRenderer || new CircleSpriteRenderer(false); // No bright center
    }
    
    /**
     * Render enemy on canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {Enemy} enemy
     * @param {number} deltaTime - Time delta in seconds (optional, for sprite animation)
     * @returns {void}
     */
    render(ctx, enemy, deltaTime = 0) {
        // Update sprite animation if it has an update method
        if (this.spriteRenderer.update && typeof this.spriteRenderer.update === 'function') {
            this.spriteRenderer.update(deltaTime);
        }
        
        // Delegate sprite rendering to spriteRenderer
        this.spriteRenderer.draw(ctx, enemy);
        
        // Future: health bar
        // this.drawHealthBar(ctx, enemy);
    }
    
    /**
     * Draw health bar above enemy (future)
     * @param {CanvasRenderingContext2D} ctx
     * @param {Enemy} enemy
     * @returns {void}
     */
    drawHealthBar(ctx, enemy) {
        const barWidth = 30;
        const barHeight = 4;
        const barX = enemy.x - barWidth / 2;
        const barY = enemy.y - enemy.size - 10;
        
        // Background
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = enemy.attributes.health / enemy.attributes.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : (healthPercent > 0.25 ? '#f59e0b' : '#dc2626');
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}
