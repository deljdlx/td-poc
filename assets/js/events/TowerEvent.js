import { Event } from './Event.js';

/**
 * TowerEvent - Base class for tower-related events
 */
export class TowerEvent extends Event {
    /**
     * @type {Tower}
     */
    tower;
    
    /**
     * @param {string} eventType - Specific tower event type
     * @param {Tower} tower - Tower that emitted the event
     * @param {Object} [payload={}] - Additional event data
     */
    constructor(eventType, tower, payload = {}) {
        super(`tower:${eventType}`, tower, payload);
        this.tower = tower;
    }
}

/**
 * TowerFiredEvent - Tower fired a missile
 */
export class TowerFiredEvent extends TowerEvent {
    /**
     * @type {Enemy}
     */
    target;
    
    /**
     * @type {Missile}
     */
    missile;
    
    /**
     * @param {Tower} tower
     * @param {Enemy} target
     * @param {Missile} missile
     */
    constructor(tower, target, missile) {
        super('fired', tower, { target, missile });
        this.target = target;
        this.missile = missile;
    }
}

/**
 * TowerPlacedEvent - Tower was placed on a cell
 */
export class TowerPlacedEvent extends TowerEvent {
    /**
     * @type {Cell}
     */
    cell;
    
    /**
     * @param {Tower} tower
     * @param {Cell} cell
     */
    constructor(tower, cell) {
        super('placed', tower, { cell });
        this.cell = cell;
    }
}
