import { MissileRenderer } from '../renderers/MissileRenderer.js';
import { TowerRenderer } from '../renderers/TowerRenderer.js';
import { EnemyRenderer } from '../renderers/EnemyRenderer.js';
import { DOMEnemyRenderer } from '../renderers/DOMEnemyRenderer.js';
import { FireworkEffect } from '../fx/FireworkEffect.js';
import { SimpleExplosionEffect } from '../fx/SimpleExplosionEffect.js';
import { SplashEffect } from '../fx/SplashEffect.js';
import { CircleSpriteRenderer } from '../renderers/sprites/CircleSpriteRenderer.js';
import { StarSpriteRenderer } from '../renderers/sprites/StarSpriteRenderer.js';
import { SquareSpriteRenderer } from '../renderers/sprites/SquareSpriteRenderer.js';
import { DiamondSpriteRenderer } from '../renderers/sprites/DiamondSpriteRenderer.js';
import { TriangleSpriteRenderer } from '../renderers/sprites/TriangleSpriteRenderer.js';

/**
 * Vue Canvas pour dessiner des connexions
 */
export class CanvasView {
    /** @type {HTMLCanvasElement} */
    canvas = null;

    /** @type {CanvasRenderingContext2D} */
    ctx = null;

    /** @type {CoordinateSystem} */
    coordSystem = null;
    
    /** @type {Debug} */
    debug = null;
    
    /** @type {Array<FireworkEffect>} */
    effects = [];
    
    /** @type {Object<string, Object>} */
    renderers = {};
    
    /** @type {DOMEnemyRenderer} */
    domEnemyRenderer = null;
    
    /** @type {Function|null} */
    boundHandleResize = null;
    
    /**
     * @param {string} canvasId
     * @param {CoordinateSystem} coordSystem
     * @param {DIContainer} diContainer
     */
    constructor(canvasId, coordSystem, diContainer) {
        this.debug = diContainer.createDebug('CanvasView', true);
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.coordSystem = coordSystem;
        this.domEnemyRenderer = new DOMEnemyRenderer(diContainer);
        this.setupCanvas();
        this.setupRenderers();
        this.debug.info('Canvas configuré', {
            width: this.canvas.width,
            height: this.canvas.height
        });
    }
    
    /**
     * @returns {void}
     */
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.boundHandleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.boundHandleResize);
    }
    
    /**
     * Setup entity renderers
     * @returns {void}
     */
    setupRenderers() {
        // Missiles - sprite will be created per-missile based on visualFx
        this.renderers['missile'] = new MissileRenderer();
        
        // Towers - diamond sprite
        const towerSprite = new DiamondSpriteRenderer(1.5);
        this.renderers['tower'] = new TowerRenderer(towerSprite);
        
        // Enemies - circle sprite (red)
        const enemySprite = new CircleSpriteRenderer(false);
        this.renderers['enemy'] = new EnemyRenderer(enemySprite);
        
        this.debug.success('Renderers configured', { missile: 'Star', tower: 'Diamond', enemy: 'Circle' });
    }
    
    /**
     * @returns {void}
     */
    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    /**
     * @returns {void}
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Ajoute un effet feu d'artifice avec configuration aléatoire
     * @param {number} x
     * @param {number} y
     * @returns {void}
     */
    addFirework(x, y) {
        // Configuration aléatoire pour chaque explosion
        const config = {
            power: 100 + Math.random() * 200,           // 100-300 px/s
            spread: 30 + Math.random() * 120,           // 30-150°
            angle: -120 + Math.random() * 60,           // -120° à -60° (bias vers le haut)
            gravity: 200 + Math.random() * 200,         // 200-400 px/s²
            friction: 0.95 + Math.random() * 0.04,      // 0.95-0.99
            particleCount: 20 + Math.floor(Math.random() * 40), // 20-60 particules
            particleSize: {
                min: 2 + Math.random() * 2,             // 2-4
                max: 5 + Math.random() * 5              // 5-10
            },
            lifetime: {
                min: 1.0 + Math.random() * 0.5,         // 1.0-1.5s
                max: 1.5 + Math.random() * 1.0          // 1.5-2.5s
            }
        };
        
        const firework = new FireworkEffect(x, y, config);
        this.effects.push(firework);
        this.debug.debug('Feu d\'artifice créé', { x, y, config });
    }
    
    /**
     * Add splash zone visual effect
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} radius - Splash radius
     * @returns {void}
     */
    addSplashEffect(x, y, radius) {
        const splash = new SplashEffect(x, y, radius);
        this.effects.push(splash);
        this.debug.debug('Splash effect created', { x, y, radius });
    }
    
    /**
     * Add simple explosion effect
     * @param {number} x
     * @param {number} y
     * @param {Object} config - Optional configuration
     * @returns {void}
     */
    addSimpleExplosion(x, y, config = {}) {
        const explosion = new SimpleExplosionEffect(x, y, config);
        this.effects.push(explosion);
        this.debug.debug('Simple explosion created', { x, y, config });
    }
    
    /**
     * Met à jour et dessine tous les effets autonomes
     * @param {number} deltaTime - en secondes
     * @returns {void}
     */
    updateAndRenderEffects(deltaTime) {
        // Clear canvas
        this.clear();
        
        // Dessiner les connexions de la grille
        const selectedCells = [];
        // TODO: récupérer les cellules sélectionnées si besoin
        
        // Update effets
        this.effects.forEach(effect => effect.update(deltaTime));
        
        // Supprimer les effets morts
        const beforeCount = this.effects.length;
        this.effects = this.effects.filter(effect => !effect.isDead);
        if (this.effects.length < beforeCount) {
            this.debug.debug(`${beforeCount - this.effects.length} effet(s) supprimé(s)`);
        }
        
        // Dessiner les effets
        this.effects.forEach(effect => effect.draw(this.ctx));
    }
    
    /**
     * Render game entities (missiles, towers, enemies, etc.)
     * @param {Array<Entity>} entities
     * @param {number} deltaTime - Time delta in seconds
     * @returns {void}
     */
    renderEntities(entities, deltaTime = 0) {
        for (const entity of entities) {
            const type = entity.getType();
            
            // Enemies are rendered in DOM
            if (type === 'enemy') {
                this.domEnemyRenderer.render(entity);
                continue;
            }
            
            // Other entities rendered on canvas
            const renderer = this.renderers[type];
            if (renderer) {
                renderer.render(this.ctx, entity, deltaTime);
            } else {
                this.debug.warning(`No renderer found for entity type: ${type}`);
            }
        }
    }
    
    /**
     * Destroy CanvasView and cleanup resources
     * @returns {void}
     */
    destroy() {
        // Remove resize event listener
        if (this.boundHandleResize) {
            window.removeEventListener('resize', this.boundHandleResize);
            this.boundHandleResize = null;
        }
        
        // Clear references
        this.canvas = null;
        this.ctx = null;
        this.coordSystem = null;
        this.effects = [];
        this.renderers = {};
        this.domEnemyRenderer = null;
    }
}
