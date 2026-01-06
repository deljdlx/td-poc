import { CircleParticle } from './particles/CircleParticle.js';
import { SquareParticle } from './particles/SquareParticle.js';
import { StarParticle } from './particles/StarParticle.js';
import { TriangleParticle } from './particles/TriangleParticle.js';
import { DiamondParticle } from './particles/DiamondParticle.js';

/**
 * FireworkEffect - Autonomous particle effect system
 * Manages particle lifecycle, physics, and rendering
 * Accepts injected particle instances for flexible visual effects
 */
export class FireworkEffect {
    /** @type {number} */
    x;

    /** @type {number} */
    y;

    /** @type {Array<Particle>} */
    particles;
    
    /** @type {number} */
    life;
    
    /** @type {number} */
    maxLife;
    
    /** @type {number} */
    gravity;
    
    /** @type {number} */
    friction;
    
    /** @type {number} */
    power;
    
    /** @type {number} */
    spread;
    
    /** @type {number} */
    angle;
    
    /** @type {number} */
    particleCount;
    
    /** @type {Object} */
    particleSize;
    
    /** @type {Object} */
    particleLifetime;
    
    /**
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {Object|Array<Particle>} particlesOrConfig - Particle instances OR configuration object
     * @param {number} particlesOrConfig.power - Particle initial speed (default: 150)
     * @param {number} particlesOrConfig.spread - Dispersion angle in degrees (default: 72)
     * @param {number} particlesOrConfig.angle - Main direction in degrees (default: -90 = up)
     * @param {number} particlesOrConfig.gravity - Gravity force (default: 300)
     * @param {number} particlesOrConfig.friction - Air friction (default: 0.98)
     * @param {number} particlesOrConfig.particleCount - Number of particles (default: 30)
     * @param {Object} particlesOrConfig.particleSize - {min, max} particle size (default: {min: 3, max: 7})
     * @param {Object} particlesOrConfig.lifetime - {min, max} particle lifetime (default: {min: 1.5, max: 2.0})
     * @param {Array<Particle>} particlesOrConfig.particles - Pre-created particle instances
     */
    constructor(x, y, particlesOrConfig = null) {
        this.x = x;
        this.y = y;
        this.particles = [];
        
        // Default configuration
        const defaults = {
            power: 150,
            spread: 72,
            angle: -90,
            gravity: 300,
            friction: 0.98,
            particleCount: 30,
            particleSize: { min: 3, max: 7 },
            lifetime: { min: 1.5, max: 2.0 },
            particles: null
        };
        
        // Merge with provided config
        let config = defaults;
        if (particlesOrConfig) {
            if (Array.isArray(particlesOrConfig)) {
                // Legacy: array of particles passed directly
                config.particles = particlesOrConfig;
            } else {
                // Configuration object
                config = { ...defaults, ...particlesOrConfig };
            }
        }
        
        // Store configuration
        this.power = config.power;
        this.spread = config.spread;
        this.angle = config.angle;
        this.gravity = config.gravity;
        this.friction = config.friction;
        this.particleCount = config.particleCount;
        this.particleSize = config.particleSize;
        this.particleLifetime = config.lifetime;
        
        this.life = config.lifetime.max;
        this.maxLife = config.lifetime.max;
        
        if (config.particles && config.particles.length > 0) {
            this.particles = config.particles;
        } else {
            this.createDefaultParticles();
        }
    }
    
    /**
     * Create default particle mix (circles, squares, stars, triangles, diamonds)
     * Uses configuration parameters for power, spread, angle, etc.
     */
    createDefaultParticles() {
        const colors = [
            '#ff6b6b',
            '#4ecdc4',
            '#45b7d1',
            '#f9ca24',
            '#f0932b',
            '#eb4d4b',
            '#6c5ce7',
            '#a29bfe',
            '#fd79a8',
            '#fdcb6e'
        ];
        
        const particleTypes = [
            CircleParticle,
            SquareParticle,
            StarParticle,
            TriangleParticle,
            DiamondParticle
        ];
        
        // Convert angles to radians
        const baseAngle = this.angle * (Math.PI / 180);
        const spreadAngle = this.spread * (Math.PI / 180);
        
        for (let i = 0; i < this.particleCount; i++) {
            // Calculate particle angle with spread
            const angle = baseAngle + (Math.random() - 0.5) * spreadAngle;
            
            // Random speed based on power (±50% variation)
            const speedVariation = 0.5 + Math.random();
            const speed = this.power * speedVariation;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = this.particleSize.min + Math.random() * (this.particleSize.max - this.particleSize.min);
            const maxLife = this.particleLifetime.min + Math.random() * (this.particleLifetime.max - this.particleLifetime.min);
            
            // Randomly select particle type
            const ParticleClass = particleTypes[Math.floor(Math.random() * particleTypes.length)];
            
            // Special handling for StarParticle (can have different spike counts)
            if (ParticleClass === StarParticle) {
                const spikes = 4 + Math.floor(Math.random() * 3); // 4, 5, or 6 spikes
                this.particles.push(new ParticleClass(this.x, this.y, vx, vy, color, size, maxLife, spikes));
            } else {
                this.particles.push(new ParticleClass(this.x, this.y, vx, vy, color, size, maxLife));
            }
        }
    }
    
    /**
     * Add a particle to the effect
     * @param {Particle} particle - Particle instance to add
     */
    addParticle(particle) {
        this.particles.push(particle);
    }
    
    /**
     * Update particle physics
     * Delegates physics to individual particles
     * @param {number} deltaTime - Time delta in seconds
     * @returns {boolean} - True if effect is still alive
     */
    update(deltaTime) {
        // Update global lifetime
        this.life -= deltaTime;
        
        // Update each particle (particles handle their own physics)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            const isAlive = particle.update(deltaTime, this.gravity, this.friction);
            
            // Remove dead particles
            if (!isAlive) {
                this.particles.splice(i, 1);
            }
        }
        
        // Effect dies when all particles are gone OR global lifetime expires
        return this.particles.length > 0 && this.life > 0;
    }
    
    /**
     * Draw all particles
     * Delegates rendering to individual particles
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        for (const particle of this.particles) {
            particle.draw(ctx);
        }
    }
}
