import { Player } from '../entities/Player.js';

/**
 * PlayerManager - Manages players in the game
 * Handles single and multi-player scenarios
 */
export class PlayerManager {
    /**
     * @type {Array<Player>}
     */
    players = [];
    
    /**
     * @type {string|null}
     */
    activePlayerId = null;
    
    /**
     * @type {Debug}
     */
    debug;
    
    /**
     * @param {DIContainer} diContainer
     */
    constructor(diContainer) {
        this.debug = diContainer.createDebug('PlayerManager', true);
        this.debug.success('PlayerManager initialized');
    }
    
    /**
     * Create a new player
     * @param {string} id - Unique player ID
     * @param {string} name - Player name
     * @param {string} [color='#6366f1'] - Player color
     * @returns {Player}
     */
    createPlayer(id, name, color = '#6366f1') {
        const player = new Player(id, name, color, this.debug);
        this.players.push(player);
        
        // First player created becomes active
        if (this.players.length === 1) {
            this.activePlayerId = player.id;
        }
        
        this.debug.success('Player created', { 
            id: player.id, 
            name: player.name,
            money: player.wallet.get('money'),
            isActive: this.activePlayerId === player.id
        });
        
        return player;
    }
    
    /**
     * Get player by ID
     * @param {string} playerId
     * @returns {Player|null}
     */
    getPlayerById(playerId) {
        return this.players.find(p => p.id === playerId) || null;
    }
    
    /**
     * Get the currently active player
     * @returns {Player|null}
     */
    getActivePlayer() {
        if (!this.activePlayerId) {
            return null;
        }
        return this.getPlayerById(this.activePlayerId);
    }
    
    /**
     * Set the active player
     * @param {string} playerId
     * @returns {boolean} - True if player exists and was set as active
     */
    setActivePlayer(playerId) {
        const player = this.getPlayerById(playerId);
        if (!player) {
            this.debug.warning('Cannot set active player - player not found', { playerId });
            return false;
        }
        
        this.activePlayerId = playerId;
        this.debug.info('Active player changed', { 
            playerId: player.id, 
            name: player.name 
        });
        return true;
    }
    
    /**
     * Get all players
     * @returns {Array<Player>}
     */
    getAllPlayers() {
        return this.players;
    }
    
    /**
     * Get count of players
     * @returns {number}
     */
    getPlayerCount() {
        return this.players.length;
    }
    
    /**
     * Check if a player owns a tower
     * @param {string} playerId
     * @param {Tower} tower
     * @returns {boolean}
     */
    playerOwnsTower(playerId, tower) {
        const player = this.getPlayerById(playerId);
        return player ? player.ownsTower(tower) : false;
    }
    
    /**
     * Remove all players (reset)
     * @returns {void}
     */
    reset() {
        this.players = [];
        this.activePlayerId = null;
        this.debug.info('All players cleared');
    }
}
