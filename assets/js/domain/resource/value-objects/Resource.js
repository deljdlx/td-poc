/**
 * Resource - Defines a resource type (metadata/definition)
 * Resources are things players can collect and spend (gold, mana, wood, etc.)
 */
export class Resource {
  /**
   * @type {string}
   */
  type;

  /**
   * @type {string}
   */
  name;

  /**
   * @type {string}
   */
  icon;

  /**
   * @type {number|null}
   */
  maxCapacity;

  /**
   * @type {boolean}
   */
  tradeable;

  /**
   * @type {string}
   */
  description;

  /**
   * @param {string} type - Unique resource type identifier (e.g., 'money', 'mana')
   * @param {string} name - Display name (e.g., 'Gold', 'Mana')
   * @param {string} [icon=''] - Icon/emoji for display
   * @param {Object} [options={}] - Additional options
   * @param {number} [options.maxCapacity=null] - Maximum capacity (null = unlimited)
   * @param {boolean} [options.tradeable=true] - Can be traded/transferred
   * @param {string} [options.description=''] - Description text
   */
  constructor(type, name, icon = "", options = {}) {
    this.type = type;
    this.name = name;
    this.icon = icon;
    this.maxCapacity = options.maxCapacity || null;
    this.tradeable = options.tradeable !== undefined ? options.tradeable : true;
    this.description = options.description || "";
  }

  /**
   * Check if amount exceeds max capacity
   * @param {number} amount
   * @returns {boolean}
   */
  exceedsCapacity(amount) {
    if (this.maxCapacity === null) {
      return false;
    }
    return amount > this.maxCapacity;
  }

  /**
   * Get display string with icon
   * @returns {string}
   */
  getDisplayName() {
    return this.icon ? `${this.icon} ${this.name}` : this.name;
  }
}
