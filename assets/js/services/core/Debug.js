/**
 * Système de debug avec console.log stylisé et niveaux de log
 * Peut être injecté dans les classes pour un debugging visuel
 */
export class Debug {
    /**
     * Niveaux de log avec priorités
     * @type {Object}
     * @static
     */
    static LEVELS = {
        ALL: 0,      // Tous les logs
        DEBUG: 1,    // Logs de debug détaillés
        INFO: 2,     // Informations générales
        WARN: 3,     // Avertissements
        ERROR: 4,    // Erreurs
        NONE: 5      // Aucun log
    };

    /**
     * Niveau de log global (peut être modifié pour filtrer tous les debugs)
     * @type {number}
     * @static
     */
    static globalLevel = Debug.LEVELS.DEBUG;

    /**
     * Registre de tous les contextes Debug créés
     * @type {Map<string, Debug>}
     * @static
     */
    static registeredContexts = new Map();

    /**
     * Set des contextes activés (whitelist)
     * Si vide, tous sont activés
     * @type {Set<string>}
     * @static
     */
    static enabledContexts = new Set();

    /**
     * Mode de filtrage: 'all' (tous actifs) ou 'whitelist' (seulement enabledContexts)
     * @type {string}
     * @static
     */
    static filterMode = 'all';

    /** @type {boolean} */
    enabled = true;

    /** @type {string} */
    context = 'App';

    /** @type {number} - Niveau minimum pour ce contexte */
    minLevel = Debug.LEVELS.ALL;

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

    /** @type {Object} - Theme configuration for all visual styles */
    theme = {
        contextBadge: {
            color: 'white',
            padding: '2px 8px',
            borderRadius: '3px',
            fontWeight: 'bold',
        },
        timestamp: {
            color: '#94a3b8',
            fontSize: '0.9em',
        },
        message: {
            fontWeight: '500',
        },
        data: {
            fontStyle: 'italic',
        },
        separator: {
            lineColor: '#475569',
            labelColor: '#64748b',
            fontWeight: 'bold',
            textAlign: 'center',
        },
        trace: {
            fontWeight: 'bold',
        },
        table: {
            fontWeight: 'bold',
        },
    };

    /** @type {Object} - Mapping des types vers les niveaux */
    typeLevels = {
        debug: Debug.LEVELS.DEBUG,
        data: Debug.LEVELS.DEBUG,
        event: Debug.LEVELS.DEBUG,
        info: Debug.LEVELS.INFO,
        success: Debug.LEVELS.INFO,
        warning: Debug.LEVELS.WARN,
        error: Debug.LEVELS.ERROR,
    };

    /** @type {Console} - Interface de logging injectable */
    logger = console;

