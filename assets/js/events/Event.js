/**
 * Event - Base class for all game events
 * Normalized structure for all events in the game
 */
export class Event {
  /**
   * @type {string}
   */
  type;

  /**
   * @type {Object}
   */
  source;

  /**
   * @type {Object}
   */
  payload;

  /**
   * @type {number|null}
   */
  gameTime = null;

  /**
   * @type {number}
   */
  timestamp;

  /**
   * @param {string} type - Event type (e.g., 'enemy:hit', 'tower:fired')
   * @param {Object} source - Source entity that emitted the event
   * @param {Object} [payload={}] - Custom event data
   */
  constructor(type, source, payload = {}) {
    this.type = type;
    this.source = source;
    this.payload = payload;
    this.timestamp = Date.now();
  }

  /**
   * String representation for debugging
   * @returns {string}
   */
  toString() {
    const sourceId = this.source?.id || "unknown";
    const sourceType = this.source?.type || "unknown";
    return `[${this.type}] from ${sourceType}#${sourceId}`;
  }

  /**
   * Serialize event to JSON (for replay/network)
   * @returns {Object}
   */
  toJSON() {
    return {
      type: this.type,
      sourceId: this.source?.id,
      sourceType: this.source?.type,
      payload: this.payload,
      gameTime: this.gameTime,
      timestamp: this.timestamp,
    };
  }
}
