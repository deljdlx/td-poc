/**
 * Wave configuration - defines a wave of enemies
 */
export class Wave {
    /** @type {Array<Object>} */
    enemies = [];
    
    /** @type {number} */
    spawnDelay = 1.0;
    
    /** @type {number} */
    spawnedCount = 0;
    
    /** @type {Path} */
    path = null;
    
    /**
     * @param {Array<Object>} enemyConfigs - Array of {type, health, speed, count}
     * @param {number} spawnDelay - Seconds between each spawn
     * @param {Path} path - Path for enemies to follow
     */
    constructor(enemyConfigs, spawnDelay, path) {
        this.spawnDelay = spawnDelay;
        this.path = path;
        
        // Flatten enemy configs into individual enemies
        enemyConfigs.forEach(config => {
            const count = config.count || 1;
            for (let i = 0; i < count; i++) {
                this.enemies.push({
                    type: config.type || 'basic',
                    health: config.health || 100,
                    speed: config.speed || 50,
                    reward: config.reward || 10
                });
            }
        });
    }
    
    /**
     * Get next enemy config to spawn
     * @returns {Object|null}
     */
    getNextEnemy() {
        if (this.spawnedCount < this.enemies.length) {
            const enemy = this.enemies[this.spawnedCount];
            this.spawnedCount++;
            return enemy;
        }
        return null;
    }
    
    /**
     * Check if all enemies have been spawned
     * @returns {boolean}
     */
    isComplete() {
        return this.spawnedCount >= this.enemies.length;
    }
    
    /**
     * Get total enemy count
     * @returns {number}
     */
    getTotalCount() {
        return this.enemies.length;
    }
    
    /**
     * Get remaining enemy count
     * @returns {number}
     */
    getRemainingCount() {
        return this.enemies.length - this.spawnedCount;
    }
    
    /**
     * Reset wave (for restart)
     * @returns {void}
     */
    reset() {
        this.spawnedCount = 0;
    }
}
