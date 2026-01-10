import { PathElement } from '../../domain/grid/entities/PathElement.js';

/**
 * Représente un chemin composé d'une séquence de PathElement
 */
export class Path {
    /** @type {PathElement[]} */
    elements = [];
    
    /** @type {boolean} - true si le chemin forme une boucle (départ === arrivée) */
    isClosed = false;
    
    /** @type {Debug} */
    debug = null;
    
    /**
     * @param {PathElement[]} elements - Séquence ordonnée de PathElement
     * @param {boolean} isClosed - true si boucle fermée
     * @param {DIContainer} diContainer
     */
    constructor(elements, isClosed, diContainer) {
        this.elements = elements;
        this.isClosed = isClosed;
        this.debug = diContainer.createDebug('Path', true);
        
        this.debug.info('Path created', {
            length: elements.length,
            isClosed,
            start: elements[0]?.cell.getLabel(),
            end: elements[elements.length - 1]?.cell.getLabel()
        });
    }
    
    /**
     * Retourne le premier élément du path
     * @returns {PathElement|null}
     */
    getStartElement() {
        return this.elements.length > 0 ? this.elements[0] : null;
    }
    
    /**
     * Retourne le dernier élément du path
     * @returns {PathElement|null}
     */
    getEndElement() {
        return this.elements.length > 0 ? this.elements[this.elements.length - 1] : null;
    }
    
    /**
     * Retourne l'élément à un index donné
     * @param {number} index
     * @returns {PathElement|null}
     */
    getElementAt(index) {
        if (index < 0 || index >= this.elements.length) {
            return null;
        }
        return this.elements[index];
    }
    
    /**
     * Retourne l'élément suivant dans le path
     * @param {PathElement} currentElement
     * @returns {PathElement|null}
     */
    getNextElement(currentElement) {
        const nextIndex = currentElement.index + 1;
        
        // Si on dépasse la fin
        if (nextIndex >= this.elements.length) {
            // Si boucle fermée, retour au début
            if (this.isClosed) {
                return this.elements[0];
            }
            // Sinon, fin du path
            return null;
        }
        
        return this.elements[nextIndex];
    }
    
    /**
     * Retourne l'élément précédent dans le path
     * @param {PathElement} currentElement
     * @returns {PathElement|null}
     */
    getPreviousElement(currentElement) {
        const prevIndex = currentElement.index - 1;
        
        // Si on est au début
        if (prevIndex < 0) {
            // Si boucle fermée, aller à la fin
            if (this.isClosed) {
                return this.elements[this.elements.length - 1];
            }
            // Sinon, pas de précédent
            return null;
        }
        
        return this.elements[prevIndex];
    }
    
    /**
     * Retourne la longueur du path
     * @returns {number}
     */
    getLength() {
        return this.elements.length;
    }
    
    /**
     * Retourne la longueur totale en pixels du path
     * @returns {number}
     */
    getTotalDistance() {
        return this.elements.reduce((sum, element) => sum + element.distanceToNext, 0);
    }
    
    /**
     * Vérifie si une cellule fait partie du path
     * @param {Cell} cell
     * @returns {boolean}
     */
    containsCell(cell) {
        return this.elements.some(element => element.cell === cell);
    }
    
    /**
     * Retourne le PathElement correspondant à une cellule
     * @param {Cell} cell
     * @returns {PathElement|null}
     */
    getElementByCell(cell) {
        return this.elements.find(element => element.cell === cell) || null;
    }
    
    /**
     * Itère sur tous les éléments du path
     * @param {Function} callback - (element, index) => void
     * @returns {void}
     */
    forEach(callback) {
        this.elements.forEach(callback);
    }
}
