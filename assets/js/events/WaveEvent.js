import { Event } from './Event.js';

/**
 * WaveEvent - Base class for wave-related events
 */
export class WaveEvent extends Event {
    /**
     * @type {Wave}
     */
    wave;

    /**
     * @param {string} eventType - Specific wave event type
     * @param {Wave} wave - Wave that emitted the event
     * @param {Object} [payload={}] - Additional event data
     */
    constructor(eventType, wave, payload = {}) {
        super(`wave:${eventType}`, wave, payload);
        this.wave = wave;
    }
}

/**
 * WaveStartedEvent - Wave has started spawning
 */
export class WaveStartedEvent extends WaveEvent {
    /**
     * @type {number}
     */
    waveNumber;

    /**
     * @type {number}
     */
    totalEnemies;

    /**
     * @param {Wave} wave
     * @param {number} waveNumber
     * @param {number} totalEnemies
     */
    constructor(wave, waveNumber, totalEnemies) {
        super('started', wave, { waveNumber, totalEnemies });
        this.waveNumber = waveNumber;
        this.totalEnemies = totalEnemies;
    }
}

/**
 * WaveCompletedEvent - All enemies from wave have spawned
 */
export class WaveCompletedEvent extends WaveEvent {
    /**
     * @type {number}
     */
    waveNumber;

    /**
     * @type {number}
     */
    totalEnemies;

    /**
     * @param {Wave} wave
     * @param {number} waveNumber
     * @param {number} totalEnemies
     */
    constructor(wave, waveNumber, totalEnemies) {
        super('completed', wave, { waveNumber, totalEnemies });
        this.waveNumber = waveNumber;
        this.totalEnemies = totalEnemies;
    }
}
