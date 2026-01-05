/**
 * Vue pour le panneau d'information
 */
class InfoView {
    /** @type {HTMLElement} */
    countElement = null;
    
    /** @type {Debug} */
    debug = null;
    
    /**
     * @param {DIContainer} diContainer
     */
    constructor(diContainer) {
        this.debug = diContainer.createDebug('InfoView', true);
        this.countElement = document.getElementById('selected-count');
        this.debug.info('InfoView initialisée');
    }
    
    /**
     * @param {number} count
     * @returns {void}
     */
    updateCount(count) {
        this.countElement.textContent = count.toString();
    }
}
