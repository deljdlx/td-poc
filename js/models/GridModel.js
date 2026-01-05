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
    
    /**
     * @param {number} rows
     * @param {number} cols
     */
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.initCells();
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
