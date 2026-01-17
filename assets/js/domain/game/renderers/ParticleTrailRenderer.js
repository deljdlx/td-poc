import { TrailRenderer } from './TrailRenderer.js';

/**
 * ParticleTrailRenderer - Particle-based trail renderer
 * Draws small particles along the missile trail
 */
export class ParticleTrailRenderer extends TrailRenderer {
    /**
     * Draw particle trail
     * @param {CanvasRenderingContext2D} ctx
     * @param {Array<Object>} trail - Array of {x, y} positions
     * @param {Object} missile - Missile instance
     * @returns {void}
     */
    draw(ctx, trail, missile) {
        if (trail.length === 0) {
            return;
        }
        
        // Get visual config from missile blueprint
        const trailColor = missile.visualFx?.trail?.color || missile.color;
        const trailWidth = missile.visualFx?.trail?.width || 2;
        
        ctx.save();
        
        // Draw particles at each trail position
        for (let i = 0; i < trail.length; i++) {
            const position = trail[i];
            const alpha = i / trail.length; // Fade older particles
            const size = (trailWidth / 2) + (alpha * trailWidth); // Grow toward missile head
            
            // Particle glow
            ctx.globalAlpha = alpha * 0.6;
            ctx.shadowBlur = trailWidth * 2;
            ctx.shadowColor = trailColor;
            ctx.fillStyle = trailColor;
            
            ctx.beginPath();
            ctx.arc(position.x, position.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add some random offset particles for dispersion effect
            if (Math.random() > 0.7) {
                const offsetX = (Math.random() - 0.5) * (trailWidth * 2);
                const offsetY = (Math.random() - 0.5) * (trailWidth * 2);
                ctx.globalAlpha = alpha * 0.3;
                ctx.beginPath();
                ctx.arc(position.x + offsetX, position.y + offsetY, size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}
