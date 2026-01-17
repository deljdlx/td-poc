import { Attributes } from "../../shared/Attributes.js";

/**
 * TowerAttributes - Tower-specific stats
 *
 * Attributes:
 * - range: Attack range in cells
 * - cooldown: Time between shots in seconds
 * - critChance: Critical hit chance (0.0 to 1.0)
 * - critMultiplier: Damage multiplier for critical hits
 *
 * These are intrinsic to the tower (shooter stats).
 * Munition stats (damage, splashRadius) are in MissileAttributes.
 */
export class TowerAttributes extends Attributes {
  /**
   * @param {number} range - Attack range in cells
   * @param {number} cooldown - Cooldown between shots in seconds
   * @param {number} critChance - Critical hit chance (0.0 to 1.0)
   * @param {number} critMultiplier - Critical damage multiplier
   */
  constructor(range, cooldown, critChance, critMultiplier) {
    super({
      range,
      cooldown,
      critChance,
      critMultiplier,
    });
  }

  /**
   * Get final range value (base + modifiers)
   * @returns {number} - Range in cells
   */
  get range() {
    return this._getFinalValue("range");
  }

  /**
   * Get final cooldown value (base + modifiers)
   * @returns {number} - Cooldown in seconds
   */
  get cooldown() {
    return this._getFinalValue("cooldown");
  }

  /**
   * Get final crit chance value (base + modifiers)
   * @returns {number} - Crit chance (0.0 to 1.0)
   */
  get critChance() {
    return this._getFinalValue("critChance");
  }

  /**
   * Get final crit multiplier value (base + modifiers)
   * @returns {number} - Damage multiplier for crits
   */
  get critMultiplier() {
    return this._getFinalValue("critMultiplier");
  }
}
