import { container, bootstrapDI } from './bootstrap.js';
import { AppController } from './controllers/AppController.js';

/**
 * POC - Interactive Grid with Canvas Overlay
 * Point d'entrée de l'application
 */

window.addEventListener('load', () => {
    // Initialiser le DI container
    bootstrapDI();
    
    // Créer l'application avec injection de dépendances
    const app = new AppController(container);
    app.init();
    
    // Debug: afficher les services enregistrés
    const debug = container.createDebug('Bootstrap', true);
    debug.success('Application démarrée avec DI', {
        services: container.listServices()
    });
});
