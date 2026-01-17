import { Particle } from './Particle.js';

/**
 * CircleParticle - Circular particle with glow effect
 */
export class CircleParticle extends Particle {
    /**
     * Draw circular particle with glow
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const opacity = this.getOpacity();

        ctx.save();
        ctx.translate(this.x, this.y);

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Draw circle
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
