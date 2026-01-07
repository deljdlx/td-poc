/**
 * PopupManager - Generic popup/modal system
 * Handles overlay, animations, and lifecycle
 */
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
     * @type {Debug}
     */
    debug;
    
    /**
     * @param {DIContainer} diContainer
     */
    constructor(diContainer) {
        this.debug = diContainer.createDebug('PopupManager', true);
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
            buttons = []
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
        });
        
        this.debug.success('Popup shown', { title, size });
    }
    
    /**
     * Hide popup
     * @returns {void}
     */
    hide() {
        if (!this.isOpen) return;
        
        this.overlay.classList.remove('popup-visible');
        
        // Wait for animation to complete
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.container.innerHTML = '';
            this.isOpen = false;
            
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
}
