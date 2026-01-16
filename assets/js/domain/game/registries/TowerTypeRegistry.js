/**
 * TowerTypeRegistry - Centralized registry of tower type blueprints
 * Defines all tower types with their stats, costs, missile types, and visual FX
 */

/**
 * @type {Object} - Tower type blueprints
 */
export const towerTypes = {
    'basic': {
        id: 'basic',
        name: 'Basic Tower',
        description: 'Standard defensive tower with balanced stats',
        cost: 100,
        stats: {
            range: 3.5,         // cells
            fireRate: 1.0,      // shots per second (cooldown = 1/fireRate)
            critChance: 0.0,    // 0.0 to 1.0
            critMultiplier: 1.5
        },
        missileTypeId: 'standard',
        visualFx: {
            sprite: {
                type: 'diamond',
                rotationSpeed: 1.5
            },
            color: '#6366f1',   // Blue
            size: 8
        }
    },
    'sniper': {
        id: 'sniper',
        name: 'Sniper Tower',
        description: 'Long range tower with slow fire rate',
        cost: 200,
        stats: {
            range: 6.0,         // Double range
            fireRate: 0.5,      // Slow fire rate (2 sec cooldown)
            critChance: 0.15,   // 15% crit chance
            critMultiplier: 2.0 // Higher crit damage
        },
        missileTypeId: 'standard',
        visualFx: {
            sprite: {
                type: 'triangle',
                rotationSpeed: 0.5  // Slow rotation
            },
            color: '#8b5cf6',   // Purple
            size: 10
        }
    },
    'artillery': {
        id: 'artillery',
        name: 'Artillery Tower',
        description: 'Heavy tower with powerful explosive missiles',
        cost: 300,
        stats: {
            range: 4.0,
            fireRate: 0.33,     // Very slow (3 sec cooldown)
            critChance: 0.05,
            critMultiplier: 1.5
        },
        missileTypeId: 'heavy',
        visualFx: {
            sprite: {
                type: 'square',
                rotationSpeed: 1.0
            },
            color: '#ef4444',   // Red
            size: 12
        }
    }
};

/**
 * Get tower type blueprint by ID
 * @param {string} typeId 
 * @returns {Object|null}
 */
export function getTowerType(typeId) {
    return towerTypes[typeId] || null;
}

/**
 * Get all tower types
 * @returns {Object}
 */
export function getAllTowerTypes() {
    return towerTypes;
}
