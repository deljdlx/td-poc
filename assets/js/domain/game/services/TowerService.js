import { Tower } from '../../combat/entities/Tower.js';
import { TowerPlacedEvent } from '../../../events/TowerEvent.js';

/**
 * Tower management service
 * Handles tower placement, movement, and validation
 */
export class TowerService {
    /**
     * @type {DIContainer}
     */
    container;
    
    /**
     * @type {Debug}
     */
    debug;
    
    /**
     * @type {EntityManager}
     */
    entityManager;
    
    /**
     * @type {PlayerManager}
     */
    playerManager;
    
    /**
     * @type {Object} - Tower type blueprints
     */
    towerTypes;
    
    /**
     * @type {Object} - Event handler
     */
    events;
    
    /**
     * @type {Game} - Reference to game for tower creation
     */
    game;
    
    /**
     * @param {DIContainer} container
     * @param {EntityManager} entityManager
     * @param {PlayerManager} playerManager
     * @param {Object} towerTypes - Tower blueprints registry
     * @param {Object} events - Event handler
     * @param {Game} game - Game instance reference
     */
    constructor(container, entityManager, playerManager, towerTypes, events, game) {
        this.container = container;
        this.debug = container.createDebug('TowerService', true);
        this.entityManager = entityManager;
        this.playerManager = playerManager;
        this.towerTypes = towerTypes;
        this.events = events;
        this.game = game;
    }
    
    /**
     * Place a tower on a cell
     * @param {Cell} cell
     * @param {string} towerTypeId - Tower type ID from registry (default: 'basic')
     * @returns {boolean} - True if tower was placed successfully
     */
    placeTower(cell, towerTypeId = 'basic') {
        const activePlayer = this.playerManager.getActivePlayer();
        
        if (!activePlayer) {
            this.debug.error('Cannot place tower - no active player');
            return false;
        }

        // Get tower blueprint
        const towerBlueprint = this.towerTypes[towerTypeId];
        if (!towerBlueprint) {
            this.debug.error(`Unknown tower type: ${towerTypeId}`);
            return false;
        }

        // Check if player can afford the tower
        const cost = towerBlueprint.cost;
        if (!activePlayer.wallet.has('money', cost)) {
            this.debug.warning('Cannot place tower - insufficient funds', {
                required: cost,
                available: activePlayer.wallet.get('money')
            });
            return false;
        }
        
        // Deduct cost
        activePlayer.wallet.spend('money', cost);
        this.debug.info(`Tower purchased for ${cost} gold`, {
            remaining: activePlayer.wallet.get('money')
        });
        
        // Create and place tower from blueprint
        const tower = new Tower(
            cell, 
            activePlayer.id,
            this.container,
            this.game,
            towerBlueprint
        );
        
        // Emit tower created event (SOURCEABLE: business event)
        this.events.emit('towerCreated', {
            sourceable: true,
            metadata: {
                towerId: tower.id,
                towerType: towerTypeId,
                playerId: activePlayer.id,
                cost: cost,
                stats: {
                    damage: tower.attributes.damage,
                    range: tower.attributes.range,
                    fireRate: tower.attributes.fireRate,
                    critChance: tower.attributes.critChance,
                    critMultiplier: tower.attributes.critMultiplier
                },
                timestamp: Date.now()
            }
        });
        
        cell.setTower(tower);
        this.entityManager.addEntity(tower);
        activePlayer.addTower(tower);
        
        // Emit tower placed event (SOURCEABLE: business event)
        const event = new TowerPlacedEvent(tower, cell, {
            towerType: towerTypeId,
            cost: cost,
            playerId: activePlayer.id,
            cellPosition: { row: cell.row, col: cell.col },
            timestamp: Date.now()
        });
        this.events.emit('towerPlaced', event);
        
        this.debug.success('Tower placed', {
            player: activePlayer.name,
            totalTowers: activePlayer.towers.length
        });
        
        return true;
    }
    
    /**
     * Place N towers randomly on empty cells (for testing)
     * @param {GridModel} gridModel
     * @param {number} count
     * @returns {Array<Cell>} - Array of cells where towers were placed
     */
    placeRandomTowers(gridModel, count) {
        const emptyCells = gridModel.getEmptyCells();
        
        if (emptyCells.length < count) {
            this.debug.warning(`Not enough empty cells for ${count} towers, placing ${emptyCells.length}`);
            count = emptyCells.length;
        }
        
        const shuffled = emptyCells.sort(() => Math.random() - 0.5);
        const selectedCells = shuffled.slice(0, count);
        
        const activePlayer = this.playerManager.getActivePlayer();
        if (!activePlayer) {
            this.debug.error('Cannot place towers - no active player');
            return [];
        }
        
        // For random placement (testing), give free towers
        selectedCells.forEach(cell => {
            // Choose random tower type for architecture testing
            const towerTypeIds = ['basic', 'sniper', 'artillery'];
            const towerTypeId = towerTypeIds[Math.floor(Math.random() * towerTypeIds.length)];
            const towerBlueprint = this.towerTypes[towerTypeId];
            
            const tower = new Tower(
                cell, 
                activePlayer.id,
                this.container,
                this.game,
                towerBlueprint
            );
            
            // Emit tower created event (SOURCEABLE: business event)
            this.events.emit('towerCreated', {
                sourceable: true,
                metadata: {
                    towerId: tower.id,
                    towerType: towerTypeId,
                    playerId: activePlayer.id,
                    cost: 0, // Free tower for testing
                    stats: {
                        damage: tower.attributes.damage,
                        range: tower.attributes.range,
                        fireRate: tower.attributes.fireRate,
                        critChance: tower.attributes.critChance,
                        critMultiplier: tower.attributes.critMultiplier
                    },
                    timestamp: Date.now()
                }
            });
            
            cell.setTower(tower);
            this.entityManager.addEntity(tower);
            activePlayer.addTower(tower);
            
            // Emit tower placed event (SOURCEABLE: business event)
            const event = new TowerPlacedEvent(tower, cell, {
                towerType: towerTypeId,
                cost: 0, // Free tower for testing
                playerId: activePlayer.id,
                cellPosition: { row: cell.row, col: cell.col },
                timestamp: Date.now()
            });
            this.events.emit('towerPlaced', event);
        });
        
        this.debug.success(`Placed ${count} free towers for testing`, {
            totalTowers: activePlayer.towers.length
        });
        
        return selectedCells;
    }
    
    /**
     * Validate tower move (business logic)
     * @param {Tower} tower
     * @param {Cell} fromCell
     * @param {Cell} toCell
     * @returns {boolean} - True if move is allowed
     */
    validateMove(tower, fromCell, toCell) {
        // Validation: can't move to same cell
        if (fromCell === toCell) {
            this.debug.info('Cannot move to same cell');
            return false;
        }
        
        // Validation: can't move to path
        if (toCell.isOnPath) {
            this.debug.warning('Cannot move tower to path cell');
            return false;
        }
        
        // Validation: can't move to occupied cell
        if (toCell.hasTower()) {
            this.debug.warning('Target cell already occupied');
            return false;
        }
        
        // Optional: Apply movement cost (disabled for now)
        // const moveCost = 50;
        // const owner = this.playerManager.players.find(p => p.id === tower.playerId);
        // if (owner && !owner.wallet.has('money', moveCost)) {
        //     this.debug.warning('Insufficient funds to move tower');
        //     return false;
        // }
        // owner.wallet.spend('money', moveCost);
        
        this.debug.success('Tower move validated', {
            from: { row: fromCell.row, col: fromCell.col },
            to: { row: toCell.row, col: toCell.col }
        });
        
        return true;
    }
}
