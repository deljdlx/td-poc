/**
 * AttributesProxy - Transparent proxy wrapper for Attributes with modifier support
 * 
 * Wraps an Attributes instance and applies modifiers from the entity's modifier stack.
 * Provides transparent access to computed attribute values through Proxy.
 * Implements lazy evaluation with caching and dirty tracking for performance.
 * 
 * Value Object (Domain Shared Context)
 */
export class AttributesProxy {
    /**
     * @type {Attributes} - Underlying attributes (base values)
     * @private
     */
    _attributes;
    
    /**
     * @type {Entity} - Owner entity
     * @private
     */
    _entity;
    
    /**
     * @type {Object} - Cached computed values
     * @private
     */
    _cache = {};
    
    /**
     * @type {Set<string>} - Dirty attributes needing recalculation
     * @private
     */
    _dirty = new Set();
    
    /**
     * @param {Attributes} attributes - Base attributes instance
     * @param {Entity} entity - Owner entity (for accessing modifiers)
     */
    constructor(attributes, entity) {
        this._attributes = attributes;
        this._entity = entity;
        
        // Return proxy instead of this
        return new Proxy(this, {
            get: (target, prop) => target._handleGet(prop),
            set: (target, prop, value) => target._handleSet(prop, value)
        });
    }
    
    /**
     * Handle property access - return computed value with modifiers
     * @private
     */
    _handleGet(prop) {
        // Pass through methods and private properties
        if (typeof this[prop] === 'function' || prop.startsWith('_')) {
            return this[prop];
        }
        
        // Check cache first
        if (this._cache[prop] !== undefined && !this._dirty.has(prop)) {
            return this._cache[prop];
        }
        
        // Compute value with modifiers
        const baseValue = this._attributes.getBaseValue(prop);
        if (baseValue === undefined) {
            return undefined;
        }
        
        const finalValue = this._computeWithModifiers(prop, baseValue);
        
        // Cache result
        this._cache[prop] = finalValue;
        this._dirty.delete(prop);
        
        return finalValue;
    }
    
    /**
     * Handle property assignment - update base value and invalidate cache
     * @private
     */
    _handleSet(prop, value) {
        // Update base value
        this._attributes._base[prop] = value;
        
        // Invalidate cache
        this.invalidate(prop);
        
        return true;
    }
    
    /**
     * Compute final value by applying modifiers
     * @private
     */
    _computeWithModifiers(attributeName, baseValue) {
        if (!this._entity.modifiers || this._entity.modifiers.length === 0) {
            return baseValue;
        }
        
        // Filter modifiers that target this attribute
        const applicableModifiers = this._entity.modifiers
            .filter(mod => mod.targetAttribute === attributeName)
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));
        
        if (applicableModifiers.length === 0) {
            return baseValue;
        }
        
        // Apply modifiers in priority order
        let finalValue = baseValue;
        const context = {
            entity: this._entity,
            baseValue: baseValue,
            attributeName: attributeName
        };
        
        for (const modifier of applicableModifiers) {
            finalValue = modifier.apply(finalValue, context);
        }
        
        return finalValue;
    }
    
    /**
     * Invalidate cached value for an attribute
     * @param {string} attributeName - Name of attribute to invalidate
     */
    invalidate(attributeName) {
        this._dirty.add(attributeName);
        delete this._cache[attributeName];
    }
    
    /**
     * Invalidate all cached values
     */
    invalidateAll() {
        this._cache = {};
        this._dirty.clear();
    }
}
