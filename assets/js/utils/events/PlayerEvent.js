import { Event } from './Event.js';

/**
 * PlayerEvent - Base class for player-related events
 */
export class PlayerEvent extends Event {
    /**
     * @type {Player}
     */
    player;
    
    /**
     * @param {string} eventType - Specific player event type
     * @param {Player} player - Player that emitted the event
     * @param {Object} [payload={}] - Additional event data
     */
    constructor(eventType, player, payload = {}) {
        super(`player:${eventType}`, player, payload);
        this.player = player;
    }
}

/**
 * PlayerResourceChangedEvent - Player resource amount changed
 */
export class PlayerResourceChangedEvent extends PlayerEvent {
    /**
     * @type {string}
     */
    resourceType;
    
    /**
     * @type {number}
     */
    amount;
    
    /**
     * @type {number}
     */
    total;
    
    /**
     * @param {Player} player
     * @param {string} resourceType - 'money', 'mana', 'gems'
     * @param {number} amount - Change amount (positive or negative)
     * @param {number} total - New total
     */
    constructor(player, resourceType, amount, total) {
        super('resourceChanged', player, { resourceType, amount, total });
        this.resourceType = resourceType;
        this.amount = amount;
        this.total = total;
    }
}

/**
 * PlayerDamagedEvent - Player lost lives
 */
export class PlayerDamagedEvent extends PlayerEvent {
    /**
     * @type {number}
     */
    livesLost;
    
    /**
     * @type {number}
     */
    livesRemaining;
    
    /**
     * @param {Player} player
     * @param {number} livesLost
     * @param {number} livesRemaining
     */
    constructor(player, livesLost, livesRemaining) {
        super('damaged', player, { livesLost, livesRemaining });
        this.livesLost = livesLost;
        this.livesRemaining = livesRemaining;
    }
}
