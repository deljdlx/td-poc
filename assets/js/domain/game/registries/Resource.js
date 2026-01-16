/**
 * Resource - Defines a resource type (metadata/definition)
 * Resources are things players can collect and spend (gold, mana, wood, etc.)
 */
export class Resource {
    /**
     * @type {string}
     */
    type;
    
    /**
     * @type {string}
     */
    name;
    
    /**
     * @type {string}
     */
    icon;
    
    /**
     * @type {number|null}
     */
    maxCapacity;
    
    /**
     * @type {boolean}
     */
    tradeable;
    
    /**
     * @type {string}
     */
    description;
    
    /**
     * @param {string} type - Unique resource type identifier (e.g., 'money', 'mana')
     * @param {string} name - Display name (e.g., 'Gold', 'Mana')
     * @param {string} [icon=''] - Icon/emoji for display
     * @param {Object} [options={}] - Additional options
     * @param {number} [options.maxCapacity=null] - Maximum capacity (null = unlimited)
     * @param {boolean} [options.tradeable=true] - Can be traded/transferred
     * @param {string} [options.description=''] - Description text
     */
    constructor(type, name, icon = '', options = {}) {
        this.type = type;
        this.name = name;
        this.icon = icon;
        this.maxCapacity = options.maxCapacity || null;
        this.tradeable = options.tradeable !== undefined ? options.tradeable : true;
        this.description = options.description || '';
    }
    
    /**
     * Check if amount exceeds max capacity
     * @param {number} amount
     * @returns {boolean}
     */
    exceedsCapacity(amount) {
        if (this.maxCapacity === null) {
            return false;
        }
        return amount > this.maxCapacity;
    }
    
    /**
     * Get display string with icon
     * @returns {string}
     */
    getDisplayName() {
        return this.icon ? `${this.icon} ${this.name}` : this.name;
    }
}

/**
 * ResourceRegistry - Global registry for resource definitions
 */
export class ResourceRegistry {
    /**
     * @type {Map<string, Resource>}
     */
    static resources = new Map();
    
    /**
     * Register a resource type
     * @param {Resource} resource
     * @returns {void}
     */
    static register(resource) {
        this.resources.set(resource.type, resource);
    }
    
    /**
     * Get a resource definition by type
     * @param {string} type
     * @returns {Resource|null}
     */
    static get(type) {
        return this.resources.get(type) || null;
    }
    
    /**
     * Check if resource type exists
     * @param {string} type
     * @returns {boolean}
     */
    static has(type) {
        return this.resources.has(type);
    }
    
    /**
     * Get all registered resources
     * @returns {Array<Resource>}
     */
    static getAll() {
        return Array.from(this.resources.values());
    }
}

// Register default resources
ResourceRegistry.register(
    new Resource('money', 'Gold', '💰', {
        description: 'Currency used to build and upgrade towers'
    })
);

ResourceRegistry.register(
    new Resource('mana', 'Mana', '✨', {
        maxCapacity: 100,
        description: 'Magical energy for special abilities'
    })
);

ResourceRegistry.register(
    new Resource('gems', 'Gems', '💎', {
        tradeable: true,
        description: 'Premium currency for special upgrades'
    })
);
