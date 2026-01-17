import { TrailRenderer } from "./TrailRenderer.js";

/**
 * DefaultTrailRenderer - Simple line trail renderer
 * Draws a fading line following the missile path
 */
export class DefaultTrailRenderer extends TrailRenderer {
  /**
   * Draw simple line trail
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array<Object>} trail - Array of {x, y} positions
   * @param {Object} missile - Missile instance
   * @returns {void}
   */
  draw(ctx, trail, missile) {
    if (trail.length < 2) {
      return;
    }

    ctx.save();

    ctx.strokeStyle = missile.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;

    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);

    for (let i = 1; i < trail.length; i++) {
      const alpha = i / trail.length;
      ctx.globalAlpha = alpha * 0.4;
      ctx.lineTo(trail[i].x, trail[i].y);
    }

    ctx.stroke();
    ctx.restore();
  }
}
