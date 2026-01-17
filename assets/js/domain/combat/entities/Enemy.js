import { Entity } from "../../shared/Entity.js";
import { EnemyAttributes } from "../value-objects/EnemyAttributes.js";
import { AttributesProxy } from "../../shared/AttributesProxy.js";
import {
  EnemyHitEvent,
  EnemyDeathEvent,
  EnemyReachedEndEvent,
} from "../../../events/EnemyEvent.js";
import { EventBus } from "../../../services/core/EventBus.js";

/**
 * Enemy - Enemy entity that follows paths
 * Represents hostile units that towers shoot at
 *
 * Domain Entity (Combat Bounded Context)
 */
export class Enemy extends Entity {
  /**
   * @type {string}
   */
  color;

  /**
   * @type {string}
   */
  enemyType;

  /**
   * @type {number}
   */
  size;

  /**
   * @type {EnemyAttributes} - Base attributes (internal storage)
   * @private
   */
  _attributes;

  /**
   * @type {AttributesProxy} - Proxy for attribute access with modifiers
   * @private
   */
  _attributesProxy;

  /**
   * @type {Tower|null} - Tower that killed this enemy (set when taking damage)
   */
  killer = null;

  /**
   * @type {Path|null}
   */
  path = null;

  /**
   * @type {number}
   */
  currentPathIndex = 0;

  /**
   * @type {boolean}
   */
  reachedEnd = false;

  /**
   * @type {HTMLElement|null}
   */
  domElement = null;

  /**
   * @type {Object} EventBus handler
   */
  events;

  /**
   * @param {number} x - Position X
   * @param {number} y - Position Y
   */
  constructor(x, y) {
    super("enemy", x, y);

    this.enemyType = "basic";
    this.color = "#dc2626"; // Red for enemies
    this.size = 10;
    this._attributes = new EnemyAttributes(100, 100, 1.0, 100);
    this._attributesProxy = new AttributesProxy(this._attributes, this);
    this.events = EventBus.createHandler(this);
    this.coordSystem = null; // Will be set when added to path
  }

  /**
   * Get attributes with modifiers applied
   * @returns {AttributesProxy}
   */
  get attributes() {
    return this._attributesProxy;
  }

  /**
   * Take damage from missile
   * @param {number} amount
   * @param {Tower|null} attacker - Tower that dealt damage (optional)
   * @returns {void}
   */
  takeDamage(amount, attacker = null) {
    const previousHealth = this.attributes.health;
    this.attributes.health -= amount;

    // Store killer if this attack will kill
    if (this.attributes.health <= 0 && attacker) {
      this.killer = attacker;
    }

    // Trigger hit event with typed Event
    const event = new EnemyHitEvent(
      this,
      amount,
      previousHealth,
      this.attributes.health,
    );
    this.events.emit("hit", event);

    if (this.attributes.health <= 0) {
      this.attributes.health = 0;
      this.kill();
    }
  }

  /**
   * Check if enemy is dead
   * @returns {boolean}
   */
  isDead() {
    return this.attributes.health <= 0 || !this.alive;
  }

  /**
   * Mark entity as dead for cleanup
   * @returns {void}
   */
  kill() {
    // Trigger death event before killing with typed Event
    const event = new EnemyDeathEvent(
      this,
      { x: this.x, y: this.y },
      this.killer,
    );
    this.events.emit('ennemy:death', event);

    super.kill();
  }

  /**
   * Update enemy movement along path
   * @param {number} deltaTime - in seconds
   * @returns {void}
   */
  update(deltaTime) {
    if (!this.path || this.reachedEnd) {
      return;
    }

    this.moveAlongPath(deltaTime);
  }

  /**
   * Move enemy along the path
   * @param {number} deltaTime - in seconds
   * @returns {void}
   */
  moveAlongPath(deltaTime) {
    const currentElement = this.path.getElementAt(this.currentPathIndex);

    if (!currentElement) {
      console.warn(
        `Enemy ${this.id}: currentElement is null at index ${this.currentPathIndex}/${this.path.getLength()}`,
      );
      // Retour au début du path
      this.currentPathIndex = 0;
      return;
    }

    const nextElement = this.path.getNextElement(currentElement);

    if (!nextElement) {
      console.log(`Enemy ${this.id}: Fin du path, retour au début`);
      // Fin du path atteinte, retour au début (comportement en boucle)
      this.currentPathIndex = 0;
      return;
    }

    // Get target position (use getBoundingClientRect for absolute viewport coords)
    if (!nextElement.cell || !nextElement.cell.element) {
      console.error(
        `Enemy ${this.id}: nextElement.cell ou nextElement.cell.element est null!`,
        nextElement,
      );
      this.currentPathIndex = 0;
      return;
    }

    const rect = nextElement.cell.element.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;
    // Calculate direction
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if reached next waypoint
    if (distance < 2) {
      this.currentPathIndex++;
      // Si on dépasse la fin, retour au début
      if (this.currentPathIndex >= this.path.getLength()) {
        this.currentPathIndex = 0;
      }
      return;
    }

    // Move toward target
    // Convert logical speed (cells/sec) to pixels/sec
    const speedPixels = this.coordSystem
      ? this.coordSystem.cellsToPixels(this.attributes.speed)
      : this.attributes.speed;
    const moveDistance = speedPixels * deltaTime;

    if (moveDistance >= distance) {
      // Reach target this frame
      this.x = targetX;
      this.y = targetY;
      this.currentPathIndex++;
      // Si on dépasse la fin, retour au début
      if (this.currentPathIndex >= this.path.getLength()) {
        this.currentPathIndex = 0;
      }
    } else {
      // Move partial distance
      this.x += (dx / distance) * moveDistance;
      this.y += (dy / distance) * moveDistance;
    }
  }

  /**
   * Called when enemy reaches end of path
   * @returns {void}
   */
  onReachEnd() {
    // Trigger reachedEnd event with typed Event
    const event = new EnemyReachedEndEvent(this, { x: this.x, y: this.y });
    this.events.emit("reachedEnd", event);

    // Enemy escaped - could deal damage to player base
    // For now, we don't kill the enemy, it loops back
  }
}
