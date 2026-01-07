import { Cell } from './Cell.js';

/**
 * Modèle de la grille
 */
export class GridModel {
    /** @type {number} */
    rows = 6;
    
    /** @type {number} */
    cols = 8;
    
    /** @type {Cell[][]} */
    cells = [];
    
    /** @type {Cell|null} */
    targetCell = null;
    
    /** @type {Path[]} */
    paths = [];
    
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
    
    /**
     * @param {Path} path
     * @returns {void}
     */
    addPath(path) {
        this.paths.push(path);
        this.debug.info(`Path ajouté (${this.paths.length} paths au total)`);
    }
    
    /**
     * @param {Path} path
     * @returns {boolean}
     */
    removePath(path) {
        const index = this.paths.indexOf(path);
        if (index !== -1) {
            this.paths.splice(index, 1);
            this.debug.info(`Path supprimé (${this.paths.length} paths restants)`);
            return true;
        }
        return false;
    }
    
    /**
     * @returns {Path[]}
     */
    getPaths() {
        return this.paths;
    }
    
    /**
     * Set a random cell as target
     * @returns {Cell}
     */
    setRandomTarget() {
        // Clear previous target
        if (this.targetCell) {
            this.targetCell.setTarget(false);
        }
        
        // Pick random cell
        const randomRow = Math.floor(Math.random() * this.rows);
        const randomCol = Math.floor(Math.random() * this.cols);
        
        this.targetCell = this.getCell(randomRow, randomCol);
        this.targetCell.setTarget(true);
        
        this.debug.info(`Target cell set to [${randomRow}, ${randomCol}]`);
        
        return this.targetCell;
    }
    
    /**
     * Get the current target cell
     * @returns {Cell|null}
     */
    getTargetCell() {
        return this.targetCell;
    }
    
    /**
     * Get all empty cells (no tower, not target)
     * @returns {Cell[]}
     */
    getEmptyCells() {
        const empty = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.cells[row][col];
                if (!cell.hasTower() && !cell.isTarget) {
                    empty.push(cell);
                }
            }
        }
        return empty;
    }
    
    /**
     * Get all cells with towers
     * @returns {Cell[]}
     */
    getCellsWithTowers() {
        const withTowers = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.cells[row][col];
                if (cell.hasTower()) {
                    withTowers.push(cell);
                }
            }
        }
        return withTowers;
    }
}
