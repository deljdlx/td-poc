import { Event } from "./Event.js";

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
    super("fired", tower, { target, missile });
    this.target = target;
    this.missile = missile;
  }
}

/**
 * TowerPlacedEvent - Tower was placed on a cell
 * SOURCEABLE: Business event for Event Sourcing
 */
export class TowerPlacedEvent extends TowerEvent {
  /**
   * @type {Cell}
   */
  cell;

  /**
   * @type {boolean}
   */
  sourceable = true;

  /**
   * @type {Object} - Event Sourcing metadata
   */
  metadata;

  /**
   * @param {Tower} tower
   * @param {Cell} cell
   * @param {Object} [metadata={}] - Business metadata (towerType, cost, playerId, position)
   */
  constructor(tower, cell, metadata = {}) {
    super("placed", tower, { cell, sourceable: true, metadata });
    this.cell = cell;
    this.sourceable = true;
    this.metadata = metadata;
  }
}

/**
 * TowerMovedEvent - Tower was moved from one cell to another
 * SOURCEABLE: Business event for Event Sourcing
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
   * @type {boolean}
   */
  sourceable = true;

  /**
   * @type {Object} - Event Sourcing metadata
   */
  metadata;

  /**
   * @param {Tower} tower
   * @param {Cell} fromCell
   * @param {Cell} toCell
   * @param {Object} [metadata={}] - Business metadata (towerId, towerType, playerId, fromPosition, toPosition)
   */
  constructor(tower, fromCell, toCell, metadata = {}) {
    super("moved", tower, { fromCell, toCell, sourceable: true, metadata });
    this.fromCell = fromCell;
    this.toCell = toCell;
    this.sourceable = true;
    this.metadata = metadata;
  }
}
