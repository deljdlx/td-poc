import { Enemy } from '../../domain/combat/entities/Enemy.js';
import { WaveStartedEvent, WaveCompletedEvent } from '../../events/WaveEvent.js';
import { EnemySpawnedEvent } from '../../events/EnemyEvent.js';

/**
 * WaveManager - Handles enemy wave spawning
 */
export class WaveManager {
    /** @type {Wave|null} */
    activeWave = null;
    
    /** @type {number} */
    spawnTimer = 0;
    
    /** @type {EntityManager} */
    entityManager = null;
    
    /** @type {CoordinateSystem} */
    coordSystem = null;
    
    /** @type {Debug} */
    debug = null;
    
    /** @type {boolean} */
    isSpawning = false;
    
    /** @type {Object} - Game event bus for emitting enemy spawned events */
    gameEvents = null;
    
    /**
     * @param {EntityManager} entityManager
     * @param {CoordinateSystem} coordSystem
     * @param {DIContainer} diContainer
     */
    constructor(entityManager, coordSystem, diContainer) {
        this.entityManager = entityManager;
        this.coordSystem = coordSystem;
        this.debug = diContainer.createDebug('WaveManager', true);
    }
    
    /**
     * Set game events handler (called by Game)
     * @param {Object} gameEvents - EventBus handler from Game
     * @returns {void}
     */
    setGameEvents(gameEvents) {
        this.gameEvents = gameEvents;
    }
    
    /**
     * Start a wave
     * @param {Wave} wave
     * @param {number} [waveNumber=1] - Wave number for tracking
     * @returns {void}
     */
    startWave(wave, waveNumber = 1) {
        if (this.isSpawning) {
            this.debug.warning('Wave already in progress');
            return;
        }
        
        this.activeWave = wave;
        this.spawnTimer = 0;
        this.isSpawning = true;
        
        // Emit wave started event
        const event = new WaveStartedEvent(wave, waveNumber, wave.getTotalCount());
        wave.events.emit('started', event);
        
        this.debug.success('Wave started', {
            totalEnemies: wave.getTotalCount(),
            spawnDelay: wave.spawnDelay,
            waveNumber
        });
    }
    
    /**
     * Update wave spawning
     * @param {number} deltaTime - in seconds
     * @returns {void}
     */
    update(deltaTime) {
        if (!this.isSpawning || !this.activeWave) {
            return;
        }
        
        // Increment spawn timer
        this.spawnTimer += deltaTime;
        
        // Check if it's time to spawn next enemy
        if (this.spawnTimer >= this.activeWave.spawnDelay) {
            this.spawnTimer = 0;
            
            const enemyConfig = this.activeWave.getNextEnemy();
            
            if (enemyConfig) {
                this.spawnEnemy(enemyConfig);
            }
            
            // Check if wave is complete
            if (this.activeWave.isComplete()) {
                this.onWaveComplete();
            }
        }
    }
    
    /**
     * Spawn an enemy at path start
     * @param {Object} config - {type, health, speed, reward}
     * @returns {void}
     */
    spawnEnemy(config) {
        if (!this.activeWave || !this.activeWave.path) {
            this.debug.error('Cannot spawn enemy: no active wave or path');
            return;
        }
        
        const path = this.activeWave.path;
        const startElement = path.getStartElement();
        
        if (!startElement) {
            this.debug.error('Cannot spawn enemy: path has no start');
            return;
        }
        
        // Get spawn position (center of start cell)
        const spawnPos = this.coordSystem.getElementCenter(startElement.cell.element);
        
        // Create enemy with config
        const enemy = new Enemy(spawnPos.x, spawnPos.y);
        enemy.enemyType = config.type;
        enemy.health = config.health;
        enemy.maxHealth = config.health;
        enemy.attributes.speed = config.speed; // Speed in cells/second
        enemy.path = path;
        enemy.currentPathIndex = 0;
        enemy.coordSystem = this.coordSystem;
        
        this.entityManager.addEntity(enemy);
        
        // Emit enemy spawned event to Game event bus
        if (this.gameEvents) {
            const spawnEvent = new EnemySpawnedEvent(enemy, spawnPos);
            this.gameEvents.emit('enemySpawned', spawnEvent);
        }
        
        this.debug.info('Enemy spawned', {
            position: spawnPos,
            health: config.health,
            speed: config.speed,
            remaining: this.activeWave.getRemainingCount()
        });
    }
    
    /**
     * Called when all enemies have been spawned
     * @param {number} [waveNumber=1] - Wave number
     * @returns {void}
     */
    onWaveComplete(waveNumber = 1) {
        if (!this.activeWave) {
            return;
        }
        
        const totalSpawned = this.activeWave.getTotalCount();
        
        // Emit wave completed event
        const event = new WaveCompletedEvent(this.activeWave, waveNumber, totalSpawned);
        this.activeWave.events.emit('completed', event);
        
        this.debug.success('Wave spawn complete', {
            totalSpawned,
            waveNumber
        });
        
        this.isSpawning = false;
        // Note: wave ends when all enemies are defeated, not just spawned
    }
    
    /**
     * Stop current wave
     * @returns {void}
     */
    stopWave() {
        if (this.activeWave) {
            this.debug.info('Wave stopped');
            this.activeWave = null;
            this.isSpawning = false;
            this.spawnTimer = 0;
        }
    }
    
    /**
     * Check if wave is active
     * @returns {boolean}
     */
    hasActiveWave() {
        return this.activeWave !== null;
    }
}
