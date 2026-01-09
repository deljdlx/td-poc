import { Application } from './Application.js';

/**
 * POC - Interactive Grid with Canvas Overlay
 * Point d'entrée de l'application
 */

window.addEventListener('load', async () => {
    // Create singleton Application instance
    const app = Application.getInstance();
    
    // Initialize and start
    await app.init();
    app.start();
    
    // Expose globally for debugging (console access: app.pause(), app.restart(), etc.)
    window.app = app;
    
    // Debug info
    console.log('🎮 Application ready! Try: app.pause(), app.resume(), app.restart()');
});
