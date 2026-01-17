import { Missile } from "../../combat/entities/Missile.js";

/**
 * Combat service
 * Handles missile creation and damage application
 */
export class CombatService {
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
   * @type {EntityManager}
   */
  entityManager;

  /**
   * @param {DIContainer} container
   * @param {CoordinateSystem} coordSystem
   * @param {EntityManager} entityManager
   */
  constructor(container, coordSystem, entityManager) {
    this.container = container;
    this.debug = container.createDebug("CombatService", true);
    this.coordSystem = coordSystem;
    this.entityManager = entityManager;
  }

  /**
   * Create and fire missile from tower to target
   * @param {Tower} tower - Firing tower
   * @param {number} startX - Start X position
   * @param {number} startY - Start Y position
   * @param {number} targetX - Target X position
   * @param {number} targetY - Target Y position
   * @param {Object} missileBlueprint - Full missile blueprint (config + visualFx)
   * @returns {Missile}
   */
  createMissile(tower, startX, startY, targetX, targetY, missileBlueprint) {
    const missile = new Missile(
      tower,
      startX,
      startY,
      targetX,
      targetY,
      missileBlueprint.speed,
      missileBlueprint.lifetime,
      missileBlueprint.splashRadius,
      missileBlueprint.damage,
      this.coordSystem,
      missileBlueprint.visualFx,
    );

    this.entityManager.addEntity(missile);
    this.debug.event("🚀 Missile created", {
      towerId: tower.id,
      target: { x: targetX.toFixed(0), y: targetY.toFixed(0) },
    });

    return missile;
  }

  /**
   * Apply damage to enemies in splash zone
   * @param {Missile} missile - Missile that exploded (contains tower + damage)
   * @param {number} impactX - Impact X position
   * @param {number} impactY - Impact Y position
   * @returns {void}
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
        // Calculate damage falloff based on distance
        const distanceRatio = distance / splashRadius;
        const falloffFactor = 1.0 - distanceRatio * 0.5; // 50% damage at edge

        // Roll for critical hit
        const isCrit = Math.random() < tower.attributes.critChance;
        const critMultiplier = isCrit ? tower.attributes.critMultiplier : 1.0;

        const finalDamage = Math.round(
          baseDamage * falloffFactor * critMultiplier,
        );

        const wasAlive = enemy.alive;
        enemy.takeDamage(finalDamage, tower);
        hitCount++;

        // Track hit & kill on the tower
        try {
          if (typeof tower.trackHit === 'function') {
            tower.trackHit(finalDamage, isCrit);
          }
          if (wasAlive && !enemy.alive && typeof tower.trackKill === 'function') {
            tower.trackKill();
          }
        } catch (err) {
          // Defensive: don't break combat loop if tracking fails
          this.debug.warning('Error tracking tower stats', { error: err });
        }

        // Debug messages
        if (isCrit) {
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
      this.debug.success(`🎯 Missile hit ${hitCount} enemy(ies) in splash zone (radius: ${splashRadius}px)`);
    } else {
      this.debug.info('❌ Missile missed - no enemies in splash zone');
    }
  }
}
