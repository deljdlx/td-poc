/**
 * SpriteRenderer - Base class for entity sprite rendering
 * Handles visual representation of game entities (missiles, towers, enemies)
 * Separated from particle effects (which have physics/fade/lifetime)
 */
export class SpriteRenderer {
  /**
   * Draw entity sprite at its position
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} entity - Entity with {x, y, color, size} properties
   * @returns {void}
   */
  draw(ctx, entity) {
    throw new Error("SpriteRenderer.draw() must be implemented by subclass");
  }
}
