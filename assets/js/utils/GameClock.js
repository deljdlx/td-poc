/**
 * Horloge de jeu avec fixed timestep pour le gameplay
 */
export class GameClock {
    /** @type {number} - FPS cible pour le gameplay */
    targetFPS = 60;
    
    /** @type {number} - Timestep fixe en millisecondes */
    fixedDeltaTime = 1000 / 60; // 16.67ms
    
    /** @type {number} - Accumulateur de temps */
    accumulator = 0;
    
    /** @type {number} - Timestamp de la dernière frame */
    lastTime = 0;
    
    /** @type {boolean} */
    isRunning = false;
    
    /** @type {number} */
    animationFrameId = 0;
    
    /** @type {Function|null} - Callback pour update gameplay */
    onUpdate = null;
    
    /** @type {Function|null} - Callback pour render */
    onRender = null;
    
    /** @type {Debug} */
    debug = null;
    
    /**
     * @param {DIContainer} container
     */
    constructor(container) {
        this.debug = container.createDebug('GameClock', false); // Debug désactivé par défaut
        this.fixedDeltaTime = 1000 / this.targetFPS;
    }
    
    /**
     * Démarre l'horloge
     * @returns {void}
     */
    start() {
        if (this.isRunning) {
            return;
        }
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.tick();
        
        this.debug.success('GameClock démarrée', {
            targetFPS: this.targetFPS,
            fixedDeltaTime: this.fixedDeltaTime
        });
    }
    
    /**
     * Arrête l'horloge
     * @returns {void}
     */
    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.debug.info('GameClock arrêtée');
    }
    
    /**
     * Boucle principale
     * @returns {void}
     */
    tick() {
        if (!this.isRunning) {
            return;
        }
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Limiter deltaTime pour éviter la "spiral of death"
        const frameDelta = Math.min(deltaTime, 100);
        this.accumulator += frameDelta;
        
        // Fixed timestep updates
        let updateCount = 0;
        while (this.accumulator >= this.fixedDeltaTime) {
            if (this.onUpdate) {
                this.onUpdate(this.fixedDeltaTime / 1000); // Convertir en secondes
            }
            this.accumulator -= this.fixedDeltaTime;
            updateCount++;
            
            // Sécurité : ne pas faire plus de 5 updates d'un coup
            if (updateCount >= 5) {
                this.accumulator = 0;
                break;
            }
        }
        
        // Render (toujours appelé, avec deltaTime variable)
        if (this.onRender) {
            this.onRender(frameDelta / 1000); // Convertir en secondes
        }
        
        this.animationFrameId = requestAnimationFrame(this.tick.bind(this));
    }
    
    /**
     * Enregistre le callback d'update (gameplay)
     * @param {Function} callback
     * @returns {void}
     */
    setUpdateCallback(callback) {
        this.onUpdate = callback;
    }
    
    /**
     * Enregistre le callback de render
     * @param {Function} callback
     * @returns {void}
     */
    setRenderCallback(callback) {
        this.onRender = callback;
    }
}