    /**
     * @param {string} context - Nom du contexte (classe, module, etc.)
     * @param {boolean} enabled - Active/désactive le debug
     * @param {Console} logger - Interface de logging (injectable pour tests/custom loggers)
     */
    constructor(context = 'App', enabled = true, logger = console) {
        this.context = context;
        this.enabled = enabled;
        this.logger = logger;

        // Auto-register this context
        Debug.registeredContexts.set(context, this);
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
     * Définit le niveau minimum pour ce contexte
     * @param {number} level - Niveau minimum (Debug.LEVELS.*)
     * @returns {void}
     */
    setLevel(level) {
        this.minLevel = level;
    }

    /**
     * Définit le niveau global pour tous les debugs
     * @param {number} level - Niveau minimum (Debug.LEVELS.*)
     * @static
     * @returns {void}
     */
    static setGlobalLevel(level) {
        Debug.globalLevel = level;
    }

    /**
     * Vérifie si un log doit être affiché selon le niveau ET le contexte
     * @param {string} type - Type de log
     * @returns {boolean}
     * @private
     */
    _shouldLog(type) {
        if (!this.enabled) {
            return false;
        }

        const typeLevel = this.typeLevels[type] || Debug.LEVELS.INFO;
        const levelCheck = typeLevel >= this.minLevel && typeLevel >= Debug.globalLevel;
        if (!levelCheck) return false;

        // Vérifier le filtre de contexte
        if (Debug.filterMode === 'whitelist') {
            // En mode whitelist, le contexte doit être explicitement dans la liste
            // Si la liste est vide, rien n'est autorisé
            return Debug.enabledContexts.has(this.context);
        }

        return true;
    }

    /**
     * Log générique avec style
     * @param {string} type - Type de log (info, success, warning, error, debug, event, data)
     * @param {string} message - Message à afficher
     * @param {*} data - Données optionnelles à afficher
     * @returns {void}
     */
    log(type, message, data = null) {
        if (!this._shouldLog(type)) {
            return;
        }

        const color = this.colors[type] || this.colors.info;
        const icon = this.icons[type] || this.icons.info;
        const timestamp = new Date().toLocaleTimeString('fr-FR');

        // Style pour le badge du contexte
        const contextStyle = `
            background: ${color};
            color: ${this.theme.contextBadge.color};
            padding: ${this.theme.contextBadge.padding};
            border-radius: ${this.theme.contextBadge.borderRadius};
            font-weight: ${this.theme.contextBadge.fontWeight};
        `;

        // Style pour le timestamp
        const timeStyle = `
            color: ${this.theme.timestamp.color};
            font-size: ${this.theme.timestamp.fontSize};
        `;

        // Style pour le message
        const messageStyle = `
            color: ${color};
            font-weight: ${this.theme.message.fontWeight};
        `;

        // Affichage
        this.logger.log(
            `%c${this.context}%c ${timestamp} %c${icon} ${message}`,
            contextStyle,
            timeStyle,
            messageStyle
        );

        // Afficher les données si présentes
        if (data !== null && data !== undefined) {
            this.logger.log('%c└─ Data:', `color: ${color}; font-style: ${this.theme.data.fontStyle};`, data);
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

        this.logger.group(`🔽 ${this.context} - ${label}`);
        callback();
        this.logger.groupEnd();
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

        this.logger.groupCollapsed(`▶️ ${this.context} - ${label}`);
        callback();
        this.logger.groupEnd();
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

        this.logger.log(`%c${this.context} 📊 Table:`, `color: ${this.colors.data}; font-weight: ${this.theme.table.fontWeight};`);
        this.logger.table(data);
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
        this.logger.time(timerLabel);
        const result = callback();
        this.logger.timeEnd(timerLabel);
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

        this.logger.log(`%c${this.context} 🔍 ${message}`, `color: ${this.colors.debug}; font-weight: ${this.theme.trace.fontWeight};`);
        this.logger.trace();
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
        this.logger.log(`%c${line}`, `color: ${this.theme.separator.lineColor};`);
        if (label) {
            this.logger.log(`%c${label}`, `color: ${this.theme.separator.labelColor}; font-weight: ${this.theme.separator.fontWeight}; text-align: ${this.theme.separator.textAlign};`);
            this.logger.log(`%c${line}`, `color: ${this.theme.separator.lineColor};`);
        }
    }

    /**
     * Obtient la liste de tous les contextes enregistrés
     * @returns {string[]}
     * @static
     */
    static getRegisteredContexts() {
        return Array.from(Debug.registeredContexts.keys()).sort();
    }

    /**
     * Active un contexte spécifique
     * @param {string} context
     * @returns {void}
     * @static
     */
    static enableContext(context) {
        Debug.enabledContexts.add(context);
        Debug.filterMode = 'whitelist';
    }

    /**
     * Désactive un contexte spécifique
     * @param {string} context
     * @returns {void}
     * @static
     */
    static disableContext(context) {
        Debug.enabledContexts.delete(context);
    }

    /**
     * Active tous les contextes (désactive le filtre)
     * @returns {void}
     * @static
     */
    static enableAllContexts() {
        Debug.filterMode = 'all';
        Debug.enabledContexts.clear();
    }

    /**
     * Désactive tous les contextes
     * @returns {void}
     * @static
     */
    static disableAllContexts() {
        Debug.filterMode = 'whitelist';
        Debug.enabledContexts.clear();
    }

    /**
     * Définit les contextes actifs
     * @param {string[]} contexts
     * @returns {void}
     * @static
     */
    static setEnabledContexts(contexts) {
        Debug.enabledContexts = new Set(contexts);
        Debug.filterMode = contexts.length > 0 ? 'whitelist' : 'all';
    }

    /**
     * Vérifie si un contexte est activé
     * @param {string} context
     * @returns {boolean}
     * @static
     */
    static isContextEnabled(context) {
        if (Debug.filterMode === 'all') return true;
        return Debug.enabledContexts.has(context);
    }
}
