import { ResourceRegistry } from './Resource.js';
import { PlayerResourceChangedEvent } from '../../utils/events/PlayerEvent.js';

/**
 * Wallet - Manages player's resource inventory
 * Stores quantities of different resource types
 */
export class Wallet {
    /**
     * @type {Map<string, number>}
     */
    resources = new Map();
    
    /**
     * @type {Debug|null}
     */
    debug = null;
    
    /**
     * @type {Object|null} - Player who owns this wallet
     */
    player = null;
    
    /**
     * @param {Object} [player=null] - Player instance
     * @param {Debug} [debug=null] - Optional debug instance
     */
    constructor(player = null, debug = null) {
        this.player = player;
        this.debug = debug;
    }
    
    /**
     * Add amount of a resource
     * @param {string} type - Resource type
     * @param {number} amount - Amount to add
     * @returns {boolean} - True if added successfully
     */
    add(type, amount) {
        if (amount <= 0) {
            return false;
        }
        
        const current = this.get(type);
        const newAmount = current + amount;
        
        // Check capacity
        const resource = ResourceRegistry.get(type);
        if (resource && resource.exceedsCapacity(newAmount)) {
            // Cap at max capacity
            this.resources.set(type, resource.maxCapacity);
            if (this.debug) {
                this.debug.warning('Resource at max capacity', { 
                    type, 
                    maxCapacity: resource.maxCapacity 
                });
            }
            return false;
        }
        
        this.resources.set(type, newAmount);
        
        // Emit resource changed event
        if (this.player) {
            const event = new PlayerResourceChangedEvent(this.player, type, amount, newAmount);
            this.player.events.emit('resourceChanged', event);
        }
        
        if (this.debug) {
            this.debug.info(`Added ${amount} ${type}`, { 
                current, 
                new: newAmount 
            });
        }
        
        return true;
    }
    
    /**
     * Spend/remove amount of a resource
     * @param {string} type - Resource type
     * @param {number} amount - Amount to spend
     * @returns {boolean} - True if spent successfully, false if insufficient
     */
    spend(type, amount) {
        if (amount <= 0) {
            return false;
        }
        
        if (!this.has(type, amount)) {
            if (this.debug) {
                this.debug.warning('Insufficient resources', { 
                    type, 
                    required: amount, 
                    available: this.get(type) 
                });
            }
            return false;
        }
        
        const current = this.get(type);
        const newAmount = current - amount;
        this.resources.set(type, newAmount);
                // Emit resource changed event
        if (this.player) {
            const event = new PlayerResourceChangedEvent(this.player, type, -amount, newAmount);
            this.player.events.emit('resourceChanged', event);
        }
                if (this.debug) {
            this.debug.info(`Spent ${amount} ${type}`, { 
                current, 
                remaining: newAmount 
            });
        }
        
        return true;
    }
    
    /**
     * Check if wallet has at least amount of resource
     * @param {string} type - Resource type
     * @param {number} amount - Amount to check
     * @returns {boolean}
     */
    has(type, amount) {
        return this.get(type) >= amount;
    }
    
    /**
     * Get current amount of a resource
     * @param {string} type - Resource type
     * @returns {number}
     */
    get(type) {
        return this.resources.get(type) || 0;
    }
    
    /**
     * Set exact amount of a resource
     * @param {string} type - Resource type
     * @param {number} amount - Exact amount
     * @returns {void}
     */
    set(type, amount) {
        if (amount < 0) {
            amount = 0;
        }
        
        // Check capacity
        const resource = ResourceRegistry.get(type);
        if (resource && resource.exceedsCapacity(amount)) {
            amount = resource.maxCapacity;
        }
        
        this.resources.set(type, amount);
    }
    
    /**
     * Get all resources as object
     * @returns {Object}
     */
    getAll() {
        const result = {};
        this.resources.forEach((amount, type) => {
            result[type] = amount;
        });
        return result;
    }
    
    /**
     * Clear all resources
     * @returns {void}
     */
    clear() {
        this.resources.clear();
    }
    
    /**
     * Transfer resource to another wallet
     * @param {Wallet} targetWallet - Target wallet
     * @param {string} type - Resource type
     * @param {number} amount - Amount to transfer
     * @returns {boolean} - True if transfer successful
     */
    transfer(targetWallet, type, amount) {
        const resource = ResourceRegistry.get(type);
        if (resource && !resource.tradeable) {
            if (this.debug) {
                this.debug.warning('Resource not tradeable', { type });
            }
            return false;
        }
        
        if (this.spend(type, amount)) {
            targetWallet.add(type, amount);
            return true;
        }
        
        return false;
    }
    
    /**
     * Serialize wallet to JSON-friendly object
     * @returns {Object}
     */
    toJSON() {
        return this.getAll();
    }
    
    /**
     * Restore wallet from JSON object
     * @param {Object} data
     * @returns {void}
     */
    fromJSON(data) {
        this.clear();
        Object.entries(data).forEach(([type, amount]) => {
            this.set(type, amount);
        });
    }
}
