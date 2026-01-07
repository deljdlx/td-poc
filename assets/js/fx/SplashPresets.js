/**
 * SplashPresets - Predefined configurations for different splash zone effects
 */
export const SplashPresets = {
    /**
     * Simple basic splash indicator
     */
    BASIC: {
        duration: 0.4,
        ringCount: 1,
        ringOpacity: 0.6,
        ringWidth: 2,
        flashIntensity: 0.3,
        zoneOpacity: 0.2
    },
    
    /**
     * Intense multi-ring splash (current implementation)
     */
    INTENSE: {
        duration: 0.8,
        ringCount: 4,
        rings: [
            { delay: 0, speed: 1.2 },
            { delay: 0.08, speed: 1.0 },
            { delay: 0.16, speed: 0.85 },
            { delay: 0.24, speed: 0.7 }
        ],
        ringOpacity: 1.0,
        ringWidth: 6,
        flashIntensity: 1.0,
        zoneOpacity: 0.35
    },
    
    /**
     * Medium splash for important hits
     */
    MEDIUM: {
        duration: 0.5,
        ringCount: 2,
        rings: [
            { delay: 0, speed: 1.2 },
            { delay: 0.1, speed: 1.0 }
        ],
        ringOpacity: 0.8,
        ringWidth: 3,
        flashIntensity: 0.6,
        zoneOpacity: 0.25
    },
    
    /**
     * AOE splash for area damage
     */
    AOE: {
        duration: 0.6,
        ringCount: 3,
        rings: [
            { delay: 0, speed: 1.0 },
            { delay: 0.1, speed: 0.9 },
            { delay: 0.2, speed: 0.8 }
        ],
        ringOpacity: 0.7,
        ringWidth: 4,
        flashIntensity: 0.5,
        zoneOpacity: 0.3
    }
};
