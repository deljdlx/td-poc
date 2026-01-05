/**
 * Effet feu d'artifice avec particules qui montent
 * FX autonome avec micro-physique
 */
class FireworkEffect {
    /** @type {number} */
    x = 0;
    
    /** @type {number} */
    y = 0;
    
    /** @type {Array<Object>} */
    particles = [];
    
    /** @type {number} */
    age = 0;
    
    /** @type {number} */
    maxAge = 2.0; // 2 secondes
    
    /** @type {boolean} */
    isDead = false;
    
    /**
     * @param {number} x - Position X
     * @param {number} y - Position Y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.createParticles();
    }
    
    /**
     * Crée les particules du feu d'artifice
     * @returns {void}
     */
    createParticles() {
        const particleCount = 30;
        const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#f0abfc'];
        
        for (let i = 0; i < particleCount; i++) {
            // Angle avec biais vers le haut (-90° = haut, dispersion ±60°)
            const baseAngle = -Math.PI / 2; // -90° (vers le haut)
            const spread = (Math.random() - 0.5) * Math.PI * 0.8; // ±72°
            const angle = baseAngle + spread;
            
            // Vitesse variable
            const speed = 100 + Math.random() * 150; // pixels/seconde
            
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 3,
                life: 1.0,
                decay: 0.3 + Math.random() * 0.4, // Vitesse de disparition
                color: colors[Math.floor(Math.random() * colors.length)],
                trail: [] // Pour l'effet de traînée
            });
        }
    }
    
    /**
     * Met à jour l'effet
     * @param {number} deltaTime - Temps écoulé en secondes
     * @returns {void}
     */
    update(deltaTime) {
        this.age += deltaTime;
        
        if (this.age >= this.maxAge) {
            this.isDead = true;
            return;
        }
        
        const gravity = 300; // pixels/s²
        
        this.particles.forEach(particle => {
            // Physique
            particle.vy += gravity * deltaTime; // Gravité
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            // Friction de l'air (ralentit progressivement)
            particle.vx *= (1 - 0.5 * deltaTime);
            
            // Disparition progressive
            particle.life -= particle.decay * deltaTime;
            
            // Trail (garder les dernières positions)
            particle.trail.push({ x: particle.x, y: particle.y, life: particle.life });
            if (particle.trail.length > 5) {
                particle.trail.shift();
            }
        });
    }
    
    /**
     * Dessine l'effet sur le canvas
     * @param {CanvasRenderingContext2D} ctx
     * @returns {void}
     */
    draw(ctx) {
        this.particles.forEach(particle => {
            if (particle.life <= 0) return;
            
            ctx.save();
            
            // Dessiner la traînée
            if (particle.trail.length > 1) {
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = 1;
                ctx.globalAlpha = particle.life * 0.3;
                
                ctx.beginPath();
                ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
                for (let i = 1; i < particle.trail.length; i++) {
                    ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
                }
                ctx.stroke();
            }
            
            // Dessiner la particule
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = particle.color;
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Point brillant au centre
            ctx.globalAlpha = particle.life * 0.8;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
}
