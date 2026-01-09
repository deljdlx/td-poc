/**
 * TowerStatsPopup - Displays tower statistics in a popup
 */
export class TowerStatsPopup {
    /**
     * @type {PopupManager}
     */
    popupManager;
    
    /**
     * @type {UIUpdateManager}
     */
    uiUpdateManager;
    
    /**
     * @type {Debug}
     */
    debug;
    
    /**
     * @type {Tower|null}
     */
    currentTower = null;
    
    /**
     * @type {Object}
     */
    statElements = {};
    
    /**
     * @param {DIContainer} diContainer
     */
    constructor(diContainer) {
        this.popupManager = diContainer.get('popupManager');
        this.uiUpdateManager = diContainer.get('uiUpdateManager');
        this.debug = diContainer.createDebug('TowerStatsPopup', true);
    }
    
    /**
     * Show stats for a specific tower
     * @param {Tower} tower
     * @returns {void}
     */
    show(tower) {
        this.currentTower = tower;
        const content = this.renderStats(tower);
        
        this.popupManager.show({
            title: '🗼 Tower Statistics',
            content,
            size: 'medium',
            closable: true,
            customClass: 'tower-stats-popup',
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
        this.cacheStatElements();
        
        // Register for live updates
        this.uiUpdateManager.register(this, this.updateStats);
        
        this.debug.success('Tower stats shown (live updates enabled)', { towerId: tower.id });
    }
    
    /**
     * Hide popup and unregister from updates
     * @returns {void}
     */
    hide() {
        this.uiUpdateManager.unregister(this);
        this.currentTower = null;
        this.statElements = {};
        this.debug.info('Tower stats closed');
    }
    
    /**
     * Cache DOM elements for efficient updates
     * @returns {void}
     */
    cacheStatElements() {
        this.statElements = {
            shotsFired: document.querySelector('[data-stat="shotsFired"]'),
            hits: document.querySelector('[data-stat="hits"]'),
            accuracy: document.querySelector('[data-stat="accuracy"]'),
            totalDamage: document.querySelector('[data-stat="totalDamage"]'),
            kills: document.querySelector('[data-stat="kills"]'),
            criticalHits: document.querySelector('[data-stat="criticalHits"]'),
            critRate: document.querySelector('[data-stat="critRate"]'),
            avgDamage: document.querySelector('[data-stat="avgDamage"]')
        };
    }
    
    /**
     * Update stats display (called by UIUpdateManager)
     * @param {number} deltaTime
     * @returns {void}
     */
    updateStats(deltaTime) {
        if (!this.currentTower || !this.popupManager.isPopupOpen()) {
            return;
        }
        
        const stats = this.currentTower.stats;
        const accuracy = stats.shotsFired > 0 ? ((stats.hits / stats.shotsFired) * 100).toFixed(1) : 0;
        const critRate = stats.hits > 0 ? ((stats.criticalHits / stats.hits) * 100).toFixed(1) : 0;
        const avgDamage = stats.hits > 0 ? (stats.totalDamage / stats.hits).toFixed(1) : 0;
        
        // Update only changed values
        if (this.statElements.shotsFired) {
            this.statElements.shotsFired.textContent = stats.shotsFired.toLocaleString();
        }
        if (this.statElements.hits) {
            this.statElements.hits.textContent = stats.hits.toLocaleString();
        }
        if (this.statElements.accuracy) {
            this.statElements.accuracy.textContent = accuracy + '%';
            // Update color class based on accuracy
            this.statElements.accuracy.className = 'stat-value ' + 
                (accuracy >= 70 ? 'stat-success' : accuracy >= 40 ? 'stat-warning' : 'stat-danger');
        }
        if (this.statElements.totalDamage) {
            this.statElements.totalDamage.textContent = stats.totalDamage.toLocaleString();
        }
        if (this.statElements.kills) {
            this.statElements.kills.textContent = stats.kills.toLocaleString();
        }
        if (this.statElements.criticalHits) {
            this.statElements.criticalHits.textContent = stats.criticalHits;
        }
        if (this.statElements.critRate) {
            this.statElements.critRate.textContent = '(' + critRate + '%)';
        }
        if (this.statElements.avgDamage) {
            this.statElements.avgDamage.textContent = avgDamage;
        }
    }
    
    /**
     * Render tower statistics HTML
     * @param {Tower} tower
     * @returns {string}
     */
    renderStats(tower) {
        const stats = tower.stats;
        const accuracy = stats.shotsFired > 0 ? ((stats.hits / stats.shotsFired) * 100).toFixed(1) : 0;
        const critRate = stats.hits > 0 ? ((stats.criticalHits / stats.hits) * 100).toFixed(1) : 0;
        const avgDamage = stats.hits > 0 ? (stats.totalDamage / stats.hits).toFixed(1) : 0;
        
        return `
            <div class="tower-stats">
                <!-- Combat Stats -->
                <div class="stats-section">
                    <h3 class="stats-section-title">
                        <span class="stats-icon">⚔️</span>
                        Combat Stats
                    </h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">Shots Fired</div>
                            <div class="stat-value" data-stat="shotsFired">${stats.shotsFired.toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Hits</div>
                            <div class="stat-value stat-success" data-stat="hits">${stats.hits.toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Accuracy</div>
                            <div class="stat-value ${accuracy >= 70 ? 'stat-success' : accuracy >= 40 ? 'stat-warning' : 'stat-danger'}" data-stat="accuracy">${accuracy}%</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Total Damage</div>
                            <div class="stat-value stat-damage" data-stat="totalDamage">${stats.totalDamage.toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Kills</div>
                            <div class="stat-value stat-success" data-stat="kills">${stats.kills.toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Critical Hits</div>
                            <div class="stat-value stat-crit"><span data-stat="criticalHits">${stats.criticalHits}</span> <span class="stat-subtext" data-stat="critRate">(${critRate}%)</span></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Avg Damage/Hit</div>
                            <div class="stat-value" data-stat="avgDamage">${avgDamage}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Configuration -->
                <div class="stats-section">
                    <h3 class="stats-section-title">
                        <span class="stats-icon">⚙️</span>
                        Configuration
                    </h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">Range</div>
                            <div class="stat-value">${tower.range} <span class="stat-unit">cells</span></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Fire Rate</div>
                            <div class="stat-value">${(1 / tower.cooldown).toFixed(2)} <span class="stat-unit">/sec</span></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Damage</div>
                            <div class="stat-value stat-damage">${tower.damage || 25}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Crit Chance</div>
                            <div class="stat-value">${(tower.critChance || 0) * 100}%</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Crit Multiplier</div>
                            <div class="stat-value">×${tower.critMultiplier || 1.5}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Location -->
                <div class="stats-section">
                    <h3 class="stats-section-title">
                        <span class="stats-icon">📍</span>
                        Info
                    </h3>
                    <div class="stats-info">
                        Owner: <strong>${tower.playerId}</strong><br>
                        Position: <strong>Row ${tower.cell.row}, Column ${tower.cell.col}</strong>
                    </div>
                </div>
            </div>
        `;
    }
}
