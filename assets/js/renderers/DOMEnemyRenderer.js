/**
 * DOMEnemyRenderer - Renders enemies as DOM elements
 */
export class DOMEnemyRenderer {
    /** @type {HTMLElement} */
    container = null;
    
    /** @type {Debug} */
    debug = null;
    
    /** @type {Map<number, HTMLElement>} */
    enemyElements = new Map();
    
    /**
     * @param {DIContainer} diContainer
     */
    constructor(diContainer) {
        this.debug = diContainer.createDebug('DOMEnemyRenderer', true);
        this.container = document.getElementById('enemy-layer');
        
        if (!this.container) {
            this.debug.error('enemy-layer element not found!');
        }
    }
    
    /**
     * Render/update an enemy
     * @param {Enemy} enemy
     * @returns {void}
     */
    render(enemy) {
        if (!this.container) {
            return;
        }
        
        let element = this.enemyElements.get(enemy.id);
        
        // Create element if doesn't exist
        if (!element) {
            element = this.createElement(enemy);
            this.enemyElements.set(enemy.id, element);
            this.container.appendChild(element);
            enemy.domElement = element;
            
            // Setup hit animation listener
            this.setupHitListener(enemy, element);
        }
        
        // Update position
        element.style.left = `${enemy.x}px`;
        element.style.top = `${enemy.y}px`;
        
        // Update health bar
        this.updateHealthBar(element, enemy);
    }
    
    /**
     * Setup hit animation listener
     * @param {Enemy} enemy
     * @param {HTMLElement} element
     * @returns {void}
     * @private
     */
    setupHitListener(enemy, element) {
        enemy.on('hit', (data) => {
            this.debug.info(`Enemy ${enemy.id} hit animation triggered`);
            
            // Remove old hit class if exists (in case of multiple hits)
            element.classList.remove('hit');
            
            // Force reflow to restart animation
            void element.offsetWidth;
            
            // Add hit class
            element.classList.add('hit');
            
            // Remove class after animation
            setTimeout(() => {
                element.classList.remove('hit');
                this.debug.debug(`Enemy ${enemy.id} hit animation completed`);
            }, 300);
        });
        
        this.debug.info(`Hit listener setup for enemy ${enemy.id}`);
    }
    
    /**
     * Create DOM element for enemy
     * @param {Enemy} enemy
     * @returns {HTMLElement}
     * @private
     */
    createElement(enemy) {
        const div = document.createElement('div');
        div.className = `enemy ${enemy.enemyType || 'basic'}`;
        div.dataset.enemyId = enemy.id;
        
        // Create health bar
        const healthBar = document.createElement('div');
        healthBar.className = 'enemy-health-bar';
        
        const healthFill = document.createElement('div');
        healthFill.className = 'enemy-health-fill';
        healthBar.appendChild(healthFill);
        
        div.appendChild(healthBar);
        
        return div;
    }
    
    /**
     * Update enemy health bar
     * @param {HTMLElement} element
     * @param {Enemy} enemy
     * @private
     */
    updateHealthBar(element, enemy) {
        const healthFill = element.querySelector('.enemy-health-fill');
        if (healthFill) {
            const healthPercent = (enemy.health / enemy.maxHealth) * 100;
            healthFill.style.width = `${healthPercent}%`;
        }
    }
    
    /**
     * Remove enemy element
     * @param {Enemy} enemy
     * @returns {void}
     */
    remove(enemy) {
        const element = this.enemyElements.get(enemy.id);
        
        if (element) {
            element.remove();
            this.enemyElements.delete(enemy.id);
        }
    }
    
    /**
     * Clear all enemies
     * @returns {void}
     */
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
            this.enemyElements.clear();
        }
    }
}
