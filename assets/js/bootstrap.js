import { DIContainer } from './utils/DIContainer.js';
import { Debug } from './utils/Debug.js';
import { CoordinateSystem } from './utils/CoordinateSystem.js';
import { GameClock } from './utils/GameClock.js';
import { EntityManager } from './models/EntityManager.js';

/**
 * Configuration et initialisation du conteneur DI
 */

// Créer le conteneur
const container = new DIContainer();

/**
 * Enregistre tous les services de base
 * @returns {void}
 */
export function bootstrapDI() {
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

// Export du container
export { container };
