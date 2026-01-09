/**
 * PopupManager - Generic popup/modal system
 * Handles overlay, animations, and lifecycle
 */
import { PopupOpenedEvent, PopupClosedEvent } from './events/UIEvent.js';

export class PopupManager {
    /**
     * @type {HTMLElement|null}
     */
    overlay = null;
    
    /**
     * @type {HTMLElement|null}
     */
    container = null;
    
    /**
     * @type {boolean}
     */
    isOpen = false;
    
    /**
     * @type {Function|null}
     */
    onCloseCallback = null;
    
    /**
     * @type {string|null}
     */
    currentPopupType = null;
    
    /**
     * @type {Object<string, Array<Function>>}
     */
    eventListeners = {};
    
    /**
     * @type {Debug}
     */
    debug;
    
    /**
     * @param {DIContainer} diContainer
     */
    constructor(diContainer) {
        this.debug = diContainer.createDebug('PopupManager', true);
        this.eventListeners = {};
        this.currentPopupType = null;
    }
    
    /**
     * Create DOM elements for popup system (lazy init)
     * @returns {void}
     */
    createElements() {
        if (this.overlay) {
            return; // Already created
        }
        
        // Overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'popup-overlay';
        this.overlay.style.display = 'none';
        
        // Container
        this.container = document.createElement('div');
        this.container.className = 'popup-container';
        
        this.overlay.appendChild(this.container);
        document.body.appendChild(this.overlay);
        
        this.bindEvents();
        
        this.debug.success('Popup elements created');
    }
    
    /**
     * Bind global events
     * @returns {void}
     */
    bindEvents() {
        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.hide();
            }
        });
    }
    
    /**
     * Show popup with content
     * @param {Object} options
     * @param {string} options.title - Popup title
     * @param {string|HTMLElement} options.content - Content (HTML string or element)
     * @param {string} [options.size='medium'] - Size: 'small', 'medium', 'large'
     * @param {boolean} [options.closable=true] - Show close button
     * @param {Function} [options.onClose] - Callback on close
     * @param {string} [options.customClass] - Additional CSS class
     * @param {Array} [options.buttons] - Action buttons
     * @returns {void}
     */
    show(options) {
        // Lazy init
        this.createElements();
        
        const {
            title = '',
            content = '',
            size = 'medium',
            closable = true,
            onClose = null,
            customClass = '',
            buttons = [],
            popupType = 'generic'
        } = options;
        
        this.onCloseCallback = onClose;
        
        // Build popup HTML
        let html = '<div class="popup-inner">';
        
        // Header
        html += '<div class="popup-header">';
        html += `<h2 class="popup-title">${title}</h2>`;
        if (closable) {
            html += '<button class="popup-close" aria-label="Close">×</button>';
        }
        html += '</div>';
        
        // Content
        html += '<div class="popup-content">';
        if (typeof content === 'string') {
            html += content;
        }
        html += '</div>';
        
        // Buttons
        if (buttons.length > 0) {
            html += '<div class="popup-buttons">';
            buttons.forEach((btn, index) => {
                const btnClass = btn.class || 'secondary';
                html += `<button class="popup-btn popup-btn-${btnClass}" data-btn-index="${index}">${btn.label}</button>`;
            });
            html += '</div>';
        }
        
        html += '</div>';
        
        // Set content
        this.container.innerHTML = html;
        
        // If content is an element, append it
        if (content instanceof HTMLElement) {
            this.container.querySelector('.popup-content').appendChild(content);
        }
        
        // Apply size and custom class
        this.container.className = `popup-container popup-${size} ${customClass}`;
        
        // Bind close button
        if (closable) {
            const closeBtn = this.container.querySelector('.popup-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hide());
            }
        }
        
        // Bind action buttons
        buttons.forEach((btn, index) => {
            const btnElement = this.container.querySelector(`[data-btn-index="${index}"]`);
            if (btnElement && btn.onClick) {
                btnElement.addEventListener('click', () => {
                    btn.onClick();
                    if (btn.closeOnClick !== false) {
                        this.hide();
                    }
                });
            }
        });
        
        // Show with animation
        this.overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            this.overlay.classList.add('popup-visible');
            this.isOpen = true;
            
            // Store popup type and emit event
            this.currentPopupType = popupType;
            const event = new PopupOpenedEvent(this, popupType);
            this.emit('opened', event);
        });
        
        this.debug.success('Popup shown', { title, size, popupType });
    }
    
    /**
     * Hide popup
     * @returns {void}
     */
    hide() {
        if (!this.isOpen) return;
        
        const closingPopupType = this.currentPopupType;
        
        this.overlay.classList.remove('popup-visible');
        
        // Wait for animation to complete
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.container.innerHTML = '';
            this.isOpen = false;
            
            // Emit closed event
            const event = new PopupClosedEvent(this, closingPopupType);
            this.emit('closed', event);
            
            this.currentPopupType = null;
            
            // Call onClose callback
            if (this.onCloseCallback) {
                this.onCloseCallback();
                this.onCloseCallback = null;
            }
            
            this.debug.info('Popup hidden');
        }, 300);
    }
    
    /**
     * Check if popup is currently open
     * @returns {boolean}
     */
    isPopupOpen() {
        return this.isOpen;
    }
    
    /**
     * Add event listener
     * @param {string} eventName
     * @param {Function} callback
     * @returns {void}
     */
    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }
    
    /**
     * Remove event listener
     * @param {string} eventName
     * @param {Function} callback
     * @returns {void}
     */
    off(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            return;
        }
        this.eventListeners[eventName] = this.eventListeners[eventName].filter(cb => cb !== callback);
    }
    
    /**
     * Trigger event
     * @param {string} eventName
     * @param {*} data - Event data
     * @returns {void}
     * @private
     */
    emit(eventName, data) {
        if (!this.eventListeners[eventName]) {
            return;
        }
        this.eventListeners[eventName].forEach(callback => {
            callback(data);
        });
    }
}
