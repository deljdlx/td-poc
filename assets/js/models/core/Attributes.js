/**
 * Attributes - Base class for entity attributes with modifier support
 * 
 * Value Object that encapsulates:
 * - Base stat values (intrinsic to entity type)
 * - Modifiers (buffs, debuffs, upgrades)
 * - Calculation logic (additive + multiplicative)
 * 
 * Child classes (TowerAttributes, MissileAttributes) define specific getters
 * for type-safe attribute access.
 */
export class Attributes {
    /**
     * @type {Object} - Base attribute values
     * @private
     */
    _base;
    
    /**
     * @type {Object} - Modifiers per attribute key
     * Structure: { attributeName: { add: number, mult: number } }
     * @private
     */
    _modifiers;
    
    /**
     * @param {Object} baseValues - Initial base values for attributes
     */
    constructor(baseValues) {
        this._base = baseValues;
        this._modifiers = {};
    }
    
    /**
     * Calculate final value for an attribute (base + modifiers)
     * Formula: (base + additive) * multiplicative
     * 
     * @param {string} key - Attribute name
     * @returns {number} - Final computed value
     * @protected
     */
    _getFinalValue(key) {
        const base = this._base[key] || 0;
        const mods = this._modifiers[key] || { add: 0, mult: 1 };
        
        return (base + mods.add) * mods.mult;
    }
    
    /**
     * Add modifier to an attribute
     * 
     * @param {string} key - Attribute name
     * @param {number} additive - Additive modifier (default: 0)
     * @param {number} multiplicative - Multiplicative modifier (default: 1)
     * @returns {void}
     * 
     * @example
     * attributes.addModifier('damage', 10)        // +10 damage
     * attributes.addModifier('range', 0, 1.5)     // x1.5 range
     * attributes.addModifier('critChance', 0.05, 1.2)  // +5% then x1.2
     */
    addModifier(key, additive = 0, multiplicative = 1) {
        if (!this._modifiers[key]) {
            this._modifiers[key] = { add: 0, mult: 1 };
        }
        
        this._modifiers[key].add += additive;
        this._modifiers[key].mult *= multiplicative;
    }
    
    /**
     * Remove all modifiers for a specific attribute
     * 
     * @param {string} key - Attribute name
     * @returns {void}
     */
    removeModifiers(key) {
        delete this._modifiers[key];
    }
    
    /**
     * Remove all modifiers for all attributes
     * 
     * @returns {void}
     */
    clearAllModifiers() {
        this._modifiers = {};
    }
    
    /**
     * Get base value (without modifiers) for an attribute
     * 
     * @param {string} key - Attribute name
     * @returns {number} - Base value
     */
    getBaseValue(key) {
        return this._base[key] || 0;
    }
    
    /**
     * Serialize to JSON
     * 
     * @returns {Object}
     */
    toJSON() {
        return {
            base: { ...this._base },
            modifiers: { ...this._modifiers }
        };
    }
}
