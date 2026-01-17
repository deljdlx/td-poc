

import { EventBus } from "../../services/core/EventBus.js";
import { TowerMovedEvent } from "../../events/TowerEvent.js";


export class EventListenersConfiguration {

  /**
   * @type {Game}
   */

  game;

  constructor(game) {
    this.game = game;
  }

  init() {
    // COMMAND: Tower move attempt → Validate and execute move
    EventBus.onGlobal("tower:moveAttempt", (event) => {
      this.handleTowerMoveAttempt(event);
    });

    // Tower shoot → Create missile
    EventBus.onGlobal("shoot", (data) => {
      this.game.createMissile(
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
      this.game.debug.info("💥 Missile impact", {
        x: event.x,
        y: event.y,
        splashRadius: event.splashRadius,
        explosionType: event.visualFx?.explosion?.type,
      });

      this.handleExplosion(event);
      // Combat logic: delegate splash damage to CombatService
      this.game.combatService.applyDamage(event.missile, event.x, event.y);

    });

    EventBus.onGlobal("enemySpawned", (event) => {
      this.handleEnnemySpawned(event);
    });

    EventBus.onGlobal("death", (deathEvent) => {
      const enemy = deathEvent.enemy;
      this.game.debug.event(
        `💀 Enemy ${enemy.id} died at (${deathEvent.position.x}, ${deathEvent.position.y})`,
      );

      

      // Business logic: award gold and update stats
      if (deathEvent.killer) {
        this.game.rewardService.handleEnemyKilled(enemy, deathEvent.killer);
      } else {
        this.game.debug.info(`Enemy ${enemy.id} died from non-combat cause`);
      }

      // Visual effects handled by DOMEnemyRenderer
    });


    this.game.debug.success("✅ Game event listeners configured");
  }


  handleTowerMoveAttempt(event) {
      const { tower, fromCell, toCell } = event;

      // Validate move (business logic)
      const isValid = this.game.moveTower(tower, fromCell, toCell);

      if (isValid) {
        // Update data layer (emits cell:towerChanged events)
        fromCell.removeTower();
        toCell.setTower(tower);

        // Synchronize tower position for canvas rendering
        tower.cell = toCell;
        const center = this.game.coordSystem.getElementCenter(toCell.element);
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
        this.game.events.emit("moved", movedEvent);

        // Emit DOMAIN EVENT for UI layer to react
        EventBus.emitGlobal("tower:moved", {
          tower,
          fromCell,
          toCell,
        });

        this.game.debug.success("Tower moved", {
          from: { row: fromCell.row, col: fromCell.col },
          to: { row: toCell.row, col: toCell.col },
        });
      }
  }

  handleEnnemySpawned(event) {
    const enemy = event.enemy;
    // Enemy death → Handle rewards (gold, score) and visual effects
    //enemy.events.on("death", (deathEvent) => {

    // Enemy reached end → Game over logic
    enemy.events.on("reachedEnd", (endEvent) => {
      this.game.handleEnemyReachedEnd(enemy);
    });
  }

  handleExplosion(event) {    // Placeholder for explosion handling logic

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
        this.game.canvasView.addFirework(event.x, event.y, fireworkParams);
        break;
      case "simple":
        this.game.canvasView.addSimpleExplosion(event.x, event.y, explosionConfig);
        break;
      case "none":
        // No explosion effect
        break;
      default:
        // Default to firework
        const { type: _, ...defaultParams } = explosionConfig;
        this.game.canvasView.addFirework(event.x, event.y, defaultParams);
    }

    // Always show splash zone
    this.game.canvasView.addSplashEffect(event.x, event.y, event.splashRadius);

  }
}