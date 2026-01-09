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
     * @type {number}
     */
    gold = 1000;
    
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
     * @param {string} id - Unique player identifier
     * @param {string} name - Player name
     * @param {string} color - Player color (for visual distinction)
     */
    constructor(id, name, color = '#6366f1') {
        this.id = id;
        this.name = name;
        this.color = color;
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
}
