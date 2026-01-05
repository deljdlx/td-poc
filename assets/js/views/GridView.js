/**
 * Vue DOM pour la grille
 */
class GridView {
    /** @type {HTMLElement} */
    container = null;
    
    /** @type {GridModel} */
    model = null;
    
    /**
     * @param {string} containerId
     * @param {GridModel} model
     */
    constructor(containerId, model) {
        this.container = document.getElementById(containerId);
        this.model = model;
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
        }
    }
}
