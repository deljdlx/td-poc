import { Attributes } from '../../shared/Attributes.js';

/**
 * Value Object - Attributs d'une cellule de la carte
 */
export class CellAttributes extends Attributes {
    /**
     * @param {number} row - Position ligne
     * @param {number} col - Position colonne
     * @param {boolean} isTarget - Peut accueillir une cible/tour
     * @param {boolean} isOnPath - Fait partie d'un chemin
     */
    constructor(row, col, isTarget, isOnPath) {
        super({
            row,
            col,
            isTarget,
            isOnPath
        });
    }

    /** @returns {number} */
    get row() {
        return this._base.row;
    }

    /** @returns {number} */
    get col() {
        return this._base.col;
    }

    /** @returns {boolean} */
    get isTarget() {
        return this._base.isTarget;
    }

    /** @returns {boolean} */
    get isOnPath() {
        return this._base.isOnPath;
    }

    /**
     * Met à jour le statut target
     * @param {boolean} value
     * @returns {void}
     */
    setTarget(value) {
        this._base.isTarget = value;
    }

    /**
     * Met à jour le statut path
     * @param {boolean} value
     * @returns {void}
     */
    setOnPath(value) {
        this._base.isOnPath = value;
    }
}
