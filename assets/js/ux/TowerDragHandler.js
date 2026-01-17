import { DragDropManager } from '../services/ui/DragDropManager.js';
import { EventBus } from '../services/core/EventBus.js';

/**
 * Gestionnaire du drag and drop des tourelles
 * Contient la logique métier spécifique aux tourelles
 */
export class TowerDragHandler {
    /** @type {GridModel} */
    model = null;

    /** @type {GridView} */
    gridView = null;

    /** @type {CoordinateSystem} */
    coordSystem = null;

    /** @type {EntityManager} */
    entityManager = null;
    
    /** @type {Debug} */
    debug = null;
    
    /** @type {DragDropManager} */
    dragDropManager = null;
    
    /** @type {Cell|null} */
    sourceCell = null;
    
    /**
     * @param {GridModel} model
     * @param {import('../domain/grid/views/GridView.js').GridView} gridView
     * @param {CoordinateSystem} coordSystem
     * @param {EntityManager} entityManager
     * @param {DIContainer} diContainer
     */
    constructor(model, gridView, coordSystem, entityManager, diContainer) {
        this.model = model;
        this.gridView = gridView;
        this.coordSystem = coordSystem;
        this.entityManager = entityManager;
        this.debug = diContainer.createDebug('TowerDragHandler', true);
        
        // Initialiser le DragDropManager avec callbacks
        this.dragDropManager = new DragDropManager({
            onDragStart: this.handleDragStart.bind(this),
            onDrag: this.handleDrag.bind(this),
            onDragEnd: this.handleDragEnd.bind(this),
            onCancel: this.handleCancel.bind(this)
        });
        
        // Listen to domain events for UI updates (EVENT-DRIVEN UI)
        this.setupDomainEventListeners();
    }
    
    /**
     * Setup listeners for domain events (EVENT-DRIVEN UI UPDATES)
     * @returns {void}
     */
    setupDomainEventListeners() {
        // Listen to successful tower moves to re-enable drag
        EventBus.onGlobal('tower:moved', (data) => {
            const { toCell } = data;
            this.enableTowerDrag(toCell);
            this.debug.event('Tower moved - drag re-enabled on target cell');
        });
    }
    
    /**
     * Active le drag sur une cellule contenant une tourelle
     * @param {Cell} cell
     * @returns {void}
     */
    enableTowerDrag(cell) {
        if (!cell.hasTower()) {
            this.debug.warning('Cannot enable drag on cell without tower', { row: cell.row, col: cell.col });
            return;
        }
        
        if (!cell.element) {
            this.debug.error('Cannot enable drag - cell has no DOM element', { row: cell.row, col: cell.col });
            return;
        }
        
        const dragData = {
            cell: cell,
            tower: cell.getTower()
        };
        
        this.dragDropManager.enableDrag(cell.element, dragData);
        this.debug.success('Tower drag enabled', { row: cell.row, col: cell.col });
    }
    
    /**
     * Désactive le drag sur une cellule
     * @param {Cell} cell
     * @returns {void}
     */
    disableTowerDrag(cell) {
        this.dragDropManager.disableDrag(cell.element);
    }
    
    /**
     * Callback appelé au début du drag
     * @param {HTMLElement} element
     * @param {Object} data
     * @param {Object} startPos
     * @returns {void}
     */
    handleDragStart(element, data, startPos) {
        this.sourceCell = data.cell;
        
        this.debug.event('Tower drag started', {
            row: data.cell.row,
            col: data.cell.col,
            startPos
        });
    }
    
    /**
     * Callback appelé pendant le drag
     * @param {HTMLElement} element
     * @param {Object} data
     * @param {Object} currentPos
     * @returns {void}
     */
    handleDrag(element, data, currentPos) {
        // On pourrait ajouter un highlighting de la cellule cible ici
        // Pour l'instant, rien à faire pendant le drag
    }
    
    /**
     * Callback appelé à la fin du drag
     * Valide le drop et retourne true si valide, false sinon
     * COMMAND EMISSION: Emits tower:moveAttempt command event
     * @param {HTMLElement} element
     * @param {Object} data
     * @param {Object} endPos
     * @returns {boolean}
     */
    handleDragEnd(element, data, endPos) {
        const tower = data.tower;
        const sourceCell = data.cell;
        
        // Trouver la cellule cible sous la souris
        const targetCell = this.findCellAtPosition(endPos.x, endPos.y);
        
        if (!targetCell) {
            this.debug.warning('Drop outside grid');
            return false;
        }
        
        // Même cellule = annuler
        if (targetCell === sourceCell) {
            this.debug.info('Dropped on same cell, cancelling');
            return false;
        }
        
        // Cellule sur un path = invalide
        if (targetCell.isOnPath) {
            this.debug.warning('Cannot place tower on path', {
                target: { row: targetCell.row, col: targetCell.col }
            });
            return false;
        }
        
        // Cellule cible occupée = invalide
        if (targetCell.hasTower()) {
            this.debug.warning('Target cell already has a tower', {
                target: { row: targetCell.row, col: targetCell.col }
            });
            return false;
        }
        
        // Drop valide : émettre COMMAND EVENT pour validation et logique métier
        // Game will validate, mutate data, and emit domain events
        EventBus.emitGlobal('tower:moveAttempt', {
            tower,
            fromCell: sourceCell,
            toCell: targetCell
        });
        
        // Return true pour le drag/drop UI (la logique métier validera via event)
        return true;
    }
    
    /**
     * Callback appelé quand le drop est annulé
     * @param {HTMLElement} element
     * @param {Object} data
     * @returns {void}
     */
    handleCancel(element, data) {
        this.sourceCell = null;
        this.debug.event('Tower drag cancelled');
    }
    
    /**
     * Trouve la cellule à une position donnée
     * @param {number} x - Coordonnée X viewport
     * @param {number} y - Coordonnée Y viewport
     * @returns {Cell|null}
     */
    findCellAtPosition(x, y) {
        // Chercher l'élément sous le curseur
        const element = document.elementFromPoint(x, y);
        
        if (!element || !element.classList.contains('grid-cell')) {
            return null;
        }
        
        const row = parseInt(element.dataset.row);
        const col = parseInt(element.dataset.col);
        
        return this.model.getCell(row, col);
    }
    
    /**
     * Détruit le handler et nettoie les ressources
     * @returns {void}
     */
    destroy() {
        this.dragDropManager.destroy();
    }
}
