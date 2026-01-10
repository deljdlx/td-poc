import { Attributes } from './Attributes.js';

/**
 * MissileAttributes - Munition-specific stats
 * 
 * Attributes:
 * - damage: Base damage dealt on impact
 * - splashRadius: Explosion radius in cells
 * 
 * These are intrinsic to the munition type (not the shooter).
 * Tower-specific stats (critChance, critMultiplier) are in TowerAttributes.
 */
export class MissileAttributes extends Attributes {
    /**
     * @param {number} damage - Base damage
     * @param {number} splashRadius - Splash radius in cells
     */
    constructor(damage, splashRadius) {
        super({
            damage,
            splashRadius
        });
    }
    
    /**
     * Get final damage value (base + modifiers)
     * @returns {number}
     */
    get damage() {
        return this._getFinalValue('damage');
    }
    
    /**
     * Get final splash radius value (base + modifiers)
     * @returns {number} - Radius in cells
     */
    get splashRadius() {
        return this._getFinalValue('splashRadius');
    }
}
