/**
 * UIUpdateManager - Manages UI components that need periodic updates
 * Synchronized with GameClock for consistent update timing
 */
export class UIUpdateManager {
    /**
     * @type {Set<Object>}
     */
    updateables = new Set();
    
    /**
     * @type {Debug}
     */
    debug;
    
    /**
     * @param {DIContainer} diContainer
     */
    constructor(diContainer) {
        this.debug = diContainer.createDebug('UIUpdateManager', true);
        this.debug.success('UIUpdateManager initialized');
    }
    
    /**
     * Register a UI component for updates
     * @param {Object} component - Component instance
     * @param {Function} updateFn - Update function to call: (deltaTime) => void
     * @returns {void}
     */
    register(component, updateFn) {
        const entry = { component, updateFn };
        this.updateables.add(entry);
        this.debug.info('Component registered for updates', { 
            component: component.constructor.name,
            total: this.updateables.size 
        });
    }
    
    /**
     * Unregister a UI component
     * @param {Object} component - Component instance to unregister
     * @returns {void}
     */
    unregister(component) {
        let removed = false;
        this.updateables.forEach(entry => {
            if (entry.component === component) {
                this.updateables.delete(entry);
                removed = true;
            }
        });
        
        if (removed) {
            this.debug.info('Component unregistered', { 
                component: component.constructor.name,
                remaining: this.updateables.size 
            });
        }
    }
    
    /**
     * Update all registered components
     * Called by GameClock on each tick
     * @param {number} deltaTime - Time elapsed since last update (seconds)
     * @returns {void}
     */
    update(deltaTime) {
        if (this.updateables.size === 0) {
            return;
        }
        
        this.updateables.forEach(({ component, updateFn }) => {
            try {
                updateFn.call(component, deltaTime);
            } catch (error) {
                this.debug.error('Error updating component', { 
                    component: component.constructor.name,
                    error: error.message 
                });
            }
        });
    }
    
    /**
     * Clear all registered components
     * @returns {void}
     */
    clear() {
        const count = this.updateables.size;
        this.updateables.clear();
        this.debug.info('All components cleared', { count });
    }
    
    /**
     * Get count of registered components
     * @returns {number}
     */
    getCount() {
        return this.updateables.size;
    }
}
