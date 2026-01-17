/**
 * Reward service
 * Handles enemy kill rewards (gold, score, stats)
 */
export class RewardService {
  /**
   * @type {DIContainer}
   */
  container;

  /**
   * @type {Debug}
   */
  debug;

  /**
   * @type {PlayerManager}
   */
  playerManager;

  /**
   * @type {Object} - Event handler
   */
  events;

  /**
   * @type {Object} - Reference to game state (for globalScore)
   */
  gameState;

  /**
   * @param {DIContainer} container
   * @param {PlayerManager} playerManager
   * @param {Object} events - Event handler
   * @param {Object} gameState - Game state object with globalScore
   */
  constructor(container, playerManager, events, gameState) {
    this.container = container;
    this.debug = container.createDebug("RewardService", true);
    this.playerManager = playerManager;
    this.events = events;
    this.gameState = gameState;
  }

  /**
   * Handle enemy killed event
   * @param {Enemy} enemy
   * @param {Tower} killer - Tower that killed the enemy
   * @returns {void}
   */
  handleEnemyKilled(enemy, killer) {
    // Find tower owner
    const owner = this.playerManager.players.find(
      (p) => p.id === killer.playerId,
    );

    if (!owner) {
      this.debug.warning("Enemy killed but no owner found for tower", {
        towerId: killer.id,
        playerId: killer.playerId,
      });
      return;
    }

    // Award gold
    owner.wallet.add("money", enemy.attributes.goldReward);

    // Update stats
    owner.stats.enemiesKilled++;
    owner.score += enemy.attributes.goldReward;

    // Update global score
    this.gameState.globalScore += enemy.attributes.goldReward;

    // Emit sourceable event (BUSINESS EVENT for Event Sourcing)
    this.events.emit("enemyKilled", {
      sourceable: true,
      metadata: {
        enemyId: enemy.id,
        enemyType: enemy.attributes.type || "basic",
        killerId: killer.id,
        killerType: killer.attributes?.type || "unknown",
        playerId: owner.id,
        goldReward: enemy.attributes.goldReward,
        position: { x: enemy.x, y: enemy.y },
        timestamp: Date.now(),
      },
    });

    this.debug.success(
      `💰 ${owner.name} earned ${enemy.attributes.goldReward} gold`,
      {
        total: owner.wallet.get("money"),
        kills: owner.stats.enemiesKilled,
      },
    );
  }
}
