import { Game } from '../domain/game/entities/Game.js';

/**
 * AppController - Main application controller (will become ScreenManager)
 *
 * Responsibilities:
 * 1. Create and show Game
 * 2. Manage screen transitions (future: menu, options, etc.)
 *
 * Game is now fully autonomous and creates all its own components including debug panel.
 */
export class AppController {
    /** @type {DIContainer} */
    container = null;

    /** @type {Debug} */
    debug = null;

    /** @type {Game} */
    game = null;

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

        // Create fully autonomous Game (includes its own debug panel)
        this.game = new Game(this.container);

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

        // Game owns and destroys its own resources (including debug panel)
        if (this.game?.destroy) {
            this.game.destroy();
        }

        // Null out references
        this.game = null;
        this.container = null;

        this.debug.success('✅ AppController destroyed');
    }
}
