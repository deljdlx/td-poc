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
    
    /** @type {number|null} */
    resizeTimeout = null;
    
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
        this.calculateAndApplyCellDimensions();
        this.setupResizeListener();
    }
    
    /**
     * Configure le listener de resize avec debounce
     * @returns {void}
     */
    setupResizeListener() {
        window.addEventListener('resize', () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            
            this.resizeTimeout = setTimeout(() => {
                this.debug.event('Viewport resized - recalculating dimensions and positions');
                this.calculateAndApplyCellDimensions();
                this.updateAllCellPositions();
            }, 150);
        });
    }
    
    /**
     * Calcule les dimensions optimales des cellules basées sur l'espace disponible
     * @returns {{cellSize: number, cellGap: number}}
     */
    calculateOptimalCellSize() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 1. Dimensions réelles de l'info panel
        const infoPanel = document.getElementById('info-panel');
        const infoPanelRect = infoPanel ? infoPanel.getBoundingClientRect() : { width: 0 };
        const infoPanelTotalWidth = infoPanelRect.width + 40; // largeur + marges (20px × 2)
        
        // 2. Marges de sécurité
        const marginSafety = 40;
        const containerPadding = 40; // padding: 20px × 2
        
        // 3. Espace maximum pour le container (AVEC padding)
        const maxContainerWidth = viewportWidth - infoPanelTotalWidth - marginSafety;
        const maxContainerHeight = viewportHeight - marginSafety;
        
        // 4. Espace INTERNE (SANS padding) - la grille doit rentrer ici
        const internalWidth = maxContainerWidth - containerPadding;
        const internalHeight = maxContainerHeight - containerPadding;
        
        // 5. Calcul cellSize
        const cols = this.model.cols;
        const rows = this.model.rows;
        const gapRatio = 0.1; // gap = 10% de cellSize
        
        // Formule: internalSpace = (cells * cellSize) + ((cells - 1) * gap)
        // Avec gap = cellSize * gapRatio
        // → internalSpace = cellSize * (cells + (cells - 1) * gapRatio)
        const cellSizeFromWidth = internalWidth / (cols + (cols - 1) * gapRatio);
        const cellSizeFromHeight = internalHeight / (rows + (rows - 1) * gapRatio);
        
        // 6. Prendre le minimum + contraintes
        let cellSize = Math.floor(Math.min(cellSizeFromWidth, cellSizeFromHeight));
        
        // Contraintes min/max pour lisibilité
        cellSize = Math.max(40, Math.min(cellSize, 120));
        
        const cellGap = Math.floor(cellSize * gapRatio);
        
        this.debug.data('Dimensions calculées', {
            viewport: { width: viewportWidth, height: viewportHeight },
            infoPanelWidth: infoPanelTotalWidth,
            maxContainer: { width: maxContainerWidth, height: maxContainerHeight },
            internal: { width: internalWidth, height: internalHeight },
            cellSize,
            cellGap
        });
        
        return { cellSize, cellGap };
    }
    
    /**
     * Calcule et applique les dimensions de cellules aux CSS variables
     * @returns {void}
     */
    calculateAndApplyCellDimensions() {
        const { cellSize, cellGap } = this.calculateOptimalCellSize();
        
        // Appliquer aux CSS variables
        document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
        document.documentElement.style.setProperty('--cell-gap', `${cellGap}px`);
        
        this.debug.success('CSS variables appliquées', { cellSize, cellGap });
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
        // Get CSS variables
        const root = document.documentElement;
        const cellSize = parseInt(getComputedStyle(root).getPropertyValue('--cell-size'));
        const cellGap = parseInt(getComputedStyle(root).getPropertyValue('--cell-gap'));
        
        // Calculate absolute position
        const left = cell.col * (cellSize + cellGap);
        const top = cell.row * (cellSize + cellGap);
        
        const div = document.createElement('div');
        div.className = 'grid-cell';
        if (cell.isTarget) {
            div.classList.add('target-cell');
        }
        
        // Apply absolute positioning
        div.style.left = `${left}px`;
        div.style.top = `${top}px`;
        
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
    
    /**
     * Recalcule et applique les positions de toutes les cellules
     * Utilisé lors du resize du viewport
     * @returns {void}
     */
    updateAllCellPositions() {
        const root = document.documentElement;
        const cellSize = parseInt(getComputedStyle(root).getPropertyValue('--cell-size'));
        const cellGap = parseInt(getComputedStyle(root).getPropertyValue('--cell-gap'));
        
        for (let row = 0; row < this.model.rows; row++) {
            for (let col = 0; col < this.model.cols; col++) {
                const cell = this.model.getCell(row, col);
                if (cell.element) {
                    const left = col * (cellSize + cellGap);
                    const top = row * (cellSize + cellGap);
                    
                    cell.element.style.left = `${left}px`;
                    cell.element.style.top = `${top}px`;
                }
            }
        }
    }
}
