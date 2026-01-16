import { Game } from '../domain/game/entities/Game.js';
import { DebugPanel } from '../views/DebugPanel.js';

/**
 * AppController - Main application controller (will become ScreenManager)
 * 
 * Responsibilities:
 * 1. Create and show Game
 * 2. Manage screen transitions (future: menu, options, etc.)
 * 
 * Game is now autonomous and creates all its own components.
 */
export class AppController {
    /** @type {DIContainer} */
    container = null;
    
    /** @type {Debug} */
    debug = null;
    
    /** @type {Game} */
    game = null;
    
    /** @type {DebugPanel} */
    debugPanel = null;
    
    /**
     * @param {DIContainer} container
     */
    constructor(container) {
        this.container = container;
        this.debug = container.createDebug('AppController', true);
    }
    
    /**
     * Initialize the application
     * Creates autonomous Game instance
     * @returns {void}
     */
    init() {
        this.debug.info('🚀 Initializing application');
        
        // Create autonomous Game
        this.game = new Game(this.container);
        
        // Initialize Debug Panel
        this.debugPanel = new DebugPanel(this.container);
        
        // Wire debug panel to game
        this.debugPanel.setGameClock(this.game.gameClock);
        this.debugPanel.setGame(this.game);
        this.game.setDebugPanel(this.debugPanel);
        
        this.debug.success('✅ Application initialized');
    }
    
    /**
     * Start the application
     * @returns {void}
     */
    start() {
        this.debug.info('▶️  Starting application');
        
        // Initialize and start game
        this.game.init();
        this.game.start();
        
        this.debug.success('Application running');
    }
    
    /**
     * Destroy AppController and cleanup all resources
     * @returns {void}
     */
    destroy() {
        this.debug.info('🧹 Destroying AppController...');
        
        // Game owns and destroys its own resources
        if (this.game?.destroy) {
            this.game.destroy();
        }
        
        // Destroy debug panel
        if (this.debugPanel?.destroy) {
            this.debugPanel.destroy();
        }
        
        // Null out references
        this.game = null;
        this.debugPanel = null;
        this.container = null;
        
        this.debug.success('✅ AppController destroyed');
    }
}
// Cache buster: 1768588001
// Cache buster: 1768587927
