import { Debug } from '../services/core/Debug.js';
import { EventBus } from '../services/core/EventBus.js';

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
    isDragging = false;
    
    /**
     * @type {{x: number, y: number}}
     */
    dragOffset = { x: 0, y: 0 };
    
    /**
     * @type {Function|null}
     */
    boundOnMouseMove = null;
    
    /**
     * @type {Function|null}
     */
    boundOnMouseUp = null;
    
    /**
     * @type {Function|null}
     */
    boundOnTouchMove = null;
    
    /**
     * @type {Function|null}
     */
    boundOnTouchEnd = null;
    
    /**
     * @type {GameClock|null}
     */
    gameClock = null;
    
    /**
     * @param {DIContainer} container
     */
    constructor(container) {
        this.container = container;
        this.panel = null;
        
        this.render();
        this.bindEvents();
        this.initDraggable();
        this.initToggleButton();
        this.initTabs();
        this.loadPreferences();
        this.populateContextList();
    }
    
    /**
     * Set the game clock for time scale controls
     * @param {GameClock} gameClock
     * @returns {void}
     */
    setGameClock(gameClock) {
        this.gameClock = gameClock;
        this.bindTimeScaleControls();
    }
    
    /**
     * Render the debug panel and inject it into the DOM
     * @returns {void}
     */
    render() {
        this.panel = this.createPanelElement();
        document.body.appendChild(this.panel);
    }
    
    /**
     * Create the debug panel DOM element
     * @returns {HTMLElement}
     */
    createPanelElement() {
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.className = 'debug-panel';
        panel.style.display = 'none';
        panel.innerHTML = this.getTemplate();
        return panel;
    }
    
    /**
     * Get the HTML template for the debug panel
     * @returns {string}
     */
    getTemplate() {
        return `
            <div class="debug-panel-header">
                <span class="debug-panel-title">🔍 Debug</span>
                <button id="debug-panel-close" class="debug-panel-close">×</button>
            </div>
            
            <!-- Tabs -->
            <div class="debug-panel-tabs">
                <button class="debug-tab active" data-tab="logs">📋 Logs</button>
                <button class="debug-tab" data-tab="towers">🗼 Towers</button>
                <button class="debug-tab" data-tab="events">📡 Events</button>
                <button class="debug-tab" data-tab="tests">🧪 Tests</button>
                <button class="debug-tab" data-tab="actions">⚡ Actions</button>
            </div>
            
            <!-- Tab Content -->
            <div class="debug-tab-content">
                <!-- Logs Tab -->
                <div id="tab-logs" class="debug-tab-panel active">
                    <div class="debug-section">
                        <div class="debug-section-title">Log Level</div>
                        <select id="debug-log-level" class="debug-select">
                            <option value="0">ALL</option>
                            <option value="1" selected>DEBUG</option>
                            <option value="2">INFO</option>
                            <option value="3">WARN</option>
                            <option value="4">ERROR</option>
                            <option value="5">NONE</option>
                        </select>
                    </div>
                    <div class="debug-section">
                        <div class="debug-section-title">Quick Actions</div>
                        <button id="debug-clear-console" class="debug-button">Clear Console</button>
                    </div>
                    <div class="debug-section">
                        <div class="debug-section-title">
                            Context Filters
                            <div class="debug-context-actions">
                                <button id="debug-select-all" class="debug-mini-button">All</button>
                                <button id="debug-clear-all" class="debug-mini-button">None</button>
                            </div>
                        </div>
                        <div id="debug-context-list" class="debug-context-list">
                            <!-- Populated by JavaScript -->
                        </div>
                    </div>
                    <div class="debug-section">
                        <div class="debug-section-title">Info</div>
                        <div class="debug-info">
                            <div class="debug-info-item">
                                <span class="debug-info-label">FPS:</span>
                                <span class="debug-info-value" id="debug-fps">--</span>
                            </div>
                            <div class="debug-info-item">
                                <span class="debug-info-label">Entities:</span>
                                <span class="debug-info-value" id="debug-entities">--</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Towers Tab -->
                <div id="tab-towers" class="debug-tab-panel">
                    <div class="debug-section">
                        <div class="debug-section-title">Active Towers</div>
                        <div id="debug-towers-list" class="debug-towers-list">
                            <div style="color: #999; font-size: 11px; padding: 10px; text-align: center;">–</div>
                        </div>
                    </div>
                </div>
                
                <!-- Events Tab -->
                <div id="tab-events" class="debug-tab-panel">
                    <div class="debug-section">
                        <div class="debug-section-title">
                            Sourceable Events
                            <button id="debug-clear-events" class="debug-mini-button" style="margin-left: 8px;">Clear</button>
                        </div>
                        <div id="debug-events-list" class="debug-events-list" style="max-height: 400px; overflow-y: auto;">
                            <div style="color: #999; font-size: 11px; padding: 10px; text-align: center;">No events yet</div>
                        </div>
                    </div>
                </div>
                
                <!-- Tests Tab -->
                <div id="tab-tests" class="debug-tab-panel">
                    <div class="debug-section">
                        <div class="debug-section-title">Unit Tests</div>
                        <p style="color: #999; font-size: 11px;">Coming soon...</p>
                    </div>
                </div>
                
                <!-- Actions Tab -->
                <div id="tab-actions" class="debug-tab-panel">
                    <div class="debug-section">
                        <div class="debug-section-title">Game Speed</div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <label for="debug-time-scale" style="flex-shrink: 0;">Speed:</label>
                            <input type="range" id="debug-time-scale" min="0" max="1000" value="100" step="25" style="flex: 1;">
                            <span id="debug-time-scale-value" style="min-width: 60px; text-align: right;">100%</span>
                        </div>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                            <button class="debug-mini-button" data-speed="0">⏸ 0%</button>
                            <button class="debug-mini-button" data-speed="50">50%</button>
                            <button class="debug-mini-button" data-speed="100">100%</button>
                            <button class="debug-mini-button" data-speed="200">200%</button>
                            <button class="debug-mini-button" data-speed="500">500%</button>
                            <button class="debug-mini-button" data-speed="1000">⚡ 1000%</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Bind UI events
     * @returns {void}
     */
    bindEvents() {
        // Close button
        const closeBtn = document.getElementById('debug-panel-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
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
        
        // Select all contexts
        const selectAllBtn = document.getElementById('debug-select-all');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllContexts());
        }
        
        // Clear all contexts
        const clearAllBtn = document.getElementById('debug-clear-all');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllContexts());
        }
        
        // Clear events button
        const clearEventsBtn = document.getElementById('debug-clear-events');
        if (clearEventsBtn) {
            clearEventsBtn.addEventListener('click', () => {
                EventBus.clearSourceableEvents();
                this.refreshEventsTab();
            });
        }
        
        // Time scale controls will be bound when setGameClock() is called
    }
    
    /**
     * Bind time scale controls
     * @returns {void}
     */
    bindTimeScaleControls() {
        if (!this.gameClock) {
            console.warn('DebugPanel: gameClock not set, time scale controls disabled');
            return;
        }
        
        const gameClock = this.gameClock;
        
        // Slider
        const slider = document.getElementById('debug-time-scale');
        const valueDisplay = document.getElementById('debug-time-scale-value');
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', (e) => {
                const percentage = parseInt(e.target.value);
                const scale = percentage / 100;
                gameClock.setTimeScale(scale);
                valueDisplay.textContent = `${percentage}%`;
            });
        }
        
        // Quick buttons
        const speedButtons = document.querySelectorAll('[data-speed]');
        speedButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const percentage = parseInt(btn.dataset.speed);
                const scale = percentage / 100;
                gameClock.setTimeScale(scale);
                if (slider) slider.value = percentage;
                if (valueDisplay) valueDisplay.textContent = `${percentage}%`;
            });
        });
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
        
        // Auto-refresh events tab if visible
        const eventsPanel = document.getElementById('tab-events');
        if (eventsPanel && eventsPanel.classList.contains('active')) {
            this.refreshEventsTab();
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
    
    /**
     * Initialize toggle button in footer
     * @returns {void}
     */
    initToggleButton() {
        const toggleBtn = document.getElementById('debug-panel-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleVisibility();
            });
        }
    }
    
    /**
     * Initialize tabs system
     * @returns {void}
     */
    initTabs() {
        const tabs = this.panel.querySelectorAll('.debug-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                this.switchTab(targetTab);
            });
        });
    }
    
    /**
     * Switch to a specific tab
     * @param {string} tabName
     * @returns {void}
     */
    switchTab(tabName) {
        // Remove active from all tabs
        const tabs = this.panel.querySelectorAll('.debug-tab');
        tabs.forEach(t => t.classList.remove('active'));
        
        // Remove active from all panels
        const panels = this.panel.querySelectorAll('.debug-tab-panel');
        panels.forEach(p => p.classList.remove('active'));
        
        // Add active to clicked tab
        const activeTab = this.panel.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Add active to corresponding panel
        const activePanel = this.panel.querySelector(`#tab-${tabName}`);
        if (activePanel) {
            activePanel.classList.add('active');
        }
    }
    
    /**
     * Toggle panel visibility
     * @returns {void}
     */
    toggleVisibility() {
        if (this.panel.style.display === 'none') {
            this.panel.style.display = 'block';
        } else {
            this.panel.style.display = 'none';
        }
    }
    
    /**
     * Show panel
     * @returns {void}
     */
    show() {
        this.panel.style.display = 'block';
    }
    
    /**
     * Hide panel
     * @returns {void}
     */
    hide() {
        this.panel.style.display = 'none';
    }
    
    /**
     * Initialize draggable functionality
     * @returns {void}
     */
    initDraggable() {
        const header = this.panel.querySelector('.debug-panel-header');
        if (!header) return;
        
        header.style.cursor = 'move';
        
        // Mouse events
        header.addEventListener('mousedown', (e) => {
            // Don't drag when clicking on buttons
            if (e.target.tagName === 'BUTTON') return;
            
            this.startDrag(e.clientX, e.clientY);
            
            // Add event listeners to document
            this.boundOnMouseMove = this.onMouseMove.bind(this);
            this.boundOnMouseUp = this.onMouseUp.bind(this);
            document.addEventListener('mousemove', this.boundOnMouseMove);
            document.addEventListener('mouseup', this.boundOnMouseUp);
            
            e.preventDefault();
        });
        
        // Touch events
        header.addEventListener('touchstart', (e) => {
            // Don't drag when touching buttons
            if (e.target.tagName === 'BUTTON') return;
            
            const touch = e.touches[0];
            this.startDrag(touch.clientX, touch.clientY);
            
            // Add event listeners to document
            this.boundOnTouchMove = this.onTouchMove.bind(this);
            this.boundOnTouchEnd = this.onTouchEnd.bind(this);
            document.addEventListener('touchmove', this.boundOnTouchMove);
            document.addEventListener('touchend', this.boundOnTouchEnd);
            
            e.preventDefault();
        });
    }
    
    /**
     * Start dragging
     * @param {number} clientX
     * @param {number} clientY
     * @returns {void}
     */
    startDrag(clientX, clientY) {
        this.isDragging = true;
        const rect = this.panel.getBoundingClientRect();
        this.dragOffset.x = clientX - rect.left;
        this.dragOffset.y = clientY - rect.top;
    }
    
    /**
     * Move panel to position
     * @param {number} clientX
     * @param {number} clientY
     * @returns {void}
     */
    movePanel(clientX, clientY) {
        if (!this.isDragging) return;
        
        const x = clientX - this.dragOffset.x;
        const y = clientY - this.dragOffset.y;
        
        // Keep panel within viewport bounds
        const maxX = window.innerWidth - this.panel.offsetWidth;
        const maxY = window.innerHeight - this.panel.offsetHeight;
        
        const boundedX = Math.max(0, Math.min(x, maxX));
        const boundedY = Math.max(0, Math.min(y, maxY));
        
        this.panel.style.left = boundedX + 'px';
        this.panel.style.top = boundedY + 'px';
        this.panel.style.right = 'auto'; // Remove right positioning
    }
    
    /**
     * Handle mouse move during drag
     * @param {MouseEvent} e
     * @returns {void}
     */
    onMouseMove(e) {
        this.movePanel(e.clientX, e.clientY);
    }
    
    /**
     * Handle touch move during drag
     * @param {TouchEvent} e
     * @returns {void}
     */
    onTouchMove(e) {
        const touch = e.touches[0];
        this.movePanel(touch.clientX, touch.clientY);
        e.preventDefault();
    }
    
    /**
     * Handle mouse up to end drag
     * @returns {void}
     */
    onMouseUp() {
        this.isDragging = false;
        
        // Remove event listeners
        if (this.boundOnMouseMove) {
            document.removeEventListener('mousemove', this.boundOnMouseMove);
            this.boundOnMouseMove = null;
        }
        if (this.boundOnMouseUp) {
            document.removeEventListener('mouseup', this.boundOnMouseUp);
            this.boundOnMouseUp = null;
        }
    }
    
    /**
     * Handle touch end to end drag
     * @returns {void}
     */
    onTouchEnd() {
        this.isDragging = false;
        
        // Remove event listeners
        if (this.boundOnTouchMove) {
            document.removeEventListener('touchmove', this.boundOnTouchMove);
            this.boundOnTouchMove = null;
        }
        if (this.boundOnTouchEnd) {
            document.removeEventListener('touchend', this.boundOnTouchEnd);
            this.boundOnTouchEnd = null;
        }
    }
    
    /**
     * Populate context list with checkboxes
     * @returns {void}
     */
    populateContextList() {
        const contextList = document.getElementById('debug-context-list');
        if (!contextList) return;
        
        const contexts = Debug.getRegisteredContexts();
        contextList.innerHTML = '';
        
        contexts.forEach(context => {
            const item = document.createElement('label');
            item.className = 'debug-context-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'debug-context-checkbox';
            checkbox.value = context;
            checkbox.checked = Debug.isContextEnabled(context);
            checkbox.addEventListener('change', (e) => this.onContextToggle(context, e.target.checked));
            
            const label = document.createElement('span');
            label.textContent = context;
            
            item.appendChild(checkbox);
            item.appendChild(label);
            contextList.appendChild(item);
        });
    }
    
    /**
     * Handle context toggle
     * @param {string} context
     * @param {boolean} enabled
     * @returns {void}
     */
    onContextToggle(context, enabled) {
        if (enabled) {
            Debug.enableContext(context);
        } else {
            Debug.disableContext(context);
        }
        this.savePreferences();
    }
    
    /**
     * Select all contexts
     * @returns {void}
     */
    selectAllContexts() {
        Debug.enableAllContexts();
        this.populateContextList();
        this.savePreferences();
    }
    
    /**
     * Clear all contexts
     * @returns {void}
     */
    clearAllContexts() {
        Debug.disableAllContexts();
        this.populateContextList();
        this.savePreferences();
    }
    
    /**
     * Save preferences to localStorage
     * @returns {void}
     */
    savePreferences() {
        const preferences = {
            filterMode: Debug.filterMode,
            enabledContexts: Array.from(Debug.enabledContexts),
            logLevel: Debug.globalLevel
        };
        localStorage.setItem('debug-preferences', JSON.stringify(preferences));
    }
    
    /**
     * Load preferences from localStorage
     * @returns {void}
     */
    loadPreferences() {
        const stored = localStorage.getItem('debug-preferences');
        if (!stored) return;
        
        try {
            const preferences = JSON.parse(stored);
            Debug.filterMode = preferences.filterMode || 'all';
            Debug.enabledContexts = new Set(preferences.enabledContexts || []);
            if (preferences.logLevel !== undefined) {
                Debug.setGlobalLevel(preferences.logLevel);
                const select = document.getElementById('debug-log-level');
                if (select) select.value = preferences.logLevel;
            }
        } catch (e) {
            console.error('Failed to load debug preferences:', e);
        }
    }
    
    /**
     * Refresh events tab with sourceable events
     * @returns {void}
     */
    refreshEventsTab() {
        const eventsList = document.getElementById('debug-events-list');
        if (!eventsList) return;
        
        const events = EventBus.getSourceableEvents();
        
        if (events.length === 0) {
            eventsList.innerHTML = '<div style="color: #999; font-size: 11px; padding: 10px; text-align: center;">No events yet</div>';
            return;
        }
        
        // Reverse to show most recent first
        const recentEvents = [...events].reverse();
        
        eventsList.innerHTML = recentEvents.map((e, idx) => {
            const time = new Date(e.timestamp).toLocaleTimeString();
            const metadataJson = JSON.stringify(e.data.metadata || {}, null, 2);
            
            return `
                <div class="event-item" style="margin-bottom: 8px; padding: 8px; background: #1a1a1a; border-radius: 4px; border-left: 3px solid #4CAF50;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: #4CAF50; font-weight: bold; font-size: 11px;">${e.eventName}</span>
                        <span style="color: #888; font-size: 10px;">${time}</span>
                    </div>
                    <pre style="margin: 0; font-size: 10px; color: #ddd; white-space: pre-wrap; word-wrap: break-word;">${metadataJson}</pre>
                </div>
            `;
        }).join('');
    }
}
