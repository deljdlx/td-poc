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
   * @type {TowerService}
   */
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

    // Initialize grid (render DOM elements)
    this.gridSystem.init();

    // Create perimeter path
    const perimeterPath = PathFactory.createPerimeter(
      this.gridModel,
      this.coordSystem,
      this.container,
    );
    this.gridModel.addPath(perimeterPath);
    this.debug.success("Perimeter path created");

    // Render paths in DOM
    this.gridSystem.renderPaths();

    // Setup tower drag handler to listen for tower placement (BEFORE placing towers!)
    this.events.on("towerPlaced", (event) => {
      this.towerDragHandler.enableTowerDrag(event.cell);
    });

    // Place initial towers for testing
    this.placeRandomTowers(5);
    this.debug.success("Initial towers placed");

    // Log tower drag handlers status
    const towersCount = this.gridModel.getCellsWithTowers().length;
    this.debug.info(`Drag enabled on ${towersCount} towers`);

    // Setup game event listeners for business logic
    this.setupGameEventListeners();

    // Setup GameClock callbacks
    this.setupGameClock();

    // Setup grid interaction events
    this.setupGridEvents();

    this.state = GameState.READY;
    this.debug.success("Game initialized - Ready to start");
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

    // COMMAND: Tower move attempt → Validate and execute move
    EventBus.onGlobal("tower:moveAttempt", (data) => {
      const { tower, fromCell, toCell } = data;

      // Validate move (business logic)
      const isValid = this.moveTower(tower, fromCell, toCell);

      if (isValid) {
        // Update data layer (emits cell:towerChanged events)
        fromCell.removeTower();
        toCell.setTower(tower);

        // Synchronize tower position for canvas rendering
        tower.cell = toCell;
        const center = this.coordSystem.getElementCenter(toCell.element);
        tower.x = center.x;
        tower.y = center.y;

        // Emit SOURCEABLE business event for Event Sourcing
        const movedEvent = new TowerMovedEvent(tower, fromCell, toCell, {
          towerId: tower.id,
          towerType: tower.type,
          playerId: tower.playerId || "player1",
          fromPosition: { row: fromCell.row, col: fromCell.col },
          toPosition: { row: toCell.row, col: toCell.col },
          timestamp: Date.now(),
        });
        this.events.emit("moved", movedEvent);

        // Emit DOMAIN EVENT for UI layer to react
        EventBus.emitGlobal("tower:moved", {
          tower,
          fromCell,
          toCell,
        });

        this.debug.success("Tower moved", {
          from: { row: fromCell.row, col: fromCell.col },
          to: { row: toCell.row, col: toCell.col },
        });
      }
    });

    // Tower shoot → Create missile
    EventBus.onGlobal("shoot", (data) => {
      this.createMissile(
        data.tower,
        data.x,
        data.y,
        data.targetX,
        data.targetY,
        data.missileBlueprint,
      );
    });

    // Missile impact → Visual effects + Combat logic
    EventBus.onGlobal("missile:impact", (event) => {
      this.debug.info("💥 Missile impact", {
        x: event.x,
        y: event.y,
        splashRadius: event.splashRadius,
        explosionType: event.visualFx?.explosion?.type,
      });

      // Visual effects based on blueprint configuration
      const explosionConfig = event.visualFx?.explosion || {
        type: "firework",
        scale: 1.0,
      };

      // Choose explosion effect based on type
      switch (explosionConfig.type) {
        case "firework":
          // Pass all firework parameters from blueprint
          const { type, ...fireworkParams } = explosionConfig;
          this.canvasView.addFirework(event.x, event.y, fireworkParams);
          break;
        case "simple":
          this.canvasView.addSimpleExplosion(event.x, event.y, explosionConfig);
          break;
        case "none":
          // No explosion effect
          break;
        default:
          // Default to firework
          const { type: _, ...defaultParams } = explosionConfig;
          this.canvasView.addFirework(event.x, event.y, defaultParams);
      }

      // Always show splash zone
      this.canvasView.addSplashEffect(event.x, event.y, event.splashRadius);

      // Combat logic: apply splash damage
      this.applyDamage(event.missile, event.x, event.y);
    });

    // Listen to enemy spawned events to setup per-enemy listeners
    this.events.on("enemySpawned", (event) => {
      const enemy = event.enemy;

      // Enemy death → Handle rewards (gold, score) and visual effects
      enemy.events.on("death", (deathEvent) => {
        this.debug.event(
          `💀 Enemy ${enemy.id} died at (${deathEvent.position.x}, ${deathEvent.position.y})`,
        );

        // Business logic: award gold and update stats
        if (deathEvent.killer) {
          this.handleEnemyKilled(enemy, deathEvent.killer);
        } else {
          this.debug.info(`Enemy ${enemy.id} died from non-combat cause`);
        }

        // Visual effects handled by DOMEnemyRenderer
      });

      // Enemy reached end → Game over logic
      enemy.events.on("reachedEnd", (endEvent) => {
        this.handleEnemyReachedEnd(enemy);
      });
    });

    this.debug.success("✅ Game event listeners configured");
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
      this.boundHandlePlayerInfoClick = () => {
        this.playerInfoPopup.show();
      };
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
   * Handle enemy killed event (delegates to RewardService)
   * @param {Enemy} enemy
   * @param {Tower} killer - Tower that killed the enemy
   * @returns {void}
   */
  handleEnemyKilled(enemy, killer) {
    this.rewardService.handleEnemyKilled(enemy, killer);
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

  /**
   * Apply damage to enemies in splash zone
   * @param {Missile} missile - Missile that exploded (contains tower + damage)
   * @param {number} impactX - Impact X position
   * @param {number} impactY - Impact Y position
   * @returns {void}
   * @private
   */
  applyDamage(missile, impactX, impactY) {
    const tower = missile.tower;
    const baseDamage = missile.attributes.damage;

    // Calculate splash radius from missile attributes
    const splashRadius =
      missile.attributes.splashRadius * this.coordSystem.getCellSize();

    const enemies = this.entityManager.getEntitiesByType("enemy");
    let hitCount = 0;

    this.debug.info(
      `💥 Checking ${enemies.length} enemies for splash damage at (${impactX.toFixed(0)}, ${impactY.toFixed(0)}) radius: ${splashRadius.toFixed(0)}px`,
    );

    enemies.forEach((enemy) => {
      const dx = enemy.x - impactX;
      const dy = enemy.y - impactY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if enemy is in splash zone
      if (distance <= splashRadius) {
        // Calculate critical hit using tower stats (tireur)
        const isCritical = Math.random() < tower.attributes.critChance;
        const finalDamage = isCritical
          ? Math.floor(baseDamage * tower.attributes.critMultiplier)
          : baseDamage;

        const wasAlive = enemy.alive;
        enemy.takeDamage(finalDamage, tower); // Pass tower as attacker
        hitCount++;

        // Track hit and damage
        tower.trackHit(finalDamage, isCritical);

        // Track kill if enemy died (business logic handled by event listener)
        if (wasAlive && !enemy.alive) {
          tower.trackKill();
          // handleEnemyKilled will be called by death event listener
        }

        if (isCritical) {
          this.debug.success(
            `💥 CRITICAL HIT! Enemy ${enemy.id} hit for ${finalDamage} damage (${tower.attributes.critMultiplier}x) - HP: ${enemy.attributes.health}/${enemy.attributes.maxHealth}`,
          );
        } else {
          this.debug.debug(
            `Enemy ${enemy.id} hit for ${finalDamage} damage - HP: ${enemy.attributes.health}/${enemy.attributes.maxHealth}`,
          );
        }
      }
    });

    if (hitCount > 0) {
      this.debug.success(
        `🎯 Missile hit ${hitCount} enemy(ies) in splash zone (radius: ${splashRadius}px)`,
      );
    } else {
      this.debug.warning("❌ Missile missed - no enemies in splash zone");
    }
  }

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

    // Clear bound references
    this.boundHandleCellClick = null;
    this.boundHandleCellHover = null;
    this.boundHandleCellLeave = null;
    this.boundHandlePlayerInfoClick = null;

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
