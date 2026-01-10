import { Wallet } from './Wallet.js';
import { PlayerDamagedEvent } from '../../events/PlayerEvent.js';
import { EventBus } from '../../services/core/EventBus.js';

/**
 * Player - Represents a player in the game
 */
export class Player {
    /**
     * @type {string}
     */
    id;
    
    /**
     * @type {string}
     */
    name;
    
    /**
     * @type {string}
     */
    color;
    
    /**
     * @type {Wallet}
     */
    wallet;
    
    /**
     * @type {number}
     */
    lives = 20;
    
    /**
     * @type {number}
     */
    score = 0;
    
    /**
     * @type {Array<Tower>}
     */
    towers = [];
    
    /**
     * @type {Object}
     */
    stats = {
        towersPlaced: 0,
        enemiesKilled: 0,
        totalDamage: 0,
        wavesCompleted: 0
    };
    
    /**
     * @type {Object} EventBus handler
     */
    events;
    
    /**
     * @param {string} id - Unique player identifier
     * @param {string} name - Player name
     * @param {string} color - Player color (for visual distinction)
     * @param {Debug} [debug=null] - Optional debug instance for wallet
     */
    constructor(id, name, color = '#6366f1', debug = null) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.events = EventBus.createHandler(this);
        this.wallet = new Wallet(this, debug);
        
        // Initialize with starting resources
        this.wallet.set('money', 1000);
    }
    
    /**
     * Add a tower to this player's collection
     * @param {Tower} tower
     * @returns {void}
     */
    addTower(tower) {
        this.towers.push(tower);
        this.stats.towersPlaced++;
    }
    
    /**
     * Remove a tower from this player's collection
     * @param {Tower} tower
     * @returns {boolean} - True if tower was removed
     */
    removeTower(tower) {
        const index = this.towers.indexOf(tower);
        if (index !== -1) {
            this.towers.splice(index, 1);
            return true;
        }
        return false;
    }
    
    /**
     * Check if player owns a specific tower
     * @param {Tower} tower
     * @returns {boolean}
     */
    ownsTower(tower) {
        return this.towers.includes(tower);
    }
    
    /**
     * Get all towers owned by this player
     * @returns {Array<Tower>}
     */
    getTowers() {
        return this.towers;
    }
    
    /**
     * Check if player is still alive
     * @returns {boolean}
     */
    isAlive() {
        return this.lives > 0;
    }
    
    /**
     * Player takes damage (loses lives)
     * @param {number} livesLost
     * @returns {void}
     */
    takeDamage(livesLost = 1) {
        const previousLives = this.lives;
        this.lives = Math.max(0, this.lives - livesLost);
        
        // Emit damaged event
        const event = new PlayerDamagedEvent(this, livesLost, this.lives);
        this.events.emit('damaged', event);
    }
    
}
