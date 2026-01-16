/**
 * EventBus - Centralized event management system
 * Provides event handling capabilities to any entity
 * Eliminates code duplication of on/off/emit methods
 */
export class EventBus {
    /**
     * @type {Map<Object, Map<string, Set<Function>>>}
     */
    static handlers = new Map();
    
    /**
     * @type {Map<string, Set<Function>>}
     */
    static globalListeners = new Map();
    
    /**
     * @type {Array<{event: Event, callbacks: Set<Function>}>}
     */
    static eventQueue = [];
    
    /**
     * @type {Array<{eventName: string, timestamp: number, data: Object}>}
     */
    static sourceableEvents = [];
    
    /**
     * Create event handler for an entity
     * @param {Object} entity - Entity that will emit/listen to events
     * @returns {Object} - Event handler with on/off/emit methods
     */
    static createHandler(entity) {
        if (!EventBus.handlers.has(entity)) {
            EventBus.handlers.set(entity, new Map());
        }
        
        return {
            /**
             * Add event listener
             * @param {string} eventName
             * @param {Function} callback
             */
            on(eventName, callback) {
                const entityListeners = EventBus.handlers.get(entity);
                if (!entityListeners.has(eventName)) {
                    entityListeners.set(eventName, new Set());
                }
                entityListeners.get(eventName).add(callback);
            },
            
            /**
             * Remove event listener
             * @param {string} eventName
             * @param {Function} callback
             */
            off(eventName, callback) {
                const entityListeners = EventBus.handlers.get(entity);
                if (entityListeners.has(eventName)) {
                    entityListeners.get(eventName).delete(callback);
                }
            },
            
            /**
             * Emit event
             * @param {string} eventName
             * @param {*} data - Event data
             */
            emit(eventName, data) {
                // TRUSTED PATH: Capture sourceable events (Event Sourcing)
                if (data && data.sourceable === true) {
                    EventBus.sourceableEvents.push({
                        eventName,
                        timestamp: Date.now(),
                        data
                    });
                }
                
                // Trigger local listeners (immediate)
                const entityListeners = EventBus.handlers.get(entity);
                if (entityListeners.has(eventName)) {
                    entityListeners.get(eventName).forEach(callback => {
                        callback(data);
                    });
                }
                
                // Trigger global listeners (immediate for now, can be queued later)
                if (EventBus.globalListeners.has(eventName)) {
                    EventBus.globalListeners.get(eventName).forEach(callback => {
                        callback(data);
                    });
                }
            }
        };
    }
    
    /**
     * Add global event listener (listens to all entities)
     * @param {string} eventName
     * @param {Function} callback
     */
    static onGlobal(eventName, callback) {
        if (!EventBus.globalListeners.has(eventName)) {
            EventBus.globalListeners.set(eventName, new Set());
        }
        EventBus.globalListeners.get(eventName).add(callback);
    }
    
    /**
     * Remove global event listener
     * @param {string} eventName
     * @param {Function} callback
     */
    static offGlobal(eventName, callback) {
        if (EventBus.globalListeners.has(eventName)) {
            EventBus.globalListeners.get(eventName).delete(callback);
        }
    }
    
    /**
     * Clear all listeners for an entity (cleanup on destroy)
     * @param {Object} entity
     */
    static clearEntity(entity) {
        EventBus.handlers.delete(entity);
    }
    
    /**
     * Clear all global listeners
     */
    static clearGlobal() {
        EventBus.globalListeners.clear();
    }
    
    /**
     * Emit a global event (without entity source)
     * @param {string} eventName
     * @param {*} data - Event data
     */
    static emitGlobal(eventName, data) {
        // Capture sourceable events for debugging/event sourcing
        if (data && data.sourceable === true) {
            EventBus.sourceableEvents.push({
                eventName,
                timestamp: Date.now(),
                data
            });
        }
        
        if (EventBus.globalListeners.has(eventName)) {
            EventBus.globalListeners.get(eventName).forEach(callback => {
                callback(data);
            });
        }
    }
    
    /**
     * Get statistics for debugging
     * @returns {Object}
     */
    static getStats() {
        return {
            entities: EventBus.handlers.size,
            globalListeners: Array.from(EventBus.globalListeners.entries()).map(([event, callbacks]) => ({
                event,
                count: callbacks.size
            }))
        };
    }
    
    /**
     * Get all sourceable events (for Event Sourcing)
     * @returns {Array<{eventName: string, timestamp: number, data: Object}>}
     */
    static getSourceableEvents() {
        return EventBus.sourceableEvents;
    }
    
    /**
     * Clear sourceable events history
     * @returns {void}
     */
    static clearSourceableEvents() {
        EventBus.sourceableEvents = [];
    }
}
