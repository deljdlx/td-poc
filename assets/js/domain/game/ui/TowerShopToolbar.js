/**
 * TowerShopToolbar - UI component for displaying available towers to buy
 * Purely visual (no business logic)
 *
 * Usage:
 *   const toolbar = new TowerShopToolbar('tower-shop-toolbar', towerTypes);
 *   toolbar.render();
 *   toolbar.setTowers(newTowerTypes); // to update
 *
 * @class TowerShopToolbar
 */
export class TowerShopToolbar {
    /** @type {HTMLElement} */
    container = null;
    /** @type {Array<Object>} */
    towers = [];
    /** @type {string|null} */
    selectedTowerId = null;

    /**
     * @param {string} containerId - DOM id where the toolbar will be rendered
     * @param {Array<Object>} towers - List of tower type objects
     */
    constructor(containerId, towers = []) {
        this.container = document.getElementById(containerId);
        this.towers = towers;
    }

    /**
     * Render the toolbar UI
     * @returns {void}
     */
    render() {
        if (!this.container) return;
        this.container.innerHTML = '';
        const bar = document.createElement('div');
        bar.className = 'tower-shop-toolbar';
        this.towers.forEach(tower => {
            const btn = document.createElement('button');
            btn.className = 'tower-shop-btn';
            btn.dataset.towerId = tower.id;
            btn.innerHTML = `
                <div class="tower-shop-icon">${tower.icon || '🗼'}</div>
                <div class="tower-shop-label">${tower.name}</div>
                <div class="tower-shop-price">${tower.price || '?'} $</div>
            `;
            btn.onclick = () => this.selectTower(tower.id);
            if (this.selectedTowerId === tower.id) {
                btn.classList.add('selected');
            }
            bar.appendChild(btn);
        });
        this.container.appendChild(bar);
    }

    /**
     * Update the list of towers
     * @param {Array<Object>} towers
     */
    setTowers(towers) {
        this.towers = towers;
        this.render();
    }

    /**
     * Select a tower visually
     * @param {string} towerId
     */
    selectTower(towerId) {
        this.selectedTowerId = towerId;
        this.render();
    }
}
