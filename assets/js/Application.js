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
    
    /**
     * @type {string} - 'uninitialized' | 'ready' | 'running' | 'paused' | 'stopped'
     */
    state = 'uninitialized';
    
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
     * Initialize application (bootstrap DI, create services)
     * @returns {Promise<void>}
     */
    async init() {
        if (this.state !== 'uninitialized') {
            console.warn('Application already initialized');
            return;
        }
        
        // 1. Bootstrap DI Container
        bootstrapDI();
        this.container = container;
        this.debug = this.container.createDebug('Application', true);
        
        this.debug.info('🚀 Initializing Application...');
        
        // 2. Create AppController (owned instance)
        this.controller = new AppController(this.container);
        this.controller.init();
        
        this.state = 'ready';
        this.debug.success('✅ Application initialized');
    }
    
    /**
     * Start the application (game loop)
     * @returns {void}
     */
    start() {
        if (this.state !== 'ready' && this.state !== 'paused') {
            this.debug.warning('Cannot start: state is', this.state);
            return;
        }
        
        this.debug.info('▶️  Starting application...');
        
        // AppController already starts the game in init()
        // But we track the running state here
        
        this.state = 'running';
        this.debug.success('Application running');
    }
    
    /**
     * Pause the application
     * @returns {void}
     */
    pause() {
        if (this.state !== 'running') {
            return;
        }
        
        this.debug.info('⏸️  Pausing application...');
        
        const gameClock = this.container.get('gameClock');
        gameClock.stop();
        
        this.state = 'paused';
    }
    
    /**
     * Resume the application
     * @returns {void}
     */
    resume() {
        if (this.state !== 'paused') {
            return;
        }
        
        this.debug.info('▶️  Resuming application...');
        
        const gameClock = this.container.get('gameClock');
        gameClock.start();
        
        this.state = 'running';
    }
    
    /**
     * Stop the application (can be restarted)
     * @returns {void}
     */
    stop() {
        if (this.state === 'stopped' || this.state === 'uninitialized') {
            return;
        }
        
        this.debug.info('⏹️  Stopping application...');
        
        const gameClock = this.container.get('gameClock');
        gameClock.stop();
        
        this.state = 'stopped';
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
        
        // 1. Stop game loop
        this.stop();
        
        // 2. Destroy AppController (owned)
        if (this.controller?.destroy) {
            this.controller.destroy();
        }
        this.controller = null;
        
        // 3. Clear DI Container services (optional - for complete restart)
        // Note: We don't clear the container itself, just reset to allow re-init
        
        this.state = 'uninitialized';
        this.debug.success('✅ Application destroyed');
    }
    
    /**
     * Get current application state
     * @returns {string}
     */
    getState() {
        return this.state;
    }
    
    /**
     * Check if application is running
     * @returns {boolean}
     */
    isRunning() {
        return this.state === 'running';
    }
    
    /**
     * Check if application is paused
     * @returns {boolean}
     */
    isPaused() {
        return this.state === 'paused';
    }
}
