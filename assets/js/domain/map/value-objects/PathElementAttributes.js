import { Attributes } from "../../shared/Attributes.js";

/**
 * Value Object - Attributs d'un élément de chemin
 */
export class PathElementAttributes extends Attributes {
  /**
   * @param {string|null} direction - Direction vers le prochain ('N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW')
   * @param {number} distanceToNext - Distance en pixels vers le prochain PathElement
   * @param {number} speedModifier - Multiplicateur de vitesse (1.0 = normal)
   * @param {string} specialZone - Type de zone ('normal', etc.)
   */
  constructor(direction, distanceToNext, speedModifier, specialZone) {
    super({
      direction,
      distanceToNext,
      speedModifier,
      specialZone,
    });
  }

  /** @returns {string|null} */
  get direction() {
    return this._base.direction;
  }

  /** @returns {number} */
  get distanceToNext() {
    return this._base.distanceToNext;
  }

  /** @returns {number} */
  get speedModifier() {
    return this._base.speedModifier;
  }

  /** @returns {string} */
  get specialZone() {
    return this._base.specialZone;
  }

  /**
   * Met à jour la direction et la distance
   * @param {string|null} direction
   * @param {number} distanceToNext
   * @returns {void}
   */
  updateMetadata(direction, distanceToNext) {
    this._base.direction = direction;
    this._base.distanceToNext = distanceToNext;
  }
}
