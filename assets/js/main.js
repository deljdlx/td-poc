/**
 * POC - Interactive Grid with Canvas Overlay
 * Point d'entrée de l'application
 */

const app = new AppController();
window.addEventListener('load', () => {
    app.init();
});
