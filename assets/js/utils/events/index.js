/**
 * Event system - Centralized exports
 * Import all event classes from this single file
 */

// Base Event
export { Event } from './Event.js';

// Enemy Events
export { 
    EnemyEvent,
    EnemyHitEvent,
    EnemyDeathEvent,
    EnemyReachedEndEvent
} from './EnemyEvent.js';

// Tower Events
export {
    TowerEvent,
    TowerFiredEvent,
    TowerPlacedEvent,
    TowerMovedEvent
} from './TowerEvent.js';

// Wave Events
export {
    WaveEvent,
    WaveStartedEvent,
    WaveCompletedEvent
} from './WaveEvent.js';

// Player Events
export {
    PlayerEvent,
    PlayerResourceChangedEvent,
    PlayerDamagedEvent
} from './PlayerEvent.js';

// Game Events
export {
    GameEvent,
    GameStateChangedEvent,
    GameOverEvent
} from './GameEvent.js';

// UI Events
export {
    UIEvent,
    PopupEvent,
    PopupOpenedEvent,
    PopupClosedEvent
} from './UIEvent.js';
