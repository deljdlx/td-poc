/**
 * ExplosionPresets - Predefined configurations for different explosion types
 */
export const ExplosionPresets = {
    /**
     * Simple explosion for basic missiles
     */
    BASIC: {
        type: 'simple',
        duration: 0.3,
        maxRadius: 15,
        color: '#ff6b6b'
    },
    
    /**
     * Medium firework explosion
     */
    FIREWORK_MEDIUM: {
        type: 'firework',
        power: 150,
        spread: 60,
        angle: -90,
        gravity: 250,
        friction: 0.96,
        particleCount: 30,
        particleSize: { min: 2, max: 6 },
        lifetime: { min: 1.0, max: 1.8 }
    },
    
    /**
     * Large spectacular firework explosion
     */
    FIREWORK_LARGE: {
        type: 'firework',
        power: 250,
        spread: 120,
        angle: -90,
        gravity: 300,
        friction: 0.97,
        particleCount: 50,
        particleSize: { min: 3, max: 8 },
        lifetime: { min: 1.2, max: 2.2 }
    },
    
    /**
     * Random firework (current implementation)
     */
    FIREWORK_RANDOM: {
        type: 'firework',
        power: () => 100 + Math.random() * 200,
        spread: () => 30 + Math.random() * 120,
        angle: () => -120 + Math.random() * 60,
        gravity: () => 200 + Math.random() * 200,
        friction: () => 0.95 + Math.random() * 0.04,
        particleCount: () => 20 + Math.floor(Math.random() * 40),
        particleSize: {
            min: () => 2 + Math.random() * 2,
            max: () => 5 + Math.random() * 5
        },
        lifetime: {
            min: () => 1.0 + Math.random() * 0.5,
            max: () => 1.5 + Math.random() * 1.0
        }
    },
    
    /**
     * Compact explosion for close-range weapons
     */
    COMPACT: {
        type: 'simple',
        duration: 0.2,
        maxRadius: 10,
        color: '#ffa500'
    },
    
    /**
     * Area of effect explosion
     */
    AOE: {
        type: 'simple',
        duration: 0.5,
        maxRadius: 40,
        color: '#ff4444'
    }
};
