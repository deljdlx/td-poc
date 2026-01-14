import { Debug } from '../services/core/Debug.js';

/**
 * DebugPanel - UI controller for debug panel
 * Manages log level selection and debug info display
 */
export class DebugPanel {
    /**
     * @type {DIContainer}
     */
    container;
    
    /**
     * @type {HTMLElement}
     */
    panel;
    
    /**
     * @type {boolean}
     */
    isCollapsed = false;
    
    /**
     * @param {DIContainer} container
     */
    constructor(container) {
        this.container = container;
        this.panel = document.getElementById('debug-panel');
        
        if (!this.panel) {
            console.warn('Debug panel element not found');
            return;
        }
        
        this.bindEvents();
    }
    
    /**
     * Bind UI events
     * @returns {void}
     */
    bindEvents() {
        // Toggle collapse/expand
        const toggleBtn = document.getElementById('debug-panel-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
        
        // Log level selector
        const logLevelSelect = document.getElementById('debug-log-level');
        if (logLevelSelect) {
            logLevelSelect.addEventListener('change', (e) => {
                const level = parseInt(e.target.value);
                Debug.setGlobalLevel(level);
                console.log(`Debug level set to: ${this.getLevelName(level)}`);
            });
        }
        
        // Clear console button
        const clearBtn = document.getElementById('debug-clear-console');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                console.clear();
                console.log('🧹 Console cleared');
            });
        }
    }
    
    /**
     * Toggle panel collapse state
     * @returns {void}
     */
    toggle() {
        this.isCollapsed = !this.isCollapsed;
        const toggleBtn = document.getElementById('debug-panel-toggle');
        
        if (this.isCollapsed) {
            this.panel.classList.add('collapsed');
            if (toggleBtn) toggleBtn.textContent = '+';
        } else {
            this.panel.classList.remove('collapsed');
            if (toggleBtn) toggleBtn.textContent = '−';
        }
    }
    
    /**
     * Update debug info (FPS, entity count, etc.)
     * Call this from the render loop
     * @param {Object} info - Debug information
     * @param {number} info.fps - Current FPS
     * @param {number} info.entityCount - Number of entities
     * @returns {void}
     */
    update(info) {
        const fpsElement = document.getElementById('debug-fps');
        const entitiesElement = document.getElementById('debug-entities');
        
        if (fpsElement && info.fps !== undefined) {
            fpsElement.textContent = Math.round(info.fps);
        }
        
        if (entitiesElement && info.entityCount !== undefined) {
            entitiesElement.textContent = info.entityCount;
        }
    }
    
    /**
     * Get level name from number
     * @param {number} level
     * @returns {string}
     * @private
     */
    getLevelName(level) {
        const names = ['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'];
        return names[level] || 'UNKNOWN';
    }
}
