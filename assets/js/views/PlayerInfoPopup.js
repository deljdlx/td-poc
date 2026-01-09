import { ResourceRegistry } from '../models/gameplay/Resource.js';

/**
 * PlayerInfoPopup - Displays player information and wallet
 */
export class PlayerInfoPopup {
    /**
     * @type {PopupManager}
     */
    popupManager;
    
    /**
     * @type {PlayerManager}
     */
    playerManager;
    
    /**
     * @type {UIUpdateManager}
     */
    uiUpdateManager;
    
    /**
     * @type {Debug}
     */
    debug;
    
    /**
     * @type {Player|null}
     */
    currentPlayer = null;
    
    /**
     * @type {Object}
     */
    resourceElements = {};
    
    /**
     * @param {DIContainer} diContainer
     */
    constructor(diContainer) {
        this.popupManager = diContainer.get('popupManager');
        this.playerManager = diContainer.get('playerManager');
        this.uiUpdateManager = diContainer.get('uiUpdateManager');
        this.debug = diContainer.createDebug('PlayerInfoPopup', true);
    }
    
    /**
     * Show player info popup
     * @returns {void}
     */
    show() {
        this.currentPlayer = this.playerManager.getActivePlayer();
        
        if (!this.currentPlayer) {
            this.debug.warning('No active player to display');
            return;
        }
        
        const content = this.renderPlayerInfo(this.currentPlayer);
        
        this.popupManager.show({
            title: `👤 ${this.currentPlayer.name}`,
            content,
            size: 'medium',
            closable: true,
            customClass: 'player-info-popup',
            popupType: 'player-info',
            buttons: [
                {
                    label: 'Close',
                    class: 'secondary',
                    onClick: () => {
                        this.hide();
                    }
                }
            ],
            onClose: () => {
                this.hide();
            }
        });
        
        // Cache DOM elements for updates
        this.cacheResourceElements();
        
        // Register for live updates
        this.uiUpdateManager.register(this, this.updateInfo);
        
        this.debug.success('Player info shown (live updates enabled)');
    }
    
    /**
     * Hide popup and unregister from updates
     * @returns {void}
     */
    hide() {
        this.uiUpdateManager.unregister(this);
        this.currentPlayer = null;
        this.resourceElements = {};
        this.debug.info('Player info closed');
    }
    
    /**
     * Cache DOM elements for efficient updates
     * @returns {void}
     */
    cacheResourceElements() {
        this.resourceElements = {
            money: document.querySelector('[data-resource="money"]'),
            mana: document.querySelector('[data-resource="mana"]'),
            gems: document.querySelector('[data-resource="gems"]'),
            lives: document.querySelector('[data-stat="lives"]'),
            score: document.querySelector('[data-stat="score"]'),
            towers: document.querySelector('[data-stat="towers"]'),
            kills: document.querySelector('[data-stat="kills"]'),
            waves: document.querySelector('[data-stat="waves"]')
        };
    }
    
    /**
     * Update player info display (called by UIUpdateManager)
     * @param {number} deltaTime
     * @returns {void}
     */
    updateInfo(deltaTime) {
        if (!this.currentPlayer || !this.popupManager.isPopupOpen()) {
            return;
        }
        
        // Update wallet resources
        if (this.resourceElements.money) {
            this.resourceElements.money.textContent = this.currentPlayer.wallet.get('money').toLocaleString();
        }
        if (this.resourceElements.mana) {
            this.resourceElements.mana.textContent = this.currentPlayer.wallet.get('mana');
        }
        if (this.resourceElements.gems) {
            this.resourceElements.gems.textContent = this.currentPlayer.wallet.get('gems');
        }
        
        // Update stats
        if (this.resourceElements.lives) {
            this.resourceElements.lives.textContent = this.currentPlayer.lives;
        }
        if (this.resourceElements.score) {
            this.resourceElements.score.textContent = this.currentPlayer.score.toLocaleString();
        }
        if (this.resourceElements.towers) {
            this.resourceElements.towers.textContent = this.currentPlayer.towers.length;
        }
        if (this.resourceElements.kills) {
            this.resourceElements.kills.textContent = this.currentPlayer.stats.enemiesKilled.toLocaleString();
        }
        if (this.resourceElements.waves) {
            this.resourceElements.waves.textContent = this.currentPlayer.stats.wavesCompleted;
        }
    }
    
    /**
     * Render player information HTML
     * @param {Player} player
     * @returns {string}
     */
    renderPlayerInfo(player) {
        const moneyResource = ResourceRegistry.get('money');
        const manaResource = ResourceRegistry.get('mana');
        const gemsResource = ResourceRegistry.get('gems');
        
        return `
            <div class="player-info">
                <!-- Wallet Section -->
                <div class="stats-section">
                    <h3 class="stats-section-title">
                        <span class="stats-icon">💰</span>
                        Wallet
                    </h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">${moneyResource.getDisplayName()}</div>
                            <div class="stat-value stat-success" data-resource="money">${player.wallet.get('money').toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">${manaResource.getDisplayName()}</div>
                            <div class="stat-value stat-mana" data-resource="mana">${player.wallet.get('mana')}</div>
                            <div class="stat-subtext">Max: ${manaResource.maxCapacity}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">${gemsResource.getDisplayName()}</div>
                            <div class="stat-value stat-gems" data-resource="gems">${player.wallet.get('gems')}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Player Status -->
                <div class="stats-section">
                    <h3 class="stats-section-title">
                        <span class="stats-icon">❤️</span>
                        Status
                    </h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">Lives</div>
                            <div class="stat-value ${player.lives > 10 ? 'stat-success' : player.lives > 5 ? 'stat-warning' : 'stat-danger'}" data-stat="lives">${player.lives}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Score</div>
                            <div class="stat-value" data-stat="score">${player.score.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Statistics -->
                <div class="stats-section">
                    <h3 class="stats-section-title">
                        <span class="stats-icon">📊</span>
                        Statistics
                    </h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">Towers Placed</div>
                            <div class="stat-value" data-stat="towers">${player.towers.length}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Enemies Killed</div>
                            <div class="stat-value stat-success" data-stat="kills">${player.stats.enemiesKilled.toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Total Damage</div>
                            <div class="stat-value stat-damage">${player.stats.totalDamage.toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Waves Completed</div>
                            <div class="stat-value" data-stat="waves">${player.stats.wavesCompleted}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Player Info -->
                <div class="stats-section">
                    <h3 class="stats-section-title">
                        <span class="stats-icon">ℹ️</span>
                        Info
                    </h3>
                    <div class="stats-info">
                        ID: <strong>${player.id}</strong><br>
                        Color: <strong><span style="color: ${player.color}">●</span> ${player.color}</strong>
                    </div>
                </div>
            </div>
        `;
    }
}
