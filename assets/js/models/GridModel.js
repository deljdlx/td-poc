/**
 * Modèle de la grille
 */
class GridModel {
    /** @type {number} */
    rows = 6;
    
    /** @type {number} */
    cols = 8;
    
    /** @type {Cell[][]} */
    cells = [];
    
    /** @type {Debug} */
    debug = null;
    
    /**
     * @param {number} rows
     * @param {number} cols
     * @param {DIContainer} container
     */
    constructor(rows, cols, container) {
        this.debug = container.createDebug('GridModel', true);
        this.rows = rows;
        this.cols = cols;
        this.initCells();
        this.debug.success(`Grille créée : ${rows}x${cols} = ${rows * cols} cellules`);
    }
    
    /**
     * @returns {void}
     */
    initCells() {
        for (let row = 0; row < this.rows; row++) {
            this.cells[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.cells[row][col] = new Cell(row, col);
            }
        }
    }
    
    /**
     * @param {number} row
     * @param {number} col
     * @returns {Cell|null}
     */
    getCell(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.cells[row][col];
        }
        return null;
    }
    
    /**
     * @returns {Cell[]}
     */
    getSelectedCells() {
        const selected = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.cells[row][col].selected) {
                    selected.push(this.cells[row][col]);
                }
            }
        }
        return selected;
    }
}
