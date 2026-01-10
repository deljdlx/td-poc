import { DIContainer } from './services/core/DIContainer.js';
import { Debug } from './services/core/Debug.js';
import { CoordinateSystem } from './services/engine/CoordinateSystem.js';
import { GameClock } from './services/engine/GameClock.js';
import { EntityManager } from './models/core/EntityManager.js';
import { PopupManager } from './services/ui/PopupManager.js';
import { TowerStatsPopup } from './views/TowerStatsPopup.js';
import { PlayerInfoPopup } from './views/PlayerInfoPopup.js';
import { UIUpdateManager } from './services/ui/UIUpdateManager.js';
import { PlayerManager } from './models/core/PlayerManager.js';
import { Game } from './models/gameplay/Game.js';
import { WaveManager } from './services/wave/WaveManager.js';
import { TowerDragHandler } from './ux/TowerDragHandler.js';

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
    
    // PlayerManager (singleton)
    container.registerFactory('playerManager', (container) => {
        const playerManager = new PlayerManager(container);
        // Create default player for single-player mode
        playerManager.createPlayer('player1', 'Player 1', '#6366f1');
        return playerManager;
    });
    
    // UIUpdateManager (singleton)
    container.registerFactory('uiUpdateManager', (container) => {
        return new UIUpdateManager(container);
    });
    
    // PopupManager (singleton)
    container.registerFactory('popupManager', (container) => {
        return new PopupManager(container);
    });
    
    // TowerStatsPopup (singleton)
    container.registerFactory('towerStatsPopup', (container) => {
        return new TowerStatsPopup(container);
    });
    
    // PlayerInfoPopup (singleton)
    container.registerFactory('playerInfoPopup', (container) => {
        return new PlayerInfoPopup(container);
    });
    
    // WaveManager (singleton)
    container.registerFactory('waveManager', (container) => {
        const entityManager = container.get('entityManager');
        const coordSystem = container.get('coordinateSystem');
        return new WaveManager(entityManager, coordSystem, container);
    });
    
    // TowerDragHandler (singleton) - Will be initialized with gridModel by AppController
    container.registerFactory('towerDragHandler', (container) => {
        return null; // Lazy initialization by AppController after gridModel creation
    });
    
    // Game (singleton) - Core game logic
    container.registerFactory('game', (container) => {
        // gridModel will be set by AppController after creation
        return null; // Lazy initialization by AppController
    });
    
    // Autres services à ajouter au besoin...
}

// Export du container
export { container };
