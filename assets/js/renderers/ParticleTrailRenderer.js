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
        
        ctx.save();
        
        // Draw particles at each trail position
        for (let i = 0; i < trail.length; i++) {
            const position = trail[i];
            const alpha = i / trail.length; // Fade older particles
            const size = 1 + (alpha * 2); // Grow toward missile head
            
            // Particle glow
            ctx.globalAlpha = alpha * 0.6;
            ctx.shadowBlur = 8;
            ctx.shadowColor = missile.color;
            ctx.fillStyle = missile.color;
            
            ctx.beginPath();
            ctx.arc(position.x, position.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add some random offset particles for dispersion effect
            if (Math.random() > 0.7) {
                const offsetX = (Math.random() - 0.5) * 4;
                const offsetY = (Math.random() - 0.5) * 4;
                ctx.globalAlpha = alpha * 0.3;
                ctx.beginPath();
                ctx.arc(position.x + offsetX, position.y + offsetY, size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}
