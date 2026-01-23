import { GameState } from "../value-objects/GameState.js";
import { Tower } from "../../combat/entities/Tower.js";
import { PathFactory } from "../../map/PathFactory.js";
import { Missile } from "../../combat/entities/Missile.js";
import { EventBus } from "../../../services/core/EventBus.js";
import { missileTypes } from "../registries/MissileTypeRegistry.js";
import { towerTypes } from "../registries/TowerTypeRegistry.js";
import { GameClock } from "../services/GameClock.js";
import { EntityManager } from "../../../services/engine/EntityManager.js";
import { PlayerManager } from "../../player/managers/PlayerManager.js";
import { WaveManager } from "../managers/WaveManager.js";
import { GridSystem } from "../../map/systems/GridSystem.js";
import { CanvasView } from "../../../views/CanvasView.js";
import { TowerRangeView } from "../../combat/views/TowerRangeView.js";
import { TowerDragHandler } from "../../../ux/TowerDragHandler.js";
import { TowerStatsPopup } from "../../combat/views/TowerStatsPopup.js";
import { PlayerInfoPopup } from "../../player/views/PlayerInfoPopup.js";
import { GameDebugPanel } from "../debug/GameDebugPanel.js";
import { TowerService } from "../services/TowerService.js";
import { CombatService } from "../services/CombatService.js";
import { RewardService } from "../services/RewardService.js";
import { GameStateService } from "../services/GameStateService.js";
import { TowerShopToolbar } from "../ui/TowerShopToolbar.js";

import { EventListenersConfiguration } from "../EventListenersConfiguration.js";

/**
 * Game - Autonomous tower defense game instance
 * Creates and manages all game-specific components independently
 */
export class Game {
  /**
   * @type {GameState}
   */
  state = GameState.READY;

  /**
   * @type {number}
   */
  currentWaveNumber = 0;

  /**
   * @type {number}
   */
  globalScore = 0;

  /**
   * @type {DIContainer}
   */
  container;

  /**
   * @type {Debug}
   */
  debug;

  /**
   * @type {CoordinateSystem}
   */
  coordSystem;

  /**
   * @type {GameClock}
   */
  gameClock;

  /**
   * @type {EntityManager}
   */
  entityManager;

  /**
   * @type {PlayerManager}
   */
  playerManager;

  /**
   * @type {WaveManager}
   */
  waveManager;

  /**
   * @type {GridSystem}
   */
  gridSystem;

  /**
   * @type {GridModel}
   */
  gridModel;

  /**
   * @type {CanvasView}
   */
  canvasView;

  /**
   * @type {TowerRangeView}
   */
  towerRangeView;

  /**
   * @type {TowerDragHandler}
   */
  towerDragHandler;

  /**
   * @type {TowerStatsPopup}
   */
  towerStatsPopup;

  /**
   * @type {PlayerInfoPopup}
   */
  playerInfoPopup;

  /**
   * @type {GameDebugPanel}
   */
  debugPanel;

  /**
   * @type {Object} - Event handler from EventBus
   */
  events;

    /**
     * @type {Function|null} - Bound handler for towerPlaced event
     */
    boundOnTowerPlaced = null;

    /**
     * @type {Function|null} - Bound player info click handler
     */
    boundHandlePlayerInfoClick = null;
  towerService;

  /**
   * @type {CombatService}
   */
  combatService;

  /**
   * @type {RewardService}
   */
  rewardService;

  /**
   * @type {GameStateService}
   */
  gameStateService;

  /**
   * @type {TowerShopToolbar}
   */
  towerShopToolbar;

  /**
   * @type {Object}
   */
  config = {
    waves: {
      difficulty: 1.0,
      startingDelay: 1.0,
      enemyIncrement: 2,
    },
  };

  /**
   * @type {Object} - Missile type blueprints (imported from registry)
   */
  missileTypes = missileTypes;

  /**
   * @type {Object} - Tower type blueprints (imported from registry)
   */
  towerTypes = towerTypes;

