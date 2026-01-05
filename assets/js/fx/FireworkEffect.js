/**
 * FireworkEffect - Autonomous particle effect system
 * Manages particle lifecycle, physics, and rendering
 * Accepts injected particle instances for flexible visual effects
 */
class FireworkEffect {
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
    
    /**
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {Array<Particle>} particles - Optional array of particle instances
     */
    constructor(x, y, particles = null) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.life = 2.0; // 2 seconds lifetime
        this.maxLife = 2.0;
        this.gravity = 300; // pixels per second squared
        this.friction = 0.98; // air resistance
        
        if (particles && particles.length > 0) {
            this.particles = particles;
        } else {
            this.createDefaultParticles();
        }
    }
    
    /**
     * Create default particle mix (circles, squares, stars, triangles, diamonds)
     * Called when no particles are injected via constructor
     */
    createDefaultParticles() {
        const particleCount = 30;
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
        
        for (let i = 0; i < particleCount; i++) {
            // Angle biased upward: -90° ± 72° (range: -162° to -18°)
            const baseAngle = -Math.PI / 2; // -90° (straight up)
            const spreadAngle = Math.PI * 0.8; // ±72° spread
            const angle = baseAngle + (Math.random() - 0.5) * spreadAngle;
            
            // Random speed: 100-300 pixels per second
            const speed = 100 + Math.random() * 200;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 3 + Math.random() * 4;
            const maxLife = 1.5 + Math.random() * 0.5; // 1.5-2s lifetime
            
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
