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
     * Ajoute un effet feu d'artifice
     * @param {number} x
     * @param {number} y
     * @returns {void}
     */
    addFirework(x, y) {
        const firework = new FireworkEffect(x, y);
        this.effects.push(firework);
        this.debug.debug('Feu d\'artifice créé', { x, y });
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
