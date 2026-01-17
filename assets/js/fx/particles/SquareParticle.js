import { Particle } from './Particle.js';

/**
 * SquareParticle - Square particle with rotation
 */
export class SquareParticle extends Particle {
    /**
     * Draw square particle with rotation
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const opacity = this.getOpacity();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        // Draw square
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        ctx.restore();
    }
}
