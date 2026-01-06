/**
 * Vue DOM pour la grille
 */
export class GridView {
    /** @type {HTMLElement} */
    container = null;
    
    /** @type {GridModel} */
    model = null;
    
    /** @type {Debug} */
    debug = null;
    
    /**
     * @param {string} containerId
     * @param {GridModel} model
     * @param {DIContainer} diContainer
     */
    constructor(containerId, model, diContainer) {
        this.debug = diContainer.createDebug('GridView', true);
        this.container = document.getElementById(containerId);
        this.model = model;
        this.debug.info('GridView initialisée');
    }
    
    /**
     * @returns {void}
     */
    render() {
        this.container.innerHTML = '';
        
        for (let row = 0; row < this.model.rows; row++) {
            for (let col = 0; col < this.model.cols; col++) {
                const cell = this.model.getCell(row, col);
                const cellElement = this.createCellElement(cell);
                cell.element = cellElement;
                this.container.appendChild(cellElement);
            }
        }
    }
    
    /**
     * @param {Cell} cell
     * @returns {HTMLElement}
     */
    createCellElement(cell) {
        const div = document.createElement('div');
        div.className = 'grid-cell';
        if (cell.isTarget) {
            div.classList.add('target-cell');
        }
        div.textContent = cell.getLabel();
        div.dataset.row = cell.row.toString();
        div.dataset.col = cell.col.toString();
        return div;
    }
    
    /**
     * @param {Cell} cell
     * @returns {void}
     */
    updateCell(cell) {
        if (cell.element) {
            if (cell.selected) {
                cell.element.classList.add('selected');
            } else {
                cell.element.classList.remove('selected');
            }
            
            if (cell.isTarget) {
                cell.element.classList.add('target-cell');
            } else {
                cell.element.classList.remove('target-cell');
            }
        }
    }
}
