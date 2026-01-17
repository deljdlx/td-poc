import { Particle } from "./Particle.js";

/**
 * TriangleParticle - Triangle particle with rotation
 */
export class TriangleParticle extends Particle {
  /**
   * Draw triangle particle with rotation
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    const opacity = this.getOpacity();
    const height = this.size * 1.2;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;

    // Draw triangle
    ctx.globalAlpha = opacity;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -height / 2);
    ctx.lineTo(this.size / 2, height / 2);
    ctx.lineTo(-this.size / 2, height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
