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
 * TowerPlacedEvent - Tower was placed on grid
 */
export class TowerPlacedEvent extends TowerEvent {
    /**
     * @type {Cell}
     */
    cell;
    
    /**
     * @type {string}
     */
    playerId;
    
    /**
     * @param {Tower} tower
     * @param {Cell} cell
     * @param {string} playerId
     */
    constructor(tower, cell, playerId) {
        super('placed', tower, { cell, playerId });
        this.cell = cell;
        this.playerId = playerId;
    }
}

/**
 * TowerMovedEvent - Tower was moved to another cell
 */
export class TowerMovedEvent extends TowerEvent {
    /**
     * @type {Cell}
     */
    fromCell;
    
    /**
     * @type {Cell}
     */
    toCell;
    
    /**
     * @param {Tower} tower
     * @param {Cell} fromCell
     * @param {Cell} toCell
     */
    constructor(tower, fromCell, toCell) {
        super('moved', tower, { fromCell, toCell });
        this.fromCell = fromCell;
        this.toCell = toCell;
    }
}
