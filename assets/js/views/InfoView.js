/**
 * Vue pour le panneau d'information
 */
class InfoView {
    /** @type {HTMLElement} */
    countElement = null;
    
    constructor() {
        this.countElement = document.getElementById('selected-count');
    }
    
    /**
     * @param {number} count
     * @returns {void}
     */
    updateCount(count) {
        this.countElement.textContent = count.toString();
    }
}
