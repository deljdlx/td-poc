import { Entity } from '../../shared/Entity.js';
import { TowerAttributes } from '../value-objects/TowerAttributes.js';
import { AttributesProxy } from '../../shared/AttributesProxy.js';
import { TowerFiredEvent } from '../../../events/TowerEvent.js';
import { EventBus } from '../../../services/core/EventBus.js';

/**
 * Tower - Defensive tower entity that shoots missiles at targets
 * Placed on grid cells, shoots on demand (click)
 * 
 * Domain Entity (Combat Bounded Context)
 */
export class Tower extends Entity {
    /**
     * @type {Cell}
     */
    cell;

    /**
     * @type {string}
     */
    color;
    
    /**
     * @type {number}
     */
    size;
    
    /**
     * @type {TowerAttributes} - Base attributes (internal storage)
     * @private
     */
    _attributes;
    
    /**
     * @type {AttributesProxy} - Proxy for attribute access with modifiers
     * @private
     */
    _attributesProxy;
    
    /**
     * @type {Object}
     */
    coordSystem;
    
    /**
     * @type {DIContainer}
     */
    container;
    
    /**
     * @type {Game}
     */
    game;
    
    /**
     * @type {number}
     */
    currentCooldown;
    
    /**
     * @type {EntityManager}
     */
    entityManager;
    
    /**
     * @type {Object}
     */
    stats;
    
    /**
     * @type {string}
     */
    playerId;
    
    /**
     * @type {string} - Tower type ID (reference to blueprint)
     */
    towerTypeId;
    
    /**
     * @type {string} - Missile type ID (reference to blueprint)
     */
    missileTypeId;
    
    /**
     * @type {Object} - Missile configuration for this tower
     */
    missileConfig;
    
    /**
     * @type {Object} EventBus handler
     */
    events;
    
    /**
     * @param {Cell} cell - Grid cell where tower is placed
     * @param {string} playerId - ID of the player who owns this tower
     * @param {DIContainer} diContainer
     * @param {Game} game - Game instance for blueprint lookup
     * @param {Object} towerBlueprint - Tower type blueprint
     */
    constructor(cell, playerId, diContainer, game, towerBlueprint) {
        const debug = diContainer.createDebug('Tower', true);
        const coordSystem = diContainer.get('coordinateSystem');
        
        // Get cell center position
        const center = coordSystem.getElementCenter(cell.element);
        
        super('tower', center.x, center.y);
        
        this.cell = cell;
        this.playerId = playerId;
        this.coordSystem = coordSystem;
        this.container = diContainer;
        this.game = game;
        this.entityManager = game.entityManager; // Use game's entityManager
        this.currentCooldown = 0.0; // Start ready to shoot
        this.events = EventBus.createHandler(this);
        
        // Store tower type ID
        this.towerTypeId = towerBlueprint.id;
        
        // Visual attributes from blueprint
        this.color = towerBlueprint.visualFx.color;
        this.size = towerBlueprint.visualFx.size;
        
        // Gameplay attributes from blueprint
        const cooldown = 1.0 / towerBlueprint.stats.fireRate; // Convert fireRate to cooldown
        this._attributes = new TowerAttributes(
            towerBlueprint.stats.range,
            cooldown,
            towerBlueprint.stats.critChance,
            towerBlueprint.stats.critMultiplier
        );
        this._attributesProxy = new AttributesProxy(this._attributes, this);
        
        // Get missile blueprint from tower blueprint
        const missileBlueprint = game.missileTypes[towerBlueprint.missileTypeId];
        this.missileTypeId = missileBlueprint.id;
        
        // Missile configuration (munition specs) - Initialize from blueprint
        this.missileConfig = {
            damage: missileBlueprint.damage,
            splashRadius: missileBlueprint.splashRadius,
            speed: missileBlueprint.speed,
            lifetime: missileBlueprint.lifetime
        };
        
        // Stats tracking
        this.stats = {
            shotsFired: 0,
            hits: 0,
            totalDamage: 0,
            kills: 0,
            criticalHits: 0
        };

        debug.success('Tower created', { 
            row: cell.row, 
            col: cell.col, 
            x: center.x, 
            y: center.y,
            missileType: this.missileTypeId
        });
    }
    
