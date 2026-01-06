/**
 * MissileRenderer - Renders missile entities on canvas
 * Handles both missile head and trail rendering
 */
class MissileRenderer {
    /**
     * @type {TrailRenderer}
     */
    trailRenderer;
    
    /**
     * @param {TrailRenderer} trailRenderer - Trail rendering strategy
     */
    constructor(trailRenderer = null) {
        // this.trailRenderer = trailRenderer || new DefaultTrailRenderer();
        this.trailRenderer = trailRenderer || new ParticleTrailRenderer();
    }
    
    /**
     * Render missile on canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {Missile} missile
     * @returns {void}
     */
    render(ctx, missile) {
        ctx.save();
        
        // Delegate trail rendering to trailRenderer
        this.trailRenderer.draw(ctx, missile.trail, missile);
        
        // Draw missile head with glow
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 15;
        ctx.shadowColor = missile.color;
        ctx.fillStyle = missile.color;
        
        ctx.beginPath();
        ctx.arc(missile.x, missile.y, missile.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright center
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(missile.x, missile.y, missile.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
