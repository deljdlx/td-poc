/**
 * Conteneur d'injection de dépendances simple
 * Permet d'enregistrer et d'injecter des services dans les classes
 */
class DIContainer {
    /** @type {Map<string, Object>} */
    services = new Map();
    
    /** @type {Map<string, Function>} */
    factories = new Map();
    
    /** @type {DIContainer|null} */
    static instance = null;
    
    constructor() {
        if (DIContainer.instance) {
            return DIContainer.instance;
        }
        DIContainer.instance = this;
    }
    
    /**
     * Enregistre un service singleton
     * @param {string} name - Nom du service
     * @param {*} service - Instance du service
     * @returns {void}
     */
    register(name, service) {
        this.services.set(name, service);
    }
    
    /**
     * Enregistre une factory pour créer des instances
     * @param {string} name - Nom du service
     * @param {Function} factory - Fonction factory
     * @returns {void}
     */
    registerFactory(name, factory) {
        this.factories.set(name, factory);
    }
    
    /**
     * Récupère un service
     * @param {string} name - Nom du service
     * @returns {*}
     */
    get(name) {
        // Si le service existe déjà, le retourner
        if (this.services.has(name)) {
            return this.services.get(name);
        }
        
        // Si une factory existe, créer et enregistrer le service
        if (this.factories.has(name)) {
            const factory = this.factories.get(name);
            const service = factory(this);
            this.services.set(name, service);
            return service;
        }
        
        throw new Error(`Service "${name}" not found in DI Container`);
    }
    
    /**
     * Vérifie si un service existe
     * @param {string} name
     * @returns {boolean}
     */
    has(name) {
        return this.services.has(name) || this.factories.has(name);
    }
    
    /**
     * Crée une instance de Debug pour un contexte donné
     * @param {string} context - Nom du contexte
     * @param {boolean} enabled - Active/désactive le debug
     * @returns {Debug}
     */
    createDebug(context, enabled = true) {
        const debugFactory = this.get('debug.factory');
        return debugFactory(context, enabled);
    }
    
    /**
     * Injecte les dépendances dans un objet
     * @param {Object} target - Objet cible
     * @param {Object} dependencies - Map des dépendances {property: serviceName}
     * @returns {void}
     */
    inject(target, dependencies) {
        for (const [property, serviceName] of Object.entries(dependencies)) {
            target[property] = this.get(serviceName);
        }
    }
    
    /**
     * Efface tous les services
     * @returns {void}
     */
    clear() {
        this.services.clear();
        this.factories.clear();
    }
    
    /**
     * Liste tous les services enregistrés
     * @returns {string[]}
     */
    listServices() {
        const serviceNames = Array.from(this.services.keys());
        const factoryNames = Array.from(this.factories.keys());
        return [...new Set([...serviceNames, ...factoryNames])];
    }
}
