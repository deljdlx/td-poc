import { CSSVariables } from '../utils/CSSVariables.js';

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

    /** @type {number} */
    marginDesktop = 20;

    /** @type {number} */
    marginMobile = 10;
    
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
     * @param {number} margin - Marge à soustraire de l'espace disponible
     * @returns {{cellSize: number, cellGap: number}}
     */
    calculateOptimalCellSize(margin) {
        // Mesurer le container et soustraire les marges (2x horizontal, 2x vertical)
        const availableWidth = this.container.clientWidth - (margin * 2);
        const availableHeight = this.container.clientHeight - (margin * 2);

        // Lire le gap fixe depuis CSS
        const cellGap = CSSVariables.getInt('--cell-gap');
        
        // Paramètres grid
        const cols = this.model.cols;
        const rows = this.model.rows;
        
        // Formule avec gap fixe: gridSpace = (cells * cellSize) + ((cells - 1) * gap)
        // → cellSize = (gridSpace - (cells - 1) * gap) / cells
        const cellSizeFromWidth = (availableWidth - (cols - 1) * cellGap) / cols;
        const cellSizeFromHeight = (availableHeight - (rows - 1) * cellGap) / rows;
        
        // Prendre le minimum pour FIT dans les deux dimensions
        let cellSize = Math.floor(Math.min(cellSizeFromWidth, cellSizeFromHeight));
        
        // Contraintes min/max adaptées au viewport
        const isMobile = window.innerWidth < 768;
        const minSize = isMobile ? 20 : 40;
        const maxSize = 120;
        
        const beforeConstraint = cellSize;
        cellSize = Math.max(minSize, Math.min(cellSize, maxSize));
        
        this.debug.data('Cell dimensions calculated', {
            containerSize: { width: availableWidth, height: availableHeight },
            gridParams: { cols, rows },
            calculation: {
                fromWidth: cellSizeFromWidth.toFixed(2),
                fromHeight: cellSizeFromHeight.toFixed(2),
                beforeConstraint,
                afterConstraint: cellSize
            },
            result: { cellSize, cellGap }
        });
        
        return { cellSize, cellGap };
    }
    
    /**
     * Gère le layout responsive (visibilité sidebars, dimensions header/footer)
     * @returns {number} La marge active (mobile ou desktop)
     */
    handleResponsiveLayout() {
        const viewportWidth = window.innerWidth;
        const isMobile = viewportWidth < 768;
        
        // Sidebars
        const sidebarLeft = document.querySelector('.sidebar-left');
        const sidebarRight = document.querySelector('.sidebar-right');
        const infoPanel = document.querySelector('#info-panel');
        
        if (sidebarLeft) sidebarLeft.style.display = isMobile ? 'none' : '';
        if (sidebarRight) sidebarRight.style.display = isMobile ? 'none' : '';
        if (infoPanel) infoPanel.style.display = isMobile ? 'none' : '';
        
        // Header/Footer dimensions
        const header = document.querySelector('.game-header');
        const footer = document.querySelector('.game-footer');
        
        if (header) {
            header.style.height = isMobile ? '50px' : '60px';
            const h1 = header.querySelector('h1');
            if (h1) h1.style.fontSize = isMobile ? '18px' : '24px';
        }
        
        if (footer) {
            footer.style.height = isMobile ? '30px' : '40px';
            footer.style.fontSize = isMobile ? '10px' : '12px';
        }
        
        const activeMargin = isMobile ? this.marginMobile : this.marginDesktop;
        
        this.debug.info('Responsive layout applied', { isMobile, viewportWidth, activeMargin });
        
        return activeMargin;
    }
    
    /**
     * Calcule et applique les dimensions de cellules aux CSS variables
     * @returns {void}
     */
    calculateAndApplyCellDimensions() {
        // 1. Gérer le layout responsive et obtenir la marge active
        const activeMargin = this.handleResponsiveLayout();
        
        // 2. Mesurer le parent et appliquer dimensions explicites au container
        const gameArea = this.container.parentElement;
        const availableWidth = gameArea.clientWidth;
        const availableHeight = gameArea.clientHeight;
        
        // Appliquer dimensions au grid-container
        this.container.style.width = `${availableWidth}px`;
        this.container.style.height = `${availableHeight}px`;
        
        // 3. Calculer dimensions des cells (avec marges)
        const { cellSize, cellGap } = this.calculateOptimalCellSize(activeMargin);
        
        // 4. Calculer largeur totale de la grid
        const cols = this.model.cols;
        const gridWidth = cols * cellSize + (cols - 1) * cellGap;
        
        // 5. Centrer horizontalement, aligner en haut verticalement
        const remainingWidth = availableWidth - gridWidth - (activeMargin * 2);
        
        const offsetLeft = activeMargin + Math.floor(remainingWidth / 2);
        const offsetTop = activeMargin;
        
        this.container.style.left = `${offsetLeft}px`;
        this.container.style.top = `${offsetTop}px`;
        
        // 6. Appliquer cellSize aux CSS variables (cellGap reste configuré en CSS)
        CSSVariables.set('--cell-size', `${cellSize}px`);
        
        this.debug.success('Dimensions appliquées', {
            container: { width: availableWidth, height: availableHeight },
            grid: { width: gridWidth },
            offset: { left: offsetLeft, top: offsetTop },
            margin: activeMargin,
            cellSize,
            cellGap
        });
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
        const cellSize = CSSVariables.getInt('--cell-size');
        const cellGap = CSSVariables.getInt('--cell-gap');
        
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
            
            if (cell.hasTower()) {
                cell.element.classList.add('has-tower');
            } else {
                cell.element.classList.remove('has-tower');
            }
        }
    }
    
    /**
     * Recalcule et applique les positions de toutes les cellules
     * Utilisé lors du resize du viewport
     * @returns {void}
     */
    updateAllCellPositions() {
        const cellSize = CSSVariables.getInt('--cell-size');
        const cellGap = CSSVariables.getInt('--cell-gap');
        
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
