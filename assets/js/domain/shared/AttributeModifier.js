/**
 * AttributeModifier - Generic modifier for entity attributes
 * 
 * Represents any modification to an attribute (buff, debuff, upgrade, etc.)
 * Uses closure-based compute function for maximum flexibility.
 * 
 * Value Object (Domain Shared Context)
 */
export class AttributeModifier {
    /**
     * @type {string} - Unique identifier
     */
    id;
    
    /**
     * @type {string} - Target attribute name (e.g., 'damage', 'range', 'speed')
     */
    targetAttribute;
    
    /**
     * @type {Function} - Computation function: (baseValue, context) => finalValue
     */
    compute;
    
    /**
     * @type {number} - Priority for stacking (higher = applied later)
     */
    priority;
    
    /**
     * @type {string} - Source/reason for this modifier
     */
    source;
    
    /**
     * @param {Object} config - Configuration object
     * @param {string} config.id - Unique identifier
     * @param {string} config.targetAttribute - Target attribute name
     * @param {Function} config.compute - Computation function (baseValue, context) => finalValue
     * @param {number} [config.priority=0] - Stacking priority
     * @param {string} [config.source=''] - Source/reason
     */
    constructor({ id, targetAttribute, compute, priority = 0, source = '' }) {
        this.id = id;
        this.targetAttribute = targetAttribute;
        this.compute = compute;
        this.priority = priority;
        this.source = source;
    }
    
    /**
     * Apply this modifier to a base value
     * @param {number} baseValue - Base attribute value
     * @param {Object} context - Context object with entity, attributeName, etc.
     * @returns {number} - Modified value
     */
    apply(baseValue, context) {
        return this.compute(baseValue, context);
    }
}
