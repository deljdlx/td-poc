import { Particle } from "./Particle.js";

/**
 * StarParticle - Star-shaped particle with rotation
 */
export class StarParticle extends Particle {
  /**
   * @type {number}
   */
  spikes;

  /**
   * @param {number} x - Initial X position
   * @param {number} y - Initial Y position
   * @param {number} vx - Initial X velocity
   * @param {number} vy - Initial Y velocity
   * @param {string} color - Particle color
   * @param {number} size - Particle size
   * @param {number} maxLife - Maximum lifetime
   * @param {number} spikes - Number of star spikes (default: 5)
   */
  constructor(x, y, vx, vy, color, size, maxLife = 2.0, spikes = 5) {
    super(x, y, vx, vy, color, size, maxLife);
    this.spikes = spikes;
  }

  /**
   * Draw star particle with rotation
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    const opacity = this.getOpacity();
    const outerRadius = this.size;
    const innerRadius = this.size * 0.5;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Glow effect
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;

    // Draw star
    ctx.globalAlpha = opacity;
    ctx.fillStyle = this.color;
    ctx.beginPath();

    for (let i = 0; i < this.spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / this.spikes) * i;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