  /**
   * Create autonomous game instance
   * @param {DIContainer} container - Only for global services
   */
  constructor(container) {
    this.container = container;
    this.debug = container.createDebug("Game", true);
    this.events = EventBus.createHandler(this);

    // Get global services from DI
    this.coordSystem = container.get("coordinateSystem");

    // Create game-specific instances
    this.debug.info("🎮 Creating game components...");

    this.gameClock = new GameClock(container);
    this.entityManager = new EntityManager(container);
    this.playerManager = new PlayerManager(container);
    this.playerManager.createPlayer("player1", "Player 1", "#6366f1");

    this.waveManager = new WaveManager(
      this.entityManager,
      this.coordSystem,
      container,
    );
    this.waveManager.setGameEvents(this.events);

    this.gridSystem = new GridSystem(15, 10, "grid-container", container);
    this.gridModel = this.gridSystem.getModel();

    this.canvasView = new CanvasView(
      "canvas-layer",
      this.coordSystem,
      container,
    );
    this.towerRangeView = new TowerRangeView(container);

    this.towerDragHandler = new TowerDragHandler(
      this.gridModel,
      this.gridSystem.getView(),
      this.coordSystem,
      this.entityManager,
      container,
    );

    this.towerStatsPopup = new TowerStatsPopup(container);
    this.playerInfoPopup = new PlayerInfoPopup(this.playerManager, container);

    // Create debug panel owned by Game
    this.debugPanel = new GameDebugPanel(container, this);
    this.debugPanel.setGameClock(this.gameClock);

    // Create game services
    this.debug.info("🔧 Creating game services...");

    // Game state object for services
    const gameState = {
      state: this.state,
      currentWaveNumber: this.currentWaveNumber,
      globalScore: this.globalScore,
      config: this.config,
    };

    this.towerService = new TowerService(
      container,
      this.entityManager,
      this.playerManager,
      this.towerTypes,
      this.events,
      this,
    );

    this.combatService = new CombatService(
      container,
      this.coordSystem,
      this.entityManager,
    );

    this.rewardService = new RewardService(
      container,
      this.playerManager,
      this.events,
      gameState,
    );

    this.gameStateService = new GameStateService(
      container,
      this.events,
      this.waveManager,
      this.gridModel,
      this.playerManager,
      this.gameClock,
      gameState,
      this,
    );


    this.eventListenersConfiguration = new EventListenersConfiguration(this);

    this.towerShopToolbar = new TowerShopToolbar(
      Object.values(this.towerTypes),
    );

    this.debug.success("✅ Game components and services created");
  }

  /**
   * Initialize game (setup paths, initial towers, etc.)
   * @returns {void}
   */
  init() {
    this.debug.info("🎮 Initializing game...");

    this.eventListenersConfiguration.init();


    // DATA: grid and paths
    this.setupData();

    // RENDER: initial path rendering
    this.setupRender();

    // UI / UX handlers (event wiring)
    this.setupUXHandlers();

    // DEV: place initial towers for development/testing (kept intentionally)
    this.placeRandomTowers(5);
    this.debug.success("Initial towers placed");

    // Log tower drag handlers status
    const towersCount = this.gridModel.getCellsWithTowers().length;
    this.debug.info(`Drag enabled on ${towersCount} towers`);

    // DOMAIN: game event listeners and game clock
    this.setupGameEventListeners();
    this.setupGameClock();

    // INTERACTIONS: DOM listeners (clicks, hovers)
    this.setupGridEvents();

    // Finalize
    this.state = GameState.READY;
    this.debug.success("Game initialized - Ready to start");
  }

  /**
   * Setup data-related systems: grid and paths
   * @returns {void}
   */
  setupData() {
    // Initialize grid (render DOM elements and attach cells)
    this.gridSystem.init();

    // Create perimeter path
    const perimeterPath = PathFactory.createPerimeter(
      this.gridModel,
      this.coordSystem,
      this.container,
    );
    this.gridModel.addPath(perimeterPath);
    this.debug.success("Perimeter path created");
  }

  /**
   * Setup initial rendering
   * @returns {void}
   */
  setupRender() {
    // Render static paths and other initial visuals
    this.gridSystem.renderPaths();
  }

  /**
   * Setup UX handlers and small wiring for in-development tools
   * @returns {void}
   */
  setupUXHandlers() {
    // Bind and register tower placed handler so we can remove it later
    this.boundOnTowerPlaced = this.onTowerPlaced.bind(this);
    this.events.on("towerPlaced", this.boundOnTowerPlaced);
  }

