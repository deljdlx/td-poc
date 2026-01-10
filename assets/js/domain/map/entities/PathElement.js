import { PathElementAttributes } from '../value-objects/PathElementAttributes.js';

/**
 * Entity - Élément d'un chemin (Path)
 * Wrapper autour d'une Cell avec métadonnées spécifiques au path
 */
export class PathElement {
    /** @type {Cell} */
    cell = null;
    
    /** @type {number} */
    index = 0;
    
    /** @type {PathElementAttributes} */
    attributes = null;
    
    /**
     * @param {Cell} cell - Cellule de la grille
     * @param {number} index - Position dans le path
     */
    constructor(cell, index) {
        this.cell = cell;
        this.index = index;
        this.attributes = new PathElementAttributes(null, 0, 1.0, 'normal');
    }
    
    /** @returns {string|null} */
    get direction() {
        return this.attributes.direction;
    }
    
    /** @returns {number} */
    get distanceToNext() {
        return this.attributes.distanceToNext;
    }
    
    /** @returns {number} */
    get speedModifier() {
        return this.attributes.speedModifier;
    }
    
    /** @returns {string} */
    get specialZone() {
        return this.attributes.specialZone;
    }
    
    /**
     * Calcule la direction et la distance vers le prochain PathElement
     * @param {PathElement|null} nextElement
     * @param {CoordinateSystem} coordSystem
     * @returns {void}
     */
    calculateMetadata(nextElement, coordSystem) {
        if (!nextElement) {
            this.attributes.updateMetadata(null, 0);
            return;
        }
        
        // Différence de position dans la grille
        const deltaRow = nextElement.cell.row - this.cell.row;
        const deltaCol = nextElement.cell.col - this.cell.col;
        
        // Calculer direction
        let direction = null;
        if (deltaRow === 0 && deltaCol > 0) {
            direction = 'E';
        } else if (deltaRow === 0 && deltaCol < 0) {
            direction = 'W';
        } else if (deltaRow > 0 && deltaCol === 0) {
            direction = 'S';
        } else if (deltaRow < 0 && deltaCol === 0) {
            direction = 'N';
        } else if (deltaRow < 0 && deltaCol > 0) {
            direction = 'NE';
        } else if (deltaRow < 0 && deltaCol < 0) {
            direction = 'NW';
        } else if (deltaRow > 0 && deltaCol > 0) {
            direction = 'SE';
        } else if (deltaRow > 0 && deltaCol < 0) {
            direction = 'SW';
        }
        
        // Calculer distance en pixels (centre à centre)
        const currentCenter = coordSystem.getElementCenter(this.cell.element);
        const nextCenter = coordSystem.getElementCenter(nextElement.cell.element);
        
        const dx = nextCenter.x - currentCenter.x;
        const dy = nextCenter.y - currentCenter.y;
        
        const distanceToNext = Math.sqrt(dx * dx + dy * dy);
        
        this.attributes.updateMetadata(direction, distanceToNext);
    }
    
    /**
     * Retourne les coordonnées du centre de l'élément
     * @param {CoordinateSystem} coordSystem
     * @returns {{x: number, y: number}}
     */
    getCenter(coordSystem) {
        return coordSystem.getElementCenter(this.cell.element);
    }
    
    /**
     * Définit un modificateur de vitesse pour cette zone
     * @param {number} modifier - Multiplicateur (0.5 = ralenti, 2.0 = rapide)
     * @returns {void}
     */
    setSpeedModifier(modifier) {
        this.attributes._base.speedModifier = modifier;
    }
    
    /**
     * Définit le type de zone spéciale
     * @param {string} zoneType - 'normal', 'slow', 'fast', 'teleport', etc.
     * @returns {void}
     */
    setSpecialZone(zoneType) {
        this.attributes._base.specialZone = zoneType;
    }
}
