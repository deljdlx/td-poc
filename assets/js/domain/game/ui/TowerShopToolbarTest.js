import { TowerShopToolbar } from '../../game/ui/TowerShopToolbar.js';

export class TowerShopToolbarTest {
    static mountDemo() {
        // Demo data (replace with real towerTypes in Game)
        const towers = [
            { id: 'basic', name: 'Basic', price: 100, icon: '🗼' },
            { id: 'sniper', name: 'Sniper', price: 200, icon: '🎯' },
            { id: 'slow', name: 'Slow', price: 150, icon: '❄️' },
            { id: 'aoe', name: 'AOE', price: 250, icon: '💥' }
        ];
        const toolbar = new TowerShopToolbar('tower-shop-toolbar', towers);
        toolbar.render();
        // Expose for manual testing
        window.towerShopToolbar = toolbar;
    }
}

// Auto-mount for quick test (remove in prod)
window.addEventListener('DOMContentLoaded', () => {
    TowerShopToolbarTest.mountDemo();
});