  /**
   * Handler called when a tower has been placed (sourceable event)
   * @param {TowerPlacedEvent|Object} event
   * @returns {void}
   */
  onTowerPlaced(event) {
    this.towerDragHandler.enableTowerDrag(event.cell);
  }

  /**
   * Player info button handler
   * @returns {void}
   */
  handlePlayerInfoClick() {
    this.playerInfoPopup.show();
  }

  /**
   * Setup game event listeners for business logic (rewards, scoring, game over)
   * AND visual effects (explosions, animations)
   * COMMAND/EVENT PATTERN: Commands trigger validation + data mutation + domain events
   * @returns {void}
   */
  setupGameEventListeners() {
    this.debug.info(
      "🎯 Setting up Game event listeners (command/event pattern)",
    );


  }

  /**
   * Setup GameClock callbacks and configure game loop
   * @returns {void}
   */
  setupGameClock() {
    this.debug.info("⏰ Setting up GameClock...");

    const uiUpdateManager = this.container.get("uiUpdateManager");

    // Update gameplay (fixed timestep)
    this.gameClock.setUpdateCallback(this.update.bind(this));

    // Render callback (includes UI updates)
    this.gameClock.setRenderCallback((deltaTime) => {
      this.render(deltaTime);
      // Update UI components after render
      uiUpdateManager.update(deltaTime);
      // Update debug panel if available
      if (this.debugPanel) {
        this.debugPanel.update({
          fps: this.gameClock.getFPS(),
          entityCount: this.entityManager.getEntities().length,
        });
      }
    });

    this.debug.success("✅ GameClock configured");
  }

  /**
   * Setup grid interaction events (clicks, hovers)
   * @returns {void}
   */
  setupGridEvents() {
    this.debug.info("🎯 Setting up grid events...");

    const container = document.getElementById("grid-container");

    // Store bound references for cleanup
    this.boundHandleCellClick = this.handleCellClick.bind(this);
    this.boundHandleCellHover = this.handleCellHover.bind(this);
    this.boundHandleCellLeave = this.handleCellLeave.bind(this);

    container.addEventListener("click", this.boundHandleCellClick);
    container.addEventListener("contextmenu", this.boundHandleCellClick);

    // Grid hover detection for tower range display
    container.addEventListener("mousemove", this.boundHandleCellHover);
    container.addEventListener("mouseleave", this.boundHandleCellLeave);

    // Player info button
    const playerInfoBtn = document.getElementById("player-info-btn");
    if (playerInfoBtn) {
      this.boundHandlePlayerInfoClick = this.handlePlayerInfoClick.bind(this);
      playerInfoBtn.addEventListener("click", this.boundHandlePlayerInfoClick);
    }

    this.debug.success("✅ Grid events configured");
  }

  /**
   * Handle cell click
   * @param {MouseEvent} event
   * @returns {void}
   */
  handleCellClick(event) {
    const target = event.target;

    if (!target.classList.contains("grid-cell")) {
      return;
    }

    const row = parseInt(target.dataset.row);
    const col = parseInt(target.dataset.col);
    const cell = this.gridSystem.getCell(row, col);

    if (!cell) {
      return;
    }

    // Check if cell has a tower
    if (cell.hasTower()) {
      this.debug.event(`Tower clicked at [${row}, ${col}]`);

      const tower = cell.getTower();

      // Click on tower to show stats
      event.preventDefault();
      this.debug.info("Opening tower stats popup");
      this.towerStatsPopup.show(tower);
    } else {
      // Empty cell clicked
      this.debug.event(`Empty cell clicked [${row}, ${col}]`);
    }
  }

  /**
   * Handle cell hover to show tower range
   * @param {MouseEvent} event
   * @returns {void}
   */
  handleCellHover(event) {
    const target = event.target;

    if (!target.classList.contains("grid-cell")) {
      this.towerRangeView.hide();
      return;
    }

    const row = parseInt(target.dataset.row);
    const col = parseInt(target.dataset.col);
    const cell = this.gridSystem.getCell(row, col);

    if (!cell || !cell.hasTower()) {
      this.towerRangeView.hide();
      return;
    }

    // Show range for this tower
    const tower = cell.getTower();
    this.towerRangeView.show(tower);
  }

