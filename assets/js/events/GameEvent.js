import { Event } from './Event.js';

/**
 * GameEvent - Base class for game-level events
 */
export class GameEvent extends Event {
    /**
     * @type {Game}
     */
    game;
    
    /**
     * @param {string} eventType - Specific game event type
     * @param {Game} game - Game instance
     * @param {Object} [payload={}] - Additional event data
     */
    constructor(eventType, game, payload = {}) {
        super(`game:${eventType}`, game, payload);
        this.game = game;
    }
}

/**
 * GameStateChangedEvent - Game state changed
 */
export class GameStateChangedEvent extends GameEvent {
    /**
     * @type {string}
     */
    oldState;
    
    /**
     * @type {string}
     */
    newState;
    
    /**
     * @param {Game} game
     * @param {string} oldState
     * @param {string} newState
     */
    constructor(game, oldState, newState) {
        super('stateChanged', game, { oldState, newState });
        this.oldState = oldState;
        this.newState = newState;
    }
}

/**
 * GameOverEvent - Game ended
 */
export class GameOverEvent extends GameEvent {
    /**
     * @type {string}
     */
    reason;
    
    /**
     * @type {number}
     */
    finalScore;
    
    /**
     * @param {Game} game
     * @param {string} reason
     * @param {number} finalScore
     */
    constructor(game, reason, finalScore) {
        super('over', game, { reason, finalScore });
        this.reason = reason;
        this.finalScore = finalScore;
    }
}
