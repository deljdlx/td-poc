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
        this.initDraggable();
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
}
