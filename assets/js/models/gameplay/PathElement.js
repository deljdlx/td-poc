/**
 * Élément d'un chemin (Path)
 * Wrapper autour d'une Cell avec métadonnées spécifiques au path
 */
export class PathElement {
    /** @type {Cell} */
    cell = null;
    
    /** @type {number} */
    index = 0;
    
    /** @type {string|null} - Direction vers le prochain ('N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW') */
    direction = null;
    
    /** @type {number} - Distance en pixels vers le prochain PathElement */
    distanceToNext = 0;
    
    /** @type {number} - Multiplicateur de vitesse (1.0 = normal) */
    speedModifier = 1.0;
    
    /** @type {string} - Type de zone */
    specialZone = 'normal';
    
    /**
     * @param {Cell} cell - Cellule de la grille
     * @param {number} index - Position dans le path
     */
    constructor(cell, index) {
        this.cell = cell;
        this.index = index;
    }
    
    /**
     * Calcule la direction et la distance vers le prochain PathElement
     * @param {PathElement|null} nextElement
     * @param {CoordinateSystem} coordSystem
     * @returns {void}
     */
    calculateMetadata(nextElement, coordSystem) {
        if (!nextElement) {
            this.direction = null;
            this.distanceToNext = 0;
            return;
        }
        
        // Différence de position dans la grille
        const deltaRow = nextElement.cell.row - this.cell.row;
        const deltaCol = nextElement.cell.col - this.cell.col;
        
        // Calculer direction
        if (deltaRow === 0 && deltaCol > 0) {
            this.direction = 'E';
        } else if (deltaRow === 0 && deltaCol < 0) {
            this.direction = 'W';
        } else if (deltaRow > 0 && deltaCol === 0) {
            this.direction = 'S';
        } else if (deltaRow < 0 && deltaCol === 0) {
            this.direction = 'N';
        } else if (deltaRow < 0 && deltaCol > 0) {
            this.direction = 'NE';
        } else if (deltaRow < 0 && deltaCol < 0) {
            this.direction = 'NW';
        } else if (deltaRow > 0 && deltaCol > 0) {
            this.direction = 'SE';
        } else if (deltaRow > 0 && deltaCol < 0) {
            this.direction = 'SW';
        }
        
        // Calculer distance en pixels (centre à centre)
        const currentCenter = coordSystem.getElementCenter(this.cell.element);
        const nextCenter = coordSystem.getElementCenter(nextElement.cell.element);
        
        const dx = nextCenter.x - currentCenter.x;
        const dy = nextCenter.y - currentCenter.y;
        
        this.distanceToNext = Math.sqrt(dx * dx + dy * dy);
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
        this.speedModifier = modifier;
    }
    
    /**
     * Définit le type de zone spéciale
     * @param {string} zoneType - 'normal', 'slow', 'fast', 'teleport', etc.
     * @returns {void}
     */
    setSpecialZone(zoneType) {
        this.specialZone = zoneType;
    }
}
