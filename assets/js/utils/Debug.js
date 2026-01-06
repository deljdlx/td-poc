/**
 * Système de debug avec console.log stylisé
 * Peut être injecté dans les classes pour un debugging visuel
 */
export class Debug {
    /** @type {boolean} */
    enabled = true;
    
    /** @type {string} */
    context = 'App';
    
    /** @type {Object} */
    colors = {
        info: '#3b82f6',      // Bleu
        success: '#10b981',   // Vert
        warning: '#f59e0b',   // Orange
        error: '#ef4444',     // Rouge
        debug: '#8b5cf6',     // Violet
        event: '#ec4899',     // Rose
        data: '#06b6d4',      // Cyan
    };
    
    /** @type {Object} */
    icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        debug: '🔍',
        event: '⚡',
        data: '📊',
    };
    
    /**
     * @param {string} context - Nom du contexte (classe, module, etc.)
     * @param {boolean} enabled - Active/désactive le debug
     */
    constructor(context = 'App', enabled = true) {
        this.context = context;
        this.enabled = enabled;
    }
    
    /**
     * Active le debug
     * @returns {void}
     */
    enable() {
        this.enabled = true;
    }
    
    /**
     * Désactive le debug
     * @returns {void}
     */
    disable() {
        this.enabled = false;
    }
    
    /**
     * Log générique avec style
     * @param {string} type - Type de log (info, success, warning, error, debug, event, data)
     * @param {string} message - Message à afficher
     * @param {*} data - Données optionnelles à afficher
     * @returns {void}
     */
    log(type, message, data = null) {
        if (!this.enabled) {
            return;
        }
        
        const color = this.colors[type] || this.colors.info;
        const icon = this.icons[type] || this.icons.info;
        const timestamp = new Date().toLocaleTimeString('fr-FR');
        
        // Style pour le badge du contexte
        const contextStyle = `
            background: ${color};
            color: white;
            padding: 2px 8px;
            border-radius: 3px;
            font-weight: bold;
        `;
        
        // Style pour le timestamp
        const timeStyle = `
            color: #94a3b8;
            font-size: 0.9em;
        `;
        
        // Style pour le message
        const messageStyle = `
            color: ${color};
            font-weight: 500;
        `;
        
        // Affichage
        console.log(
            `%c${this.context}%c ${timestamp} %c${icon} ${message}`,
            contextStyle,
            timeStyle,
            messageStyle
        );
        
        // Afficher les données si présentes
        if (data !== null && data !== undefined) {
            console.log('%c└─ Data:', `color: ${color}; font-style: italic;`, data);
        }
    }
    
    /**
     * Log d'information
     * @param {string} message
     * @param {*} data
     * @returns {void}
     */
    info(message, data = null) {
        this.log('info', message, data);
    }
    
    /**
     * Log de succès
     * @param {string} message
     * @param {*} data
     * @returns {void}
     */
    success(message, data = null) {
        this.log('success', message, data);
    }
    
    /**
     * Log d'avertissement
     * @param {string} message
     * @param {*} data
     * @returns {void}
     */
    warning(message, data = null) {
        this.log('warning', message, data);
    }
    
    /**
     * Log d'erreur
     * @param {string} message
     * @param {*} data
     * @returns {void}
     */
    error(message, data = null) {
        this.log('error', message, data);
    }
    
    /**
     * Log de debug technique
     * @param {string} message
     * @param {*} data
     * @returns {void}
     */
    debug(message, data = null) {
        this.log('debug', message, data);
    }
    
    /**
     * Log d'événement
     * @param {string} message
     * @param {*} data
     * @returns {void}
     */
    event(message, data = null) {
        this.log('event', message, data);
    }
    
    /**
     * Log de données
     * @param {string} message
     * @param {*} data
     * @returns {void}
     */
    data(message, data = null) {
        this.log('data', message, data);
    }
    
    /**
     * Crée un groupe de logs repliable
     * @param {string} label
     * @param {Function} callback
     * @returns {void}
     */
    group(label, callback) {
        if (!this.enabled) {
            return;
        }
        
        console.group(`🔽 ${this.context} - ${label}`);
        callback();
        console.groupEnd();
    }
    
    /**
     * Crée un groupe de logs repliable (fermé par défaut)
     * @param {string} label
     * @param {Function} callback
     * @returns {void}
     */
    groupCollapsed(label, callback) {
        if (!this.enabled) {
            return;
        }
        
        console.groupCollapsed(`▶️ ${this.context} - ${label}`);
        callback();
        console.groupEnd();
    }
    
    /**
     * Affiche un tableau formaté
     * @param {Array<Object>} data
     * @returns {void}
     */
    table(data) {
        if (!this.enabled) {
            return;
        }
        
        console.log(`%c${this.context} 📊 Table:`, `color: ${this.colors.data}; font-weight: bold;`);
        console.table(data);
    }
    
    /**
     * Mesure le temps d'exécution d'une fonction
     * @param {string} label
     * @param {Function} callback
     * @returns {*}
     */
    time(label, callback) {
        if (!this.enabled) {
            return callback();
        }
        
        const timerLabel = `⏱️ ${this.context} - ${label}`;
        console.time(timerLabel);
        const result = callback();
        console.timeEnd(timerLabel);
        return result;
    }
    
    /**
     * Trace la pile d'appels
     * @param {string} message
     * @returns {void}
     */
    trace(message = 'Stack trace') {
        if (!this.enabled) {
            return;
        }
        
        console.log(`%c${this.context} 🔍 ${message}`, `color: ${this.colors.debug}; font-weight: bold;`);
        console.trace();
    }
    
    /**
     * Affiche un séparateur visuel
     * @param {string} label
     * @returns {void}
     */
    separator(label = '') {
        if (!this.enabled) {
            return;
        }
        
        const line = '═'.repeat(50);
        console.log(`%c${line}`, 'color: #475569;');
        if (label) {
            console.log(`%c${label}`, 'color: #64748b; font-weight: bold; text-align: center;');
            console.log(`%c${line}`, 'color: #475569;');
        }
    }
}
