/**
 * TrailRenderer - Base class for trail rendering strategies
 * Abstract class defining interface for missile trail rendering
 */
export class TrailRenderer {
  /**
   * Draw missile trail on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<Object>} trail - Array of {x, y} positions
   * @param {Object} missile - Missile instance (for color, size, etc.)
   * @returns {void}
   */
  draw(ctx, trail, missile) {
    throw new Error("TrailRenderer.draw() must be implemented by subclass");
  }
}
