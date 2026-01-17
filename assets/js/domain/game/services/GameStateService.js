import { GameState } from '../value-objects/GameState.js';
import { GameStateChangedEvent, GameOverEvent } from '../../../events/GameEvent.js';
import { Wave } from '../entities/Wave.js';

/**
 * Game state management service
 * Handles game lifecycle (start, pause, resume, gameOver, victory, waves)
 */
export class GameStateService {
    /**
     * @type {DIContainer}
     */
    container;

    /**
     * @type {Debug}
     */
    debug;

    /**
     * @type {Object} - Event handler
     */
    events;

    /**
     * @type {WaveManager}
     */
    waveManager;

    /**
     * @type {GridModel}
     */
    gridModel;

    /**
     * @type {PlayerManager}
     */
    playerManager;

    /**
     * @type {GameClock}
     */
    gameClock;

    /**
     * @type {Object} - Reference to game state (state, currentWaveNumber, globalScore, config)
     */
    gameState;

    /**
     * @type {Game} - Reference to game for event source
     */
    game;

    /**
     * @param {DIContainer} container
     * @param {Object} events - Event handler
     * @param {WaveManager} waveManager
     * @param {GridModel} gridModel
     * @param {PlayerManager} playerManager
     * @param {GameClock} gameClock
     * @param {Object} gameState - Game state object
     * @param {Game} game - Game instance reference
     */
    constructor(container, events, waveManager, gridModel, playerManager, gameClock, gameState, game) {
        this.container = container;
        this.debug = container.createDebug('GameStateService', true);
        this.events = events;
        this.waveManager = waveManager;
        this.gridModel = gridModel;
        this.playerManager = playerManager;
        this.gameClock = gameClock;
        this.gameState = gameState;
        this.game = game;
    }

    /**
     * Start the game
     * @returns {void}
     */
    start() {
        if (this.gameState.state !== GameState.READY) {
            this.debug.warning('Cannot start game - not in READY state', { currentState: this.gameState.state });
            return;
        }

        const oldState = this.gameState.state;
        this.gameState.state = GameState.RUNNING;

        // Emit state changed event
        const event = new GameStateChangedEvent(this.game, oldState, this.gameState.state);
        this.events.emit('stateChanged', event);

        // Start game clock
        this.gameClock.start();

        this.debug.success('🎮 Game started!');

        // Start first wave
        this.nextWave();
    }

    /**
     * Pause the game
     * @returns {void}
     */
    pause() {
        if (this.gameState.state !== GameState.RUNNING) {
            return;
        }

        const oldState = this.gameState.state;
        this.gameState.state = GameState.PAUSED;

        const event = new GameStateChangedEvent(this.game, oldState, this.gameState.state);
        this.events.emit('stateChanged', event);

        this.debug.info('⏸️ Game paused');
    }

    /**
     * Resume the game
     * @returns {void}
     */
    resume() {
        if (this.gameState.state !== GameState.PAUSED) {
            return;
        }

        const oldState = this.gameState.state;
        this.gameState.state = GameState.RUNNING;

        const event = new GameStateChangedEvent(this.game, oldState, this.gameState.state);
        this.events.emit('stateChanged', event);

        this.debug.info('▶️ Game resumed');
    }

    /**
     * Trigger game over
     * @param {string} reason
     * @returns {void}
     */
    gameOver(reason = 'Unknown') {
        const oldState = this.gameState.state;
        this.gameState.state = GameState.GAME_OVER;

        // Emit state changed
        const stateEvent = new GameStateChangedEvent(this.game, oldState, this.gameState.state);
        this.events.emit('stateChanged', stateEvent);

        // Emit game over
        const gameOverEvent = new GameOverEvent(this.game, reason, this.gameState.globalScore);
        this.events.emit('over', gameOverEvent);

        this.debug.error('💀 GAME OVER', { reason, finalScore: this.gameState.globalScore });
    }

    /**
     * Trigger victory
     * @returns {void}
     */
    victory() {
        this.gameState.state = GameState.VICTORY;
        this.debug.success('🎉 VICTORY!', { finalScore: this.gameState.globalScore });
    }

    /**
     * Start next wave
     * @returns {void}
     */
    nextWave() {
        const perimeterPath = this.gridModel.getPaths()[0];

        if (!perimeterPath) {
            this.debug.error('Cannot start wave - no path available');
            return;
        }

        this.gameState.currentWaveNumber++;

        // Progressive difficulty: more enemies each wave
        const enemyCount = 10 + (this.gameState.currentWaveNumber - 1) * this.gameState.config.waves.enemyIncrement;

        const wave = new Wave(
            [
                {
                    type: 'basic',
                    health: 100 * this.gameState.config.waves.difficulty,
                    speed: 1.0,
                    count: enemyCount
                }
            ],
            this.gameState.config.waves.startingDelay,
            perimeterPath
        );

        this.waveManager.startWave(wave, this.gameState.currentWaveNumber);
        this.debug.success(`Wave ${this.gameState.currentWaveNumber} started`, {
            enemyCount,
            difficulty: this.gameState.config.difficulty
        });
    }

    /**
     * Handle enemy reached end of path
     * @param {Enemy} enemy
     * @returns {void}
     */
    handleEnemyReachedEnd(enemy) {
        const activePlayer = this.playerManager.getActivePlayer();

        if (!activePlayer) {
            return;
        }

        // Deduct lives (emits PlayerDamagedEvent)
        activePlayer.takeDamage(1);
        this.debug.warning(`❤️ Enemy reached end! Lives: ${activePlayer.lives}/20`);

        // Check game over
        if (activePlayer.lives <= 0) {
            this.gameOver('All lives lost');
        }
    }
}
