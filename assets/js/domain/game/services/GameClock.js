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

    /** @type {number} - Current FPS (calculated) */
    currentFPS = 0;

    /** @type {number} - Frame count for FPS calculation */
    frameCount = 0;

    /** @type {number} - Last FPS update time */
    lastFPSUpdate = 0;

    /** @type {number} - Time scale (1.0 = normal, 0.5 = half speed, 2.0 = double speed) */
    timeScale = 1.0;

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
        this.lastFPSUpdate = this.lastTime;
        this.frameCount = 0;
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
        // Apply time scale
        this.accumulator += frameDelta * this.timeScale;

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

        // Calculate FPS (update every second)
        this.frameCount++;
        const fpsElapsed = currentTime - this.lastFPSUpdate;
        if (fpsElapsed >= 1000) { // Update every second
            this.currentFPS = (this.frameCount * 1000) / fpsElapsed;
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
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

    /**
     * Get current FPS
     * @returns {number}
     */
    getFPS() {
        return this.currentFPS;
    }

    /**
     * Set time scale (speed multiplier)
     * @param {number} scale - Time scale (1.0 = normal, 0.5 = half, 2.0 = double, 0 = pause)
     * @returns {void}
     */
    setTimeScale(scale) {
        this.timeScale = Math.max(0, Math.min(scale, 10.0)); // Clamp between 0x (pause) and 10x
        this.debug.info('Time scale changed', { timeScale: this.timeScale });
    }

    /**
     * Get current time scale
     * @returns {number}
     */
    getTimeScale() {
        return this.timeScale;
    }
}
