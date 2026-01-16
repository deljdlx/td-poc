import { DIContainer } from './services/core/DIContainer.js';
import { Debug } from './services/core/Debug.js';
import { CoordinateSystem } from './services/engine/CoordinateSystem.js';
import { GameClock } from './services/engine/GameClock.js';
import { EntityManager } from './services/engine/EntityManager.js';
import { PopupManager } from './services/ui/PopupManager.js';
import { TowerStatsPopup } from './views/TowerStatsPopup.js';
import { PlayerInfoPopup } from './views/PlayerInfoPopup.js';
import { UIUpdateManager } from './services/ui/UIUpdateManager.js';
import { PlayerManager } from './domain/player/managers/PlayerManager.js';
import { Game } from './domain/game/entities/Game.js';
import { WaveManager } from './services/wave/WaveManager.js';

/**
 * Bootstrap - DI Container configuration
 * 
 * Registers ONLY reusable, stateless or global singleton services.
 * 
 * NOT registered here (created directly by AppController):
 * - Game (needs GridModel which doesn't exist yet)
 * - GridSystem/GridModel (app-specific state)
 * - TowerDragHandler (needs GridModel)
 * - Views (GridView, CanvasView, etc.)
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
        return (context, enabled = true, logger = console) => new Debug(context, enabled, logger);
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
}

// Export du container
export { container };