  /**
   * Handle cell mouse leave
   * @returns {void}
   */
  handleCellLeave() {
    this.towerRangeView.hide();
  }

  /**
   * Start the game (delegates to GameStateService)
   * @returns {void}
   */
  start() {
    this.towerShopToolbar.render("#tower-shop-toolbar");
    this.gameStateService.start();

    // Sync state back to Game
    this.state = this.gameStateService.gameState.state;
  }

  /**
   * Pause the game (delegates to GameStateService)
   * @returns {void}
   */
  pause() {
    this.gameStateService.pause();
    // Sync state back to Game
    this.state = this.gameStateService.gameState.state;
  }

  /**
   * Resume the game (delegates to GameStateService)
   * @returns {void}
   */
  resume() {
    this.gameStateService.resume();
    // Sync state back to Game
    this.state = this.gameStateService.gameState.state;
  }

  /**
   * Trigger game over (delegates to GameStateService)
   * @param {string} reason
   * @returns {void}
   */
  gameOver(reason = "Unknown") {
    this.gameStateService.gameOver(reason);
    // Sync state back to Game
    this.state = this.gameStateService.gameState.state;
  }

  /**
   * Trigger victory (delegates to GameStateService)
   * @returns {void}
   */
  victory() {
    this.gameStateService.victory();
    // Sync state back to Game
    this.state = this.gameStateService.gameState.state;
  }

  /**
   * Start next wave (delegates to GameStateService)
   * @returns {void}
   */
  nextWave() {
    this.gameStateService.nextWave();
    // Sync state back to Game
    this.currentWaveNumber = this.gameStateService.gameState.currentWaveNumber;
  }

  /**
   * Place a tower on a cell (delegates to TowerService)
   * @param {Cell} cell
   * @param {string} towerTypeId - Tower type ID from registry (default: 'basic')
   * @returns {boolean} - True if tower was placed successfully
   */
  placeTower(cell, towerTypeId = "basic") {
    return this.towerService.placeTower(cell, towerTypeId);
  }

  /**
   * Place N towers randomly on empty cells (delegates to TowerService)
   * @param {number} count
   * @returns {Array<Cell>} - Array of cells where towers were placed
   */
  placeRandomTowers(count) {
    return this.towerService.placeRandomTowers(this.gridModel, count);
  }

  /**
   * Validate tower move (delegates to TowerService)
   * @param {Tower} tower
   * @param {Cell} fromCell
   * @param {Cell} toCell
   * @returns {boolean} - True if move is allowed
   */
  moveTower(tower, fromCell, toCell) {
    return this.towerService.validateMove(tower, fromCell, toCell);
  }

  /**
   * Handle enemy reached end of path (delegates to GameStateService)
   * @param {Enemy} enemy
   * @returns {void}
   */
  handleEnemyReachedEnd(enemy) {
    this.gameStateService.handleEnemyReachedEnd(enemy);
  }

  /**
   * Create and fire missile from tower to target (delegates to CombatService)
   * @param {Tower} tower - Firing tower
   * @param {number} startX - Start X position
   * @param {number} startY - Start Y position
   * @param {number} targetX - Target X position
   * @param {number} targetY - Target Y position
   * @param {Object} missileBlueprint - Full missile blueprint (config + visualFx)
   * @returns {Missile}
   */
  createMissile(tower, startX, startY, targetX, targetY, missileBlueprint) {
    return this.combatService.createMissile(
      tower,
      startX,
      startY,
      targetX,
      targetY,
      missileBlueprint,
    );
  }

  // NOTE: Damage application logic has been moved to CombatService.applyDamage()
  // to avoid duplication and centralize combat rules (falloff, crits, tracking).
  // The Game no longer implements applyDamage directly.

  /**
   * Update game logic
   * @param {number} deltaTime - in seconds
   * @returns {void}
   */
  update(deltaTime) {
    if (this.state !== GameState.RUNNING) {
      return;
    }

    // Update wave spawning
    this.waveManager.update(deltaTime);

    // Update all entities
    this.entityManager.update(deltaTime);

    // Check wave completion and start next
    // (This could be event-driven instead)
  }

