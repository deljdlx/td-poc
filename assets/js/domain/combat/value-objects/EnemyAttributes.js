import { Attributes } from "../../shared/Attributes.js";

/**
 * EnemyAttributes - Enemy-specific stats
 *
 * Attributes:
 * - health: Current health points
 * - maxHealth: Maximum health points
 * - speed: Movement speed in cells per second
 * - goldReward: Gold awarded when killed
 * - armor: Damage reduction (future)
 */
export class EnemyAttributes extends Attributes {
  /**
   * @param {number} health - Current health
   * @param {number} maxHealth - Maximum health
   * @param {number} speed - Movement speed in cells/sec
   * @param {number} goldReward - Gold reward on death
   */
  constructor(health, maxHealth, speed, goldReward) {
    super({
      health,
      maxHealth,
      speed,
      goldReward,
    });
  }

  /**
   * Get final health value (base + modifiers)
   * @returns {number}
   */
  get health() {
    return this._getFinalValue("health");
  }

  /**
   * Get final max health value (base + modifiers)
   * @returns {number}
   */
  get maxHealth() {
    return this._getFinalValue("maxHealth");
  }

  /**
   * Get final speed value (base + modifiers)
   * @returns {number} - Speed in cells per second
   */
  get speed() {
    return this._getFinalValue("speed");
  }

  /**
   * Get final gold reward value (base + modifiers)
   * @returns {number}
   */
  get goldReward() {
    return this._getFinalValue("goldReward");
  }

  /**
   * Set health value (updates base)
   * @param {number} value
   */
  setHealth(value) {
    this._base.health = value;
  }
}
