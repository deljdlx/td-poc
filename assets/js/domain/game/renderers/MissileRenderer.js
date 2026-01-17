import { DefaultTrailRenderer } from './DefaultTrailRenderer.js';
import { ParticleTrailRenderer } from './ParticleTrailRenderer.js';
import { CircleSpriteRenderer } from '../../../sprites/CircleSpriteRenderer.js';
import { StarSpriteRenderer } from '../../../sprites/StarSpriteRenderer.js';
import { DiamondSpriteRenderer } from '../../../sprites/DiamondSpriteRenderer.js';
import { SquareSpriteRenderer } from '../../../sprites/SquareSpriteRenderer.js';
import { TriangleSpriteRenderer } from '../../../sprites/TriangleSpriteRenderer.js';

/**
 * MissileRenderer - Renders missile entities on canvas
 * Handles both missile sprite and trail rendering
 */
export class MissileRenderer {
    /**
     * @type {TrailRenderer}
     */
    trailRenderer;
    
    /**
     * @type {Map<string, SpriteRenderer>} - Cache sprite renderers per missile
     */
    spriteCache;
    
    /**
     * @param {TrailRenderer} trailRenderer - Trail rendering strategy
     */
    constructor(trailRenderer = null) {
        this.trailRenderer = trailRenderer || new ParticleTrailRenderer();
        this.spriteCache = new Map();
    }
    
    /**
     * Get or create sprite renderer for a missile based on visualFx config
     * @param {Missile} missile
     * @returns {SpriteRenderer}
     */
    getSpriteRenderer(missile) {
        // Use cached sprite if already created for this missile
        if (this.spriteCache.has(missile.id)) {
            return this.spriteCache.get(missile.id);
        }
        
        // Create sprite based on visualFx config
        const spriteConfig = missile.visualFx?.sprite;
        if (!spriteConfig) {
            // Fallback to default circle
            const sprite = new CircleSpriteRenderer();
            this.spriteCache.set(missile.id, sprite);
            return sprite;
        }
        
        let sprite;
        switch(spriteConfig.type) {
            case 'star':
                sprite = new StarSpriteRenderer(
                    spriteConfig.spikes || 5,
                    spriteConfig.rotationSpeed || 2
                );
                break;
            case 'diamond':
                sprite = new DiamondSpriteRenderer(spriteConfig.rotationSpeed || 2);
                break;
            case 'circle':
                sprite = new CircleSpriteRenderer(spriteConfig.withBrightCenter !== false);
                break;
            case 'square':
                sprite = new SquareSpriteRenderer(spriteConfig.rotationSpeed || 2);
                break;
            case 'triangle':
                sprite = new TriangleSpriteRenderer(spriteConfig.rotationSpeed || 2);
                break;
            default:
                sprite = new CircleSpriteRenderer();
        }
        
        this.spriteCache.set(missile.id, sprite);
        return sprite;
    }
    
    /**
     * Render missile on canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {Missile} missile
     * @param {number} deltaTime - Time delta in seconds (optional, for sprite animation)
     * @returns {void}
     */
    render(ctx, missile, deltaTime = 0) {
        // Get sprite renderer for this missile
        const spriteRenderer = this.getSpriteRenderer(missile);
        
        // Update sprite animation if it has an update method
        if (spriteRenderer.update && typeof spriteRenderer.update === 'function') {
            spriteRenderer.update(deltaTime);
        }
        
        // Delegate trail rendering to trailRenderer
        this.trailRenderer.draw(ctx, missile.trail, missile);
        
        // Delegate sprite rendering to spriteRenderer
        spriteRenderer.draw(ctx, missile);
    }
}