  /**
   * Render game (called every frame)
   * @param {number} deltaTime - in seconds
   * @returns {void}
   */
  render(deltaTime) {
    // Update and render effects (clears canvas)
    this.canvasView.updateAndRenderEffects(deltaTime);

    // Render game entities
    const entities = this.entityManager.getEntities();

    // Debug: log entity types once
    if (!this._loggedEntities && entities.length > 0) {
      const types = entities.map((e) => e.getType());
      this.debug.info("Rendering entities:", { count: entities.length, types });
      this._loggedEntities = true;
    }

    this.canvasView.renderEntities(entities, deltaTime);

    // Update gold display in header
    this.updateGoldDisplay();
  }

  /**
   * Update gold display in header
   * @returns {void}
   */
  updateGoldDisplay() {
    const activePlayer = this.playerManager.getActivePlayer();
    if (activePlayer) {
      const goldElement = document.getElementById("gold-amount");
      if (goldElement) {
        goldElement.textContent = activePlayer.wallet.get("money");
      }
    }
  }

  /**
   * Get current game state
   * @returns {GameState}
   */
  getState() {
    return this.state;
  }

  /**
   * Check if game is running
   * @returns {boolean}
   */
  isRunning() {
    return this.state === GameState.RUNNING;
  }

  /**
   * Destroy game and cleanup all resources
   * @returns {void}
   */
  destroy() {
    this.debug.info("🧹 Destroying Game...");

    // 1. Stop game clock
    if (this.gameClock) {
      this.gameClock.stop();
    }

    // 2. Remove event listeners
    const container = document.getElementById("grid-container");
    if (container) {
      if (this.boundHandleCellClick) {
        container.removeEventListener("click", this.boundHandleCellClick);
        container.removeEventListener("contextmenu", this.boundHandleCellClick);
      }
      if (this.boundHandleCellHover) {
        container.removeEventListener("mousemove", this.boundHandleCellHover);
      }
      if (this.boundHandleCellLeave) {
        container.removeEventListener("mouseleave", this.boundHandleCellLeave);
      }
    }

    const playerInfoBtn = document.getElementById("player-info-btn");
    if (playerInfoBtn && this.boundHandlePlayerInfoClick) {
      playerInfoBtn.removeEventListener(
        "click",
        this.boundHandlePlayerInfoClick,
      );
    }

    // Unregister game-scoped event handlers
    if (this.boundOnTowerPlaced) {
      this.events.off('towerPlaced', this.boundOnTowerPlaced);
    }

    // Clear bound references
    this.boundHandleCellClick = null;
    this.boundHandleCellHover = null;
    this.boundHandleCellLeave = null;
    this.boundHandlePlayerInfoClick = null;
    this.boundOnTowerPlaced = null;

    // 3. Destroy owned instances
    if (this.gridSystem?.destroy) {
      this.gridSystem.destroy();
    }

    if (this.canvasView?.destroy) {
      this.canvasView.destroy();
    }

    if (this.towerRangeView?.destroy) {
      this.towerRangeView.destroy();
    }

    if (this.towerDragHandler?.destroy) {
      this.towerDragHandler.destroy();
    }

    if (this.towerStatsPopup?.destroy) {
      this.towerStatsPopup.destroy();
    }

    if (this.playerInfoPopup?.destroy) {
      this.playerInfoPopup.destroy();
    }

    if (this.debugPanel?.destroy) {
      this.debugPanel.destroy();
    }

    if (this.towerShopToolbar?.destroy) {
      this.towerShopToolbar.destroy();
    }

    // 4. Null out references
    this.gameClock = null;
    this.entityManager = null;
    this.playerManager = null;
    this.waveManager = null;
    this.gridSystem = null;
    this.gridModel = null;
    this.canvasView = null;
    this.towerRangeView = null;
    this.towerDragHandler = null;
    this.towerStatsPopup = null;
    this.playerInfoPopup = null;
    this.debugPanel = null;
    this.coordSystem = null;
    this.container = null;

    this.debug.success("✅ Game destroyed");
  }

  /**
   * Serialize game state to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      state: this.state,
      currentWaveNumber: this.currentWaveNumber,
      globalScore: this.globalScore,
      config: this.config,
      players: this.playerManager.players.map((p) => ({
        id: p.id,
        name: p.name,
        wallet: p.wallet.toJSON(),
        lives: p.lives,
        score: p.score,
        stats: p.stats,
      })),
    };
  }
}
