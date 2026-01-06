import { Particle } from './Particle.js';

/**
 * DiamondParticle - Diamond/rhombus particle with rotation
 */
export class DiamondParticle extends Particle {
    /**
     * Draw diamond particle with rotation
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
        
        // Draw diamond
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size * 0.6, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}
