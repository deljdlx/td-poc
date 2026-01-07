/**
 * TowerStatsPopup - Displays tower statistics in a popup
 */
export class TowerStatsPopup {
    /**
     * @type {PopupManager}
     */
    popupManager;
    
    /**
     * @type {Debug}
     */
    debug;
    
    /**
     * @param {DIContainer} diContainer
     */
    constructor(diContainer) {
        this.popupManager = diContainer.get('popupManager');
        this.debug = diContainer.createDebug('TowerStatsPopup', true);
    }
    
    /**
     * Show stats for a specific tower
     * @param {Tower} tower
     * @returns {void}
     */
    show(tower) {
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
                        this.debug.info('Tower stats closed');
                    }
                }
            ]
        });
        
        this.debug.success('Tower stats shown', { towerId: tower.id });
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
                            <div class="stat-value">${stats.shotsFired.toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Hits</div>
                            <div class="stat-value stat-success">${stats.hits.toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Accuracy</div>
                            <div class="stat-value ${accuracy >= 70 ? 'stat-success' : accuracy >= 40 ? 'stat-warning' : 'stat-danger'}">${accuracy}%</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Total Damage</div>
                            <div class="stat-value stat-damage">${stats.totalDamage.toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Kills</div>
                            <div class="stat-value stat-success">${stats.kills.toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Critical Hits</div>
                            <div class="stat-value stat-crit">${stats.criticalHits} <span class="stat-subtext">(${critRate}%)</span></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Avg Damage/Hit</div>
                            <div class="stat-value">${avgDamage}</div>
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
                        Location
                    </h3>
                    <div class="stats-info">
                        Position: <strong>Row ${tower.cell.row}, Column ${tower.cell.col}</strong>
                    </div>
                </div>
            </div>
        `;
    }
}
