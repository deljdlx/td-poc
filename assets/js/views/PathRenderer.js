import { CSSVariables } from "../services/ui/CSSVariables.js";

/**
 * Renderer pour dessiner les paths en DOM/CSS
 */
export class PathRenderer {
  /**
   * @param {DIContainer} diContainer
   */
  constructor(diContainer) {
    this.debug = diContainer.createDebug("PathRenderer", true);
    this.container = document.getElementById("path-layer");
    if (!this.container) {
      this.debug.error("path-layer element not found!");
    }
  }

  /**
   * Dessine un path complet en DOM
   * @param {Path} path
   * @param {CoordinateSystem} coordSystem
   * @param {Object} options - { showDirection: true }
   */
  render(path, coordSystem, options = {}) {
    const { showDirection = true } = options;

    if (!this.container) {
      this.debug.error("Cannot render: path-layer not found");
      return;
    }

    this.debug.info("Rendering path to DOM", {
      pathLength: path.getLength(),
      isClosed: path.isClosed,
    });

    // Créer un fragment pour batch insert
    const fragment = document.createDocumentFragment();

    // Dessiner chaque PathElement comme un conteneur de cellule
    path.forEach((element) => {
      const segmentDiv = this._createPathSegmentElement(element, coordSystem);
      fragment.appendChild(segmentDiv);
    });

    // Insérer tous les éléments d'un coup
    this.container.appendChild(fragment);

    this.debug.success(`Rendered ${path.getLength()} path segments to DOM`);
  }

  /**
   * Crée un élément DOM pour un PathElement (conteneur taille cellule)
   * @param {PathElement} element
   * @param {CoordinateSystem} coordSystem
   * @returns {HTMLElement}
   * @private
   */
  _createPathSegmentElement(element, coordSystem) {
    const cell = element.cell;
    const zone = element.specialZone || "normal";

    // Obtenir position et taille de la cellule DOM
    const rect = cell.domElement.getBoundingClientRect();

    // Créer l'élément conteneur
    const div = document.createElement("div");
    div.className = `path-segment ${zone}`;

    // Positionner exactement sur la cellule
    div.style.left = `${rect.left}px`;
    div.style.top = `${rect.top}px`;
    div.style.width = `${rect.width}px`;
    div.style.height = `${rect.height}px`;

    // Stocker métadonnées en data-attributes (pour sélection sprite)
    div.dataset.row = cell.row;
    div.dataset.col = cell.col;
    div.dataset.index = element.index;
    div.dataset.direction = element.direction || "none";
    div.dataset.zone = zone;

    return div;
  }

  /**
   * Efface tous les paths du DOM
   */
  clear() {
    if (this.container) {
      this.container.innerHTML = "";
      this.debug.info("Path layer cleared");
    }
  }
}
