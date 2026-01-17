/**
 * MissileTypeRegistry - Centralized registry of missile type blueprints
 * Defines all missile types with their stats, effects, and visual FX
 */

/**
 * @type {Object} - Missile type blueprints
 */
export const missileTypes = {
  standard: {
    id: "standard",
    name: "Standard Missile",
    damage: 25,
    splashRadius: 0.5, // in cells
    speed: 10.0, // cells/sec (business logic)
    lifetime: 3.0, // seconds
    effects: {
      // Gameplay effects on impact (future: stun, knockback, slow, etc.)
      onImpact: [],
    },
    visualFx: {
      // Visual effects (future: trail color, explosion type, particle effects, etc.)
      sprite: {
        type: "star", // star, circle, diamond, square, triangle
        spikes: 6, // For star: number of spikes
        rotationSpeed: 3, // Rotation speed (rad/sec)
      },
      trail: {
        color: "#ff0",
        width: 1,
        length: 10, // Number of trail points
      },
      explosion: {
        type: "firework",
        particleCount: 20,
        power: 120,
        spread: 60,
        gravity: 300,
        particleSize: { min: 2, max: 5 },
        lifetime: { min: 1.0, max: 1.5 },
      },
    },
  },
  heavy: {
    id: "heavy",
    name: "Heavy Missile",
    damage: 50,
    splashRadius: 1.0, // in cells (plus large)
    speed: 2.0, // cells/sec (plus lent)
    lifetime: 4.0, // seconds (vit plus longtemps)
    effects: {
      onImpact: [],
    },
    visualFx: {
      sprite: {
        type: "diamond", // Massif et imposant
        rotationSpeed: 0.5, // Rotation lente pour missile lourd
      },
      trail: {
        color: "#0f0", // Vert fluo
        width: 8, // Trail épais
        length: 25, // Trail longue pour missile lourd
      },
      explosion: {
        type: "firework",
        particleCount: 80, // Beaucoup plus de particules
        power: 250, // Explosion puissante
        spread: 120, // Large dispersion
        gravity: 150, // Gravité plus faible = particules montent plus
        particleSize: { min: 5, max: 12 }, // Grosses particules
        lifetime: { min: 2.0, max: 3.5 }, // Longue durée
      },
    },
  },
};

/**
 * Get missile type blueprint by ID
 * @param {string} typeId
 * @returns {Object|null}
 */
export function getMissileType(typeId) {
  return missileTypes[typeId] || null;
}

/**
 * Get all missile types
 * @returns {Object}
 */
export function getAllMissileTypes() {
  return missileTypes;
}
