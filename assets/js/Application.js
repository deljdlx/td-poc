import { bootstrapDI, container } from './bootstrap.js';
import { AppController } from './controllers/AppController.js';

/**
 * Application - Main application lifecycle manager
 * Singleton that manages the entire app lifecycle
 */
export class Application {
    /**
     * @type {Application|null}
     */
    static instance = null;

    /**
     * @type {DIContainer}
     */
    container = null;

    /**
     * @type {AppController|null}
     */
    controller = null;

    /**
     * @type {Debug}
     */
    debug = null;

    constructor() {
        if (Application.instance) {
            return Application.instance;
        }
        Application.instance = this;
    }

    /**
     * Get singleton instance
     * @returns {Application}
     */
    static getInstance() {
        if (!Application.instance) {
            Application.instance = new Application();
        }
        return Application.instance;
    }

    /**
     * Initialize application (bootstrap DI, create controller and game)
     * @returns {Promise<void>}
     */
    async init() {
        // Bootstrap DI Container
        bootstrapDI();
        this.container = container;
        this.debug = this.container.createDebug('Application', true);

        this.debug.info('🚀 Initializing Application...');

        // Create AppController (which creates Game)
        this.controller = new AppController(this.container);
        this.controller.init();

        this.debug.success('✅ Application initialized');
    }

    /**
     * Start the game (delegates to controller)
     * @returns {void}
     */
    start() {
        this.debug.info('▶️  Starting application...');
        this.controller.start();
        this.debug.success('Application running');
    }

    /**
     * Pause the game (delegates to game)
     * @returns {void}
     */
    pause() {
        this.controller.game.pause();
    }

    /**
     * Resume the game (delegates to game)
     * @returns {void}
     */
    resume() {
        this.controller.game.resume();
    }

    /**
     * Stop the game (delegates to game.pause)
     * @returns {void}
     */
    stop() {
        this.controller.game.pause();
    }

    /**
     * Restart the application (destroy and reinit)
     * @returns {Promise<void>}
     */
    async restart() {
        this.debug.info('🔄 Restarting application...');

        await this.destroy();
        await this.init();
        this.start();
    }

    /**
     * Destroy the application and cleanup all resources
     * @returns {Promise<void>}
     */
    async destroy() {
        this.debug.info('🧹 Destroying application...');

        // Destroy AppController (which destroys Game)
        if (this.controller?.destroy) {
            this.controller.destroy();
        }
        this.controller = null;

        this.debug.success('✅ Application destroyed');
    }

    /**
     * Get game instance (shortcut)
     * @returns {Game}
     */
    get game() {
        return this.controller?.game;
    }
}
