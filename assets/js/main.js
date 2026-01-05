/**
 * POC - Interactive Grid with Canvas Overlay
 * Point d'entrée de l'application
 */

window.addEventListener('load', () => {
    // Récupérer le conteneur DI
    const container = new DIContainer();
    
    // Créer l'application avec injection de dépendances
    const app = new AppController(container);
    app.init();
    
    // Debug: afficher les services enregistrés
    const debug = container.createDebug('Bootstrap', true);
    debug.success('Application démarrée avec DI', {
        services: container.listServices()
    });
});
