/**
 * Vue Canvas pour dessiner des connexions
 */
class CanvasView {
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
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    /**
     * Setup entity renderers
     * @returns {void}
     */
    setupRenderers() {
        // Register renderers for each entity type
        this.renderers['missile'] = new MissileRenderer();
        // Future: this.renderers['tower'] = new TowerRenderer();
        // Future: this.renderers['enemy'] = new EnemyRenderer();
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
     * @returns {void}
     */
    renderEntities(entities) {
        for (const entity of entities) {
            const renderer = this.renderers[entity.getType()];
            if (renderer) {
                renderer.render(this.ctx, entity);
            } else {
                this.debug.warning(`No renderer found for entity type: ${entity.getType()}`);
            }
        }
    }
    
    /**
     * Dessine des lignes entre les cellules sélectionnées
     * @param {Cell[]} selectedCells
     * @returns {void}
     */
    drawConnections(selectedCells) {
        this.clear();
        
        if (selectedCells.length < 2) {
            this.debug.debug('Pas assez de cellules pour dessiner des connexions', {
                count: selectedCells.length
            });
            return;
        }
        
        this.debug.debug(`Dessin de ${selectedCells.length - 1} connexions`);
        this.debug.groupCollapsed('Détails des connexions', () => {
            selectedCells.forEach((cell, i) => {
                console.log(`Cell ${i}: [${cell.row}, ${cell.col}]`);
            });
        });
        
        // Style du dessin
        this.ctx.strokeStyle = '#ec4899';
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#ec4899';
        this.ctx.lineCap = 'round';
        
        // Dessiner des lignes entre chaque paire de cellules consécutives
        for (let i = 0; i < selectedCells.length - 1; i++) {
            const from = selectedCells[i];
            const to = selectedCells[i + 1];
            this.drawLine(from.element, to.element);
        }
        
        // Dessiner une ligne de la dernière à la première pour fermer la boucle
        if (selectedCells.length > 2) {
            this.ctx.strokeStyle = '#6366f1';
            this.ctx.shadowColor = '#6366f1';
            const from = selectedCells[selectedCells.length - 1];
            const to = selectedCells[0];
            this.drawLine(from.element, to.element);
        }
        
        // Dessiner des cercles aux centres des cellules
        this.drawCenters(selectedCells);
    }
    
    /**
     * @param {HTMLElement} fromElement
     * @param {HTMLElement} toElement
     * @returns {void}
     */
    drawLine(fromElement, toElement) {
        const from = this.coordSystem.getElementCenter(fromElement);
        const to = this.coordSystem.getElementCenter(toElement);
        
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
    }
    
    /**
     * @param {Cell[]} selectedCells
     * @returns {void}
     */
    drawCenters(selectedCells) {
        this.ctx.fillStyle = '#f0abfc';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#f0abfc';
        
        selectedCells.forEach(cell => {
            const center = this.coordSystem.getElementCenter(cell.element);
            this.ctx.beginPath();
            this.ctx.arc(center.x, center.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}