    /**
     * Get attributes with modifiers applied
     * @returns {AttributesProxy}
     */
    get attributes() {
        return this._attributesProxy;
    }
    
    /**
     * Get missile blueprint from Game registry (for introspection)
     * Allows dynamic lookup in case missile type changes
     * @returns {Object|null} - Missile blueprint or null if not found
     */
    getMissileBlueprint() {
        return this.game.missileTypes[this.missileTypeId] || null;
    }
    
    /**
     * Shoot missile towards target position
     * @param {number} targetX
     * @param {number} targetY
     * @param {Enemy} [target=null] - Target enemy (optional)
     * @returns {boolean} - True if shot was fired, false if on cooldown
     */
    shoot(targetX, targetY, target = null) {
        if (!this.canShoot()) {
            return false;
        }
        
        // Track shot
        this.stats.shotsFired++;
        
        // Get full missile blueprint for visual effects
        const missileBlueprint = this.getMissileBlueprint();
        
        // Emit shoot event with target coordinates and full blueprint
        this.events.emit('shoot', {
            tower: this,
            x: this.x,
            y: this.y,
            targetX,
            targetY,
            target,
            missileBlueprint: missileBlueprint
        });
        
        // Emit typed event (legacy - can be deprecated later)
        const event = new TowerFiredEvent(this, target, null); // missile is null for now
        this.events.emit('fired', event);
        
        // Reset cooldown
        this.currentCooldown = this.attributes.cooldown;
        return true;
    }
    
    /**
     * Track a successful hit
     * @param {number} damage
     * @param {boolean} isCrit
     * @returns {void}
     */
    trackHit(damage, isCrit) {
        this.stats.hits++;
        this.stats.totalDamage += damage;
        if (isCrit) {
            this.stats.criticalHits++;
        }
    }
    
    /**
     * Track a kill
     * @returns {void}
     */
    trackKill() {
        this.stats.kills++;
    }
    
    /**
     * Update tower - manage cooldown and auto-targeting
     * @param {number} deltaTime
     * @returns {void}
     */
    update(deltaTime) {
        // Decrement cooldown
        if (this.currentCooldown > 0) {
            this.currentCooldown -= deltaTime;
            if (this.currentCooldown < 0) {
                this.currentCooldown = 0;
            }
        }
        
        // Auto-targeting: shoot closest enemy in range when cooldown ready
        if (this.canShoot()) {
            const enemy = this.getClosestEnemyInRange(this.entityManager);
            if (enemy) {
                this.shoot(enemy.x, enemy.y, enemy);
            }
        }
    }
    
    /**
     * Check if tower can shoot (cooldown ready)
     * @returns {boolean}
     */
    canShoot() {
        return this.currentCooldown <= 0;
    }
    
    /**
     * Get distance to another entity
     * @param {Entity} entity
     * @returns {number} - Distance in pixels
     */
    getDistanceTo(entity) {
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Get all enemies within tower range
     * @param {EntityManager} entityManager
     * @returns {Array<Enemy>} - Enemies in range
     */
    getEnemiesInRange(entityManager) {
        const rangePixels = this.coordSystem.cellsToPixels(this.attributes.range);
        const enemies = entityManager.getEntities().filter(e => 
            e.getType() === 'enemy' && e.alive
        );
        
        return enemies.filter(enemy => {
            const distance = this.getDistanceTo(enemy);
            return distance <= rangePixels;
        });
    }
    
    /**
     * Get closest enemy within tower range
     * @param {EntityManager} entityManager
     * @returns {Enemy|null} - Closest enemy or null if none in range
     */
    getClosestEnemyInRange(entityManager) {
        const enemiesInRange = this.getEnemiesInRange(entityManager);
        
        if (enemiesInRange.length === 0) {
            return null;
        }
        
        let closest = enemiesInRange[0];
        let minDistance = this.getDistanceTo(closest);
        
        for (let i = 1; i < enemiesInRange.length; i++) {
            const distance = this.getDistanceTo(enemiesInRange[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closest = enemiesInRange[i];
            }
        }
        
        return closest;
    }
}
