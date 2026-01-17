/**
 * Gestionnaire générique de Drag and Drop
 * Classe utilitaire réutilisable sans logique métier
 */
export class DragDropManager {
  /** @type {HTMLElement|null} */
  draggedElement = null;

  /** @type {HTMLElement|null} */
  dragClone = null;

  /** @type {any} */
  dragData = null;

  /** @type {Object} */
  startPosition = null;

  /** @type {Object} */
  offset = null;

  /** @type {boolean} */
  isDragging = false;

  /** @type {Function|null} */
  onDragStartCallback = null;

  /** @type {Function|null} */
  onDragCallback = null;

  /** @type {Function|null} */
  onDragEndCallback = null;

  /** @type {Function|null} */
  onCancelCallback = null;

  /** @type {Map<HTMLElement, Object>} */
  draggableElements = new Map();

  /**
   * @param {Object} options - Configuration callbacks
   * @param {Function} options.onDragStart - (element, data, startPos) => void
   * @param {Function} options.onDrag - (element, data, currentPos) => void
   * @param {Function} options.onDragEnd - (element, data, endPos) => boolean (true si drop valide)
   * @param {Function} options.onCancel - (element, data) => void
   */
  constructor(options = {}) {
    this.onDragStartCallback = options.onDragStart || (() => {});
    this.onDragCallback = options.onDrag || (() => {});
    this.onDragEndCallback = options.onDragEnd || (() => true);
    this.onCancelCallback = options.onCancel || (() => {});

    // Bind methods pour conserver le contexte
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
  }

  /**
   * Active le drag sur un élément
   * @param {HTMLElement} element - Élément à rendre draggable
   * @param {any} data - Données custom à attacher au drag
   * @returns {void}
   */
  enableDrag(element, data = null) {
    if (this.draggableElements.has(element)) {
      return; // Déjà draggable
    }

    const config = { data };
    this.draggableElements.set(element, config);

    element.addEventListener("pointerdown", this.handlePointerDown);
    element.style.touchAction = "none"; // Désactiver scroll sur mobile
  }

  /**
   * Désactive le drag sur un élément
   * @param {HTMLElement} element
   * @returns {void}
   */
  disableDrag(element) {
    if (!this.draggableElements.has(element)) {
      return;
    }

    element.removeEventListener("pointerdown", this.handlePointerDown);
    element.style.touchAction = "";
    this.draggableElements.delete(element);
  }

  /**
   * Gère le début du drag
   * @param {PointerEvent} event
   * @returns {void}
   */
  handlePointerDown(event) {
    const element = event.currentTarget;

    if (!this.draggableElements.has(element)) {
      return;
    }

    // Ignore right-click and shift+click (for tower stats popup)
    if (event.button === 2 || event.shiftKey) {
      return;
    }

    // Empêcher la sélection de texte
    event.preventDefault();

    const config = this.draggableElements.get(element);
    this.draggedElement = element;
    this.dragData = config.data;

    // Capturer la position de départ
    const rect = element.getBoundingClientRect();
    this.startPosition = {
      x: rect.left,
      y: rect.top,
    };

    // Offset souris par rapport au coin de l'élément
    this.offset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    // Écouter les mouvements
    document.addEventListener("pointermove", this.handlePointerMove);
    document.addEventListener("pointerup", this.handlePointerUp);

    // Callback démarrage
    this.onDragStartCallback(element, this.dragData, this.startPosition);
  }

  /**
   * Gère le mouvement pendant le drag
   * @param {PointerEvent} event
   * @returns {void}
   */
  handlePointerMove(event) {
    if (!this.draggedElement) {
      return;
    }

    // Créer le clone au premier mouvement significatif
    if (!this.isDragging) {
      const dx = Math.abs(
        event.clientX - (this.startPosition.x + this.offset.x),
      );
      const dy = Math.abs(
        event.clientY - (this.startPosition.y + this.offset.y),
      );

      // Threshold pour éviter les micro-mouvements
      if (dx > 5 || dy > 5) {
        this.isDragging = true;
        this.createDragClone(this.draggedElement);
        this.draggedElement.classList.add("drag-source-dimmed");
      } else {
        return;
      }
    }

    // Mettre à jour position du clone
    const x = event.clientX - this.offset.x;
    const y = event.clientY - this.offset.y;

    if (this.dragClone) {
      this.dragClone.style.left = `${x}px`;
      this.dragClone.style.top = `${y}px`;
    }

    // Callback drag
    this.onDragCallback(this.draggedElement, this.dragData, {
      x: event.clientX,
      y: event.clientY,
    });
  }

  /**
   * Gère la fin du drag
   * @param {PointerEvent} event
   * @returns {void}
   */
  handlePointerUp(event) {
    if (!this.draggedElement) {
      return;
    }

    // Retirer les listeners
    document.removeEventListener("pointermove", this.handlePointerMove);
    document.removeEventListener("pointerup", this.handlePointerUp);

    // Si drag non commencé (simple click), ignorer
    if (!this.isDragging) {
      this.cleanup();
      return;
    }

    // Position finale
    const endPos = { x: event.clientX, y: event.clientY };

    // Demander validation du drop
    const isValid = this.onDragEndCallback(
      this.draggedElement,
      this.dragData,
      endPos,
    );

    if (isValid) {
      // Drop valide : supprimer le clone simplement
      this.cleanup();
    } else {
      // Drop invalide : animation de retour
      this.animateReturn(() => {
        this.onCancelCallback(this.draggedElement, this.dragData);
        this.cleanup();
      });
    }
  }

  /**
   * Crée un clone visuel de l'élément draggé
   * @param {HTMLElement} element
   * @returns {void}
   */
  createDragClone(element) {
    const clone = element.cloneNode(true);
    clone.classList.add("drag-clone");
    clone.style.position = "fixed";
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "10000";
    clone.style.opacity = "0.8";
    clone.style.transition = "none";

    // Copier dimensions
    const rect = element.getBoundingClientRect();
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;

    document.body.appendChild(clone);
    this.dragClone = clone;
  }

  /**
   * Anime le retour du clone vers la position d'origine
   * @param {Function} onComplete - Callback à la fin de l'animation
   * @returns {void}
   */
  animateReturn(onComplete) {
    if (!this.dragClone || !this.startPosition) {
      onComplete();
      return;
    }

    // Activer la transition
    this.dragClone.style.transition = "all 0.3s ease-out";
    this.dragClone.style.left = `${this.startPosition.x}px`;
    this.dragClone.style.top = `${this.startPosition.y}px`;
    this.dragClone.style.opacity = "0";

    // Attendre la fin de l'animation
    setTimeout(() => {
      onComplete();
    }, 300);
  }

  /**
   * Nettoie l'état du drag
   * @returns {void}
   */
  cleanup() {
    if (this.draggedElement) {
      this.draggedElement.classList.remove("drag-source-dimmed");
    }

    if (this.dragClone) {
      this.dragClone.remove();
      this.dragClone = null;
    }

    this.draggedElement = null;
    this.dragData = null;
    this.startPosition = null;
    this.offset = null;
    this.isDragging = false;
  }

  /**
   * Détruit le manager et nettoie tous les listeners
   * @returns {void}
   */
  destroy() {
    // Désactiver tous les draggables
    for (const element of this.draggableElements.keys()) {
      this.disableDrag(element);
    }

    this.cleanup();
  }
}
