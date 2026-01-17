import { Attributes } from "../../shared/Attributes.js";

/**
 * Value Object - Attributs d'un chemin
 */
export class PathAttributes extends Attributes {
  /**
   * @param {PathElement[]} elements - Séquence ordonnée de PathElement
   * @param {boolean} isClosed - true si le chemin forme une boucle
   */
  constructor(elements, isClosed) {
    super({
      elements,
      isClosed,
    });
  }

  /** @returns {PathElement[]} */
  get elements() {
    return this._base.elements;
  }

  /** @returns {boolean} */
  get isClosed() {
    return this._base.isClosed;
  }
}
