import { CSSVariables } from '../../../services/ui/CSSVariables.js';
import { PathRenderer } from '../../../views/PathRenderer.js';
import { EventBus } from '../../../services/core/EventBus.js';

/**
 * Vue DOM pour la grille (EVENT-DRIVEN VIEW LAYER)
 * Listens to: cell:towerChanged domain events
 * Renders: Pure function of data state
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
    
    /** @type {PathRenderer} */
    pathRenderer = null;
    
    /** @type {CoordinateSystem} */
    coordSystem = null;
    
    /** @type {Function|null} */
    boundHandleResize = null;
    
    /**
     * @param {string} containerId
     * @param {GridModel} model
     * @param {DIContainer} diContainer
     */
    constructor(containerId, model, diContainer) {
        this.debug = diContainer.createDebug('GridView', true);
        this.container = document.getElementById(containerId);

        this.model = model;

        this.pathRenderer = new PathRenderer(diContainer);

        // console.group('%cGridView.js :: 154 =============================', 'color: #906501; font-size: 1rem');
        // console.log(
        //   this.container,
        //   this.container.clientWidth,
        //   this.container.clientHeight
        // );
        // console.groupEnd();
        // foobar();

        this.coordSystem = diContainer.get('coordinateSystem');
        this.debug.info('GridView initialisée');
        this.calculateAndApplyCellDimensions();
        this.setupResizeListener();
        this.setupDataEventListeners();
    }

    /**
     * Setup event listeners for data layer changes (EVENT-DRIVEN RENDERING)
     * @returns {void}
     */
    setupDataEventListeners() {
        this.debug.info('🎧 Setting up data event listeners...');
        // Listen to cell tower changes and update DOM
        EventBus.onGlobal('cell:towerChanged', (data) => {
            const { cell, oldTower, newTower } = data;
            this.updateCellVisual(cell, oldTower, newTower);
        });
        this.debug.success('✅ Data event listeners configured');
    }

    /**
     * Update cell visual based on data state (PURE RENDERING)
     * @param {Cell} cell
     * @param {Tower|null} oldTower
     * @param {Tower|null} newTower
     * @returns {void}
     */
    updateCellVisual(cell, oldTower, newTower) {
        if (!cell.element) {
            this.debug.warning('Cannot update cell visual - no DOM element', { 
                row: cell.row, 
                col: cell.col 
            });
            return;
        }
        // Remove old tower visual
        if (oldTower) {
            cell.element.classList.remove('has-tower');
            const oldIcon = cell.element.querySelector('.tower-icon');
            if (oldIcon) {
                oldIcon.remove();
            }
        }
        // Add new tower visual
        if (newTower) {
            cell.element.classList.add('has-tower');
            this.renderTowerIcon(cell, newTower);
        }
        this.debug.event('Cell visual updated', {
            row: cell.row,
            col: cell.col,
            hadTower: !!oldTower,
            hasTower: !!newTower
        });
    }

    // TODO move this to TowerRenderer.js ?
    /**
     * Render tower icon in cell (PURE RENDERING)
     * @param {Cell} cell
     * @param {Tower} tower
     * @returns {void}
     */
    renderTowerIcon(cell, tower) {
        // Remove existing icon if any
        const existing = cell.element.querySelector('.tower-icon');
        if (existing) {
            existing.remove();
        }
        // Create new icon
        const icon = document.createElement('div');
        icon.className = 'tower-icon';
        // icon.textContent = '🗼';
        // icon.style.position = 'absolute';
        icon.style.fontSize = '24px';
        icon.style.pointerEvents = 'none';
        cell.element.appendChild(icon);
    }

    /**
     * Configure le listener de resize avec debounce
     * @returns {void}
     */
    setupResizeListener() {
        this.boundHandleResize = () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = setTimeout(() => {
                this.debug.event('Viewport resized - recalculating dimensions and positions');
                this.calculateAndApplyCellDimensions();
                this.updateAllCellPositions();
            }, 150);
        };
        window.addEventListener('resize', this.boundHandleResize);
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
        const minSize = isMobile ? 20 : 20;
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
        if (sidebarLeft) sidebarLeft.style.display = isMobile ? 'none' : '';
        if (sidebarRight) sidebarRight.style.display = isMobile ? 'none' : '';
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
                cell.domElement = cellElement;
                this.container.appendChild(cellElement);
            }
        }
        // Render paths after cells (on canvas layer)
        this.renderPaths();
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
        // Apply absolute positioning
        div.style.left = `${left}px`;
        div.style.top = `${top}px`;
        div.textContent = cell.getLabel();
        div.dataset.row = cell.row.toString();
        div.dataset.col = cell.col.toString();
        return div;
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

    /**
     * Render all paths to DOM (static, called once or when paths change)
     * @returns {void}
     */
    renderPaths() {
        // Clear existing paths
        this.pathRenderer.clear();
        // Render each path
        const paths = this.model.getPaths();
        paths.forEach(path => {
            this.pathRenderer.render(path, this.coordSystem, {
                showDirection: true
            });
        });
    }

    /**
     * Destroy GridView and cleanup resources
     * @returns {void}
     */
    destroy() {
        this.debug.info('🧹 Destroying GridView...');
        // Clear resize timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        // Remove resize event listener
        if (this.boundHandleResize) {
            window.removeEventListener('resize', this.boundHandleResize);
            this.boundHandleResize = null;
        }
        // Clear DOM references
        this.container = null;
        this.model = null;
        this.pathRenderer = null;
        this.coordSystem = null;
        this.debug.success('✅ GridView destroyed');
    }
}
