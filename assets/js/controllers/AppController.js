import { GridModel } from '../models/GridModel.js';
import { GridView } from '../views/GridView.js';
import { CanvasView } from '../views/CanvasView.js';
import { InfoView } from '../views/InfoView.js';
import { Missile } from '../models/Missile.js';
import { Tower } from '../models/Tower.js';
import { Enemy } from '../models/Enemy.js';

/**
 * Contrôleur principal de l'application
 */
export class AppController {
    /** @type {GridModel} */
    model = null;
    
    /** @type {GridView} */
    gridView = null;
    
    /** @type {CanvasView} */
    canvasView = null;
    
    /** @type {InfoView} */
    infoView = null;
    
    /** @type {CoordinateSystem} */
    coordSystem = null;
    
    /** @type {Debug} */
    debug = null;
    
    /** @type {DIContainer} */
    container = null;
    
    /** @type {GameClock} */
    gameClock = null;
    
    /** @type {EntityManager} */
    entityManager = null;
    
    /**
     * @param {DIContainer} container
     */
    constructor(container) {
        this.container = container;
        // Injection du debug
        this.debug = container.createDebug('AppController', true);
    }
    
    /**
     * @returns {void}
     */
    init() {
        this.debug.info('🚀 Initialisation de l\'application');
        
        // Récupération des services via DI
        this.coordSystem = this.container.get('coordinateSystem');
        this.gameClock = this.container.get('gameClock');
        this.entityManager = this.container.get('entityManager');
        
        // Initialisation avec injection
        this.model = new GridModel(10, 15, this.container);
        this.gridView = new GridView('grid-container', this.model, this.container);
        this.canvasView = new CanvasView('canvas-layer', this.coordSystem, this.container);
        this.infoView = new InfoView(this.container);
        
        this.debug.success('Application initialisée avec succès', {
            rows: this.model.rows,
            cols: this.model.cols
        });
        
        // Rendu initial
        this.gridView.render();
        
        // Définir une cellule cible aléatoire
        this.model.setRandomTarget();
        this.gridView.updateCell(this.model.getTargetCell());
        
        // Placer des tours aléatoirement
        this.placeRandomTowers(5);
        
        // Bind events
        this.bindEvents();
        
        // Configurer et démarrer GameClock
        this.setupGameClock();
    }
    
    /**
     * Configure la GameClock
     * @returns {void}
     */
    setupGameClock() {
        // Update gameplay (fixed timestep)
        this.gameClock.setUpdateCallback(this.updateGameplay.bind(this));
        
        // Render (variable timestep)
        this.gameClock.setRenderCallback(this.render.bind(this));
        
        // Démarrer
        this.gameClock.start();
    }
    
    /**
     * Place N towers randomly on empty cells
     * @param {number} count - Number of towers to place
     * @returns {void}
     */
    placeRandomTowers(count) {
        const emptyCells = this.model.getEmptyCells();
        
        if (emptyCells.length < count) {
            this.debug.warning(`Not enough empty cells for ${count} towers, placing ${emptyCells.length}`);
            count = emptyCells.length;
        }
        
        // Shuffle and take first N cells
        const shuffled = emptyCells.sort(() => Math.random() - 0.5);
        const selectedCells = shuffled.slice(0, count);
        
        selectedCells.forEach(cell => {
            const tower = new Tower(cell, this.createMissileFromTower.bind(this), this.container);
            cell.setTower(tower);
            this.entityManager.addEntity(tower);
            this.gridView.updateCell(cell);
        });
        
        this.debug.success(`Placed ${count} towers randomly`);
    }
    
    /**
     * Create missile from tower position to target
     * @param {number} x - Start X
     * @param {number} y - Start Y
     * @param {number} targetX - Target X
     * @param {number} targetY - Target Y
     * @returns {void}
     */
    createMissileFromTower(x, y, targetX, targetY) {
        const missile = new Missile(
            x, y,
            targetX, targetY,
            300, // speed
            (mx, my) => {
                this.canvasView.addFirework(mx, my);
            },
            3.0 // maxLifeTime
        );
        
        this.entityManager.addEntity(missile);
        this.debug.event('Tower fired missile');
    }
    
    /**
     * Update gameplay (appelé à 60 Hz fixe)
     * @param {number} deltaTime - en secondes
     * @returns {void}
     */
    updateGameplay(deltaTime) {
        // Update all game entities (missiles, towers, enemies, etc.)
        this.entityManager.update(deltaTime);
    }
    
    /**
     * Render (appelé chaque frame)
     * @param {number} deltaTime - en secondes
     * @returns {void}
     */
    render(deltaTime) {
        // Update et render des effets autonomes
        this.canvasView.updateAndRenderEffects(deltaTime);
        
        // Render game entities
        this.canvasView.renderEntities(this.entityManager.getEntities(), deltaTime);
    }
    
    /**
     * @returns {void}
     */
    bindEvents() {
        const container = document.getElementById('grid-container');
        container.addEventListener('click', this.handleCellClick.bind(this));
        
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    /**
     * @param {MouseEvent} event
     * @returns {void}
     */
    handleCellClick(event) {
        const target = event.target;
        
        if (!target.classList.contains('grid-cell')) {
            return;
        }
        
        const row = parseInt(target.dataset.row);
        const col = parseInt(target.dataset.col);
        const cell = this.model.getCell(row, col);
        
        if (!cell) {
            return;
        }
        
        // Check if cell has a tower
        if (cell.hasTower()) {
            this.debug.event(`Tower clicked at [${row}, ${col}]`);
            
            // Find closest enemy and shoot
            const closestEnemy = this.findClosestEnemy(cell.getTower());
            if (closestEnemy) {
                cell.getTower().shoot(closestEnemy.x, closestEnemy.y);
                this.debug.success('Tower fired at enemy');
            } else {
                this.debug.warning('No enemy to shoot at');
            }
        } else {
            // Empty cell clicked - spawn enemy at this position
            this.debug.event(`Empty cell clicked [${row}, ${col}] - spawning enemy`);
            const center = this.coordSystem.getElementCenter(cell.element);
            this.spawnEnemy(center.x, center.y);
        }
    }
    
    /**
     * Find closest enemy to a tower
     * @param {Tower} tower
     * @returns {Enemy|null}
     */
    findClosestEnemy(tower) {
        const enemies = this.entityManager.getEntities().filter(e => e.getType() === 'enemy' && e.alive);
        
        if (enemies.length === 0) {
            return null;
        }
        
        let closest = null;
        let minDistance = Infinity;
        
        enemies.forEach(enemy => {
            const dx = enemy.x - tower.x;
            const dy = enemy.y - tower.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                closest = enemy;
            }
        });
        
        return closest;
    }

    /**
     * Spawn enemy at position
     * @param {number} x
     * @param {number} y
     * @returns {void}
     */
    spawnEnemy(x, y) {
        const enemy = new Enemy(x, y);
        this.entityManager.addEntity(enemy);
        this.debug.success('Enemy spawned', { x, y });
    }
    
    /**
     * @returns {void}
     */
    handleResize() {
        this.updateCanvas();
    }
    
    /**
     * @returns {void}
     */
    updateCanvas() {
        const selectedCells = this.model.getSelectedCells();
        this.debug.data('Mise à jour du canvas', {
            cellCount: selectedCells.length
        });
        this.canvasView.drawConnections(selectedCells);
    }
    
    /**
     * @returns {void}
     */
    updateInfo() {
        const count = this.model.getSelectedCells().length;
        this.infoView.updateCount(count);
    }
}
