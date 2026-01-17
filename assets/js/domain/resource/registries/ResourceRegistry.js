import { Resource } from '../value-objects/Resource.js';

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
