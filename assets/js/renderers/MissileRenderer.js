import { DefaultTrailRenderer } from './DefaultTrailRenderer.js';
import { ParticleTrailRenderer } from './ParticleTrailRenderer.js';
import { CircleSpriteRenderer } from './sprites/CircleSpriteRenderer.js';

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
     * @type {SpriteRenderer}
     */
    spriteRenderer;
    
    /**
     * @param {TrailRenderer} trailRenderer - Trail rendering strategy
     * @param {SpriteRenderer} spriteRenderer - Sprite rendering strategy
     */
    constructor(trailRenderer = null, spriteRenderer = null) {
        this.trailRenderer = trailRenderer || new ParticleTrailRenderer();
        this.spriteRenderer = spriteRenderer || new CircleSpriteRenderer();
        console.log('🎯 MissileRenderer created with sprite:', this.spriteRenderer.constructor.name);
    }
    
    /**
     * Render missile on canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {Missile} missile
     * @param {number} deltaTime - Time delta in seconds (optional, for sprite animation)
     * @returns {void}
     */
    render(ctx, missile, deltaTime = 0) {
        // Debug: log sprite type on first render
        if (!this._debugLogged) {
            console.log('🔍 Rendering with sprite:', this.spriteRenderer.constructor.name, this.spriteRenderer);
            this._debugLogged = true;
        }
        
        // Update sprite animation if it has an update method
        if (this.spriteRenderer.update && typeof this.spriteRenderer.update === 'function') {
            this.spriteRenderer.update(deltaTime);
        }
        
        // Delegate trail rendering to trailRenderer
        this.trailRenderer.draw(ctx, missile.trail, missile);
        
        // Delegate sprite rendering to spriteRenderer
        this.spriteRenderer.draw(ctx, missile);
    }
}
