/**
 * MissileTypeRegistry - Centralized registry of missile type blueprints
 * Defines all missile types with their stats, effects, and visual FX
 */

/**
 * @type {Object} - Missile type blueprints
 */
export const missileTypes = {
    'standard': {
        id: 'standard',
        name: 'Standard Missile',
        damage: 25,
        splashRadius: 0.5,  // in cells
        speed: 4.0,         // cells/sec (business logic)
        lifetime: 3.0,      // seconds
        effects: {
            // Gameplay effects on impact (future: stun, knockback, slow, etc.)
            onImpact: []
        },
        visualFx: {
            // Visual effects (future: trail color, explosion type, particle effects, etc.)
            trail: {
                color: '#ff0',
                width: 1,
                length: 10  // Number of trail points
            },
            explosion: {
                type: 'firework',
                scale: 1.0
            }
        }
    },
    'heavy': {
        id: 'heavy',
        name: 'Heavy Missile',
        damage: 50,
        splashRadius: 1.0,  // in cells (plus large)
        speed: 2.0,         // cells/sec (plus lent)
        lifetime: 4.0,      // seconds (vit plus longtemps)
        effects: {
            onImpact: []
        },
        visualFx: {
            trail: {
                color: '#0f0',  // Vert fluo
                width: 8,       // Trail épais
                length: 25      // Trail longue pour missile lourd
            },
            explosion: {
                type: 'simple',  // Explosion simple au lieu de firework
                scale: 2.0       // Plus grosse
            }
        }
    }
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
