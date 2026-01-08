import { GridModel } from '../models/GridModel.js';
import { GridView } from '../views/GridView.js';
import { CanvasView } from '../views/CanvasView.js';
import { TowerRangeView } from '../views/TowerRangeView.js';
import { Missile } from '../models/Missile.js';
import { Tower } from '../models/Tower.js';
import { Enemy } from '../models/Enemy.js';
import { TowerDragHandler } from './TowerDragHandler.js';
import { PathFactory } from '../models/PathFactory.js';
import { Wave } from '../models/Wave.js';
import { WaveManager } from './WaveManager.js';

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
    
    /** @type {TowerDragHandler} */
    towerDragHandler = null;
    
    /** @type {WaveManager} */
    waveManager = null;
    
    /** @type {TowerRangeView} */
    towerRangeView = null;
    
    /** @type {TowerStatsPopup} */
    towerStatsPopup = null;
    
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
        this.towerStatsPopup = this.container.get('towerStatsPopup');
        const uiUpdateManager = this.container.get('uiUpdateManager');
        
        // Initialisation avec injection
        this.model = new GridModel(15, 10, this.container);
        this.gridView = new GridView('grid-container', this.model, this.container);
        this.canvasView = new CanvasView('canvas-layer', this.coordSystem, this.container);
        this.towerRangeView = new TowerRangeView(this.container);
        
        // Initialiser le gestionnaire de drag and drop des tourelles
        this.towerDragHandler = new TowerDragHandler(
            this.model,
            this.gridView,
            this.coordSystem,
            this.entityManager,
            this.container
        );
        
        this.debug.success('Application initialisée avec succès', {
            rows: this.model.rows,
            cols: this.model.cols
        });
        
        // Rendu initial
        this.gridView.render();
        
        // Créer et ajouter le path périmètre
        const perimeterPath = PathFactory.createPerimeter(
            this.model,
            this.coordSystem,
            this.container
        );
        this.model.addPath(perimeterPath);
        this.gridView.renderPaths();
        this.debug.success('Path périmètre créé et affiché');
        
        // Initialiser WaveManager
        this.waveManager = new WaveManager(
            this.entityManager,
            this.coordSystem,
            this.container
        );
        
        // Placer des tours aléatoirement
        this.placeRandomTowers(5);
        
        // Bind events
        this.bindEvents();
        
        // Configurer et démarrer GameClock
        this.setupGameClock();
        
        // Démarrer une vague de test
        this.startTestWave();
    }
    
    /**
     * Start a test wave
     * @returns {void}
     */
    startTestWave() {
        const perimeterPath = this.model.getPaths()[0];
        
        if (!perimeterPath) {
            this.debug.error('No path available for wave');
            return;
        }
        
        // Créer une vague : 10 ennemis basiques, 1 par seconde
        const wave = new Wave(
            [
                { type: 'basic', health: 100, speed: 1.0, count: 10 } // speed: 1 cell/second
            ],
            1.0, // 1 second between spawns
            perimeterPath
        );
        
        this.waveManager.startWave(wave);
        this.debug.success('Test wave started');
    }
    
    /**
     * Configure la GameClock
     * @returns {void}
     */
    setupGameClock() {
        const uiUpdateManager = this.container.get('uiUpdateManager');
        
        // Update gameplay (fixed timestep)
        this.gameClock.setUpdateCallback(this.updateGameplay.bind(this));
        
        // Render callback (includes UI updates)
        this.gameClock.setRenderCallback((deltaTime) => {
            this.render(deltaTime);
            // Update UI components after render
            uiUpdateManager.update(deltaTime);
        });
        
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
            
            // Activer le drag and drop sur cette tourelle
            this.towerDragHandler.enableTowerDrag(cell);
        });
        
        this.debug.success(`Placed ${count} towers randomly`);
    }
    
    /**
     * Create missile from tower position to target
     * @param {Tower} tower - Tower that fired
     * @param {number} x - Start X
     * @param {number} y - Start Y
     * @param {number} targetX - Target X
     * @param {number} targetY - Target Y
     * @returns {void}
     */
    createMissileFromTower(tower, x, y, targetX, targetY) {
        const missile = new Missile(
            x, y,
            targetX, targetY,
            300, // speed in pixels/sec (kept as is for now)
            (impactX, impactY, splashRadiusPixels, damage, critChance, critMultiplier) => {
                // Visual effect - simple explosion for basic missile
                this.canvasView.addSimpleExplosion(impactX, impactY);
                
                // Damage enemies in splash zone (splashRadiusPixels already converted)
                this.applyMissileDamage(tower, impactX, impactY, splashRadiusPixels, damage, critChance, critMultiplier);
            },
            3.0, // maxLifeTime
            0.5, // splashRadius in CELLS (0.5 cell radius)
            tower.damage,  // Use tower's damage
            this.coordSystem, // Pass coordSystem for conversion
            tower.critChance, // Use tower's crit chance
            tower.critMultiplier  // Use tower's crit multiplier
        );
        
        this.entityManager.addEntity(missile);
        this.debug.event('Tower fired missile');
    }
    
    /**
     * Apply damage to enemies in splash zone
     * @param {Tower} tower - Tower that fired the missile
     * @param {number} impactX - Impact X position
     * @param {number} impactY - Impact Y position
     * @param {number} splashRadius - Splash damage radius
     * @param {number} damage - Damage amount
     * @param {number} critChance - Critical hit chance
     * @param {number} critMultiplier - Critical damage multiplier
     * @returns {void}
     */
    applyMissileDamage(tower, impactX, impactY, splashRadius, damage, critChance = 0.0, critMultiplier = 1.5) {
        // Visual effect for splash zone
        this.canvasView.addSplashEffect(impactX, impactY, splashRadius);
        
        const enemies = this.entityManager.getEntitiesByType('enemy');
        let hitCount = 0;
        
        this.debug.info(`Checking ${enemies.length} enemies for splash damage at (${impactX.toFixed(0)}, ${impactY.toFixed(0)}) radius: ${splashRadius}px`);
        
        enemies.forEach(enemy => {
            const dx = enemy.x - impactX;
            const dy = enemy.y - impactY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            this.debug.debug(`Enemy ${enemy.id} at (${enemy.x.toFixed(0)}, ${enemy.y.toFixed(0)}) - distance: ${distance.toFixed(1)}px`);
            
            // Check if enemy is in splash zone
            if (distance <= splashRadius) {
                // Calculate if critical hit
                const isCritical = Math.random() < critChance;
                const finalDamage = isCritical ? Math.floor(damage * critMultiplier) : damage;
                
                const wasAlive = enemy.alive;
                enemy.takeDamage(finalDamage);
                hitCount++;
                
                // Track hit and damage
                tower.trackHit(finalDamage, isCritical);
                
                // Track kill if enemy died
                if (wasAlive && !enemy.alive) {
                    tower.trackKill();
                }
                
                if (isCritical) {
                    this.debug.success(`💥 CRITICAL HIT! Enemy ${enemy.id} hit for ${finalDamage} damage (${critMultiplier}x) - (${enemy.health}/${enemy.maxHealth} HP remaining)`);
                } else {
                    this.debug.info(`Enemy ${enemy.id} hit for ${finalDamage} damage (${enemy.health}/${enemy.maxHealth} HP remaining)`);
                }
            }
        });
        
        if (hitCount > 0) {
            this.debug.success(`Missile hit ${hitCount} enemy(ies) in splash zone (radius: ${splashRadius}px)`);
        } else {
            this.debug.warning('Missile missed - no enemies in splash zone');
        }
    }
    
    /**
     * Update gameplay (appelé à 60 Hz fixe)
     * @param {number} deltaTime - en secondes
     * @returns {void}
     */
    updateGameplay(deltaTime) {
        // Update wave spawning
        if (this.waveManager) {
            this.waveManager.update(deltaTime);
        }
        
        // Update all game entities (missiles, towers, enemies, etc.)
        this.entityManager.update(deltaTime);
    }
    
    /**
     * Render (appelé chaque frame)
     * @param {number} deltaTime - en secondes
     * @returns {void}
     */
    render(deltaTime) {
        // Update et render des effets autonomes (efface le canvas)
        this.canvasView.updateAndRenderEffects(deltaTime);
        
        // Render game entities (paths sont statiques en DOM, pas besoin de redraw)
        this.canvasView.renderEntities(this.entityManager.getEntities(), deltaTime);
    }
    
    /**
     * @returns {void}
     */
    bindEvents() {
        const container = document.getElementById('grid-container');
        container.addEventListener('click', this.handleCellClick.bind(this));
        container.addEventListener('contextmenu', this.handleCellClick.bind(this)); // Right-click
        
        // Grid hover detection for tower range display (on cells, not canvas)
        container.addEventListener('mousemove', this.handleCellHover.bind(this));
        container.addEventListener('mouseleave', this.handleCellLeave.bind(this));
        
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
            
            const tower = cell.getTower();
            
            // Click on tower to show stats (auto-targeting handles shooting)
            event.preventDefault();
            this.debug.info('Opening tower stats popup');
            this.towerStatsPopup.show(tower);
        } else {
            // Empty cell clicked
            this.debug.event(`Empty cell clicked [${row}, ${col}]`);
            // Possibilité d'ajouter des événements personnalisés ici
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
     * Handle cell hover to show tower range
     * @param {MouseEvent} event
     * @returns {void}
     */
    handleCellHover(event) {
        // Check if hovering over a cell with a tower
        const target = event.target;
        
        if (!target.classList.contains('grid-cell')) {
            this.towerRangeView.hide();
            return;
        }
        
        const row = parseInt(target.dataset.row);
        const col = parseInt(target.dataset.col);
        const cell = this.model.getCell(row, col);
        
        if (!cell || !cell.hasTower()) {
            this.towerRangeView.hide();
            return;
        }
        
        // Show range for this tower
        const tower = cell.getTower();
        this.towerRangeView.show(tower);
        // this.debug.debug('Showing tower range', { row, col, range: tower.range });
    }
    
    /**
     * Handle cell mouse leave
     * @returns {void}
     */
    handleCellLeave() {
        this.towerRangeView.hide();
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
}
