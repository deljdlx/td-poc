/**
 * Configuration et initialisation du conteneur DI
 */

// Créer le conteneur
const container = new DIContainer();

/**
 * Enregistre tous les services de base
 * @returns {void}
 */
function bootstrapDI() {
    // Factory pour créer des instances de Debug
    container.registerFactory('debug.factory', () => {
        return (context, enabled = true) => new Debug(context, enabled);
    });
    
    // CoordinateSystem (singleton)
    container.registerFactory('coordinateSystem', () => {
        return new CoordinateSystem();
    });
    
    // GameClock (singleton)
    container.registerFactory('gameClock', (container) => {
        return new GameClock(container);
    });
    
    // EntityManager (singleton)
    container.registerFactory('entityManager', (container) => {
        return new EntityManager(container);
    });
    
    // Autres services à ajouter au besoin...
}

// Initialiser au chargement
bootstrapDI();
