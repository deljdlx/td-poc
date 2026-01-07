import { CSSVariables } from '../utils/CSSVariables.js';

/**
 * Renderer pour dessiner les paths sur le canvas
 */
export class PathRenderer {
    /**
     * @param {DIContainer} diContainer
     */
    constructor(diContainer) {
        this.debug = diContainer.createDebug('PathRenderer', true);
        this.zoneStyles = this._loadZoneStyles();
    }
    
    /**
     * Charge les styles depuis les variables CSS
     * @returns {Object} Map des styles par type de zone
     * @private
     */
    _loadZoneStyles() {
        const zones = ['normal', 'spawn', 'checkpoint', 'boss', 'slow', 'fast'];
        const styles = {};
        
        zones.forEach(zone => {
            styles[zone] = {
                color: CSSVariables.get(`--path-${zone}-color`),
                lineWidth: CSSVariables.getFloat(`--path-${zone}-width`),
                opacity: CSSVariables.getFloat(`--path-${zone}-opacity`)
            };
        });
        
        // Style pour les flèches
        styles.arrow = {
            color: CSSVariables.get('--path-arrow-color'),
            size: CSSVariables.getFloat('--path-arrow-size')
        };
        
        return styles;
    }
    
    /**
     * Dessine un path complet sur le canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {Path} path
     * @param {CoordinateSystem} coordSystem
     * @param {Object} options - { showArrows: true, debug: false }
     */
    render(ctx, path, coordSystem, options = {}) {
        const { showArrows = true, debug = false } = options;
        
        this.debug.info('PathRenderer.render() called', {
            pathLength: path.getLength(),
            isClosed: path.isClosed,
            showArrows,
            debug
        });
        
        ctx.save();
        
        let segmentCount = 0;
        
        // Dessiner chaque segment du path
        path.forEach((element, index) => {
            const nextElement = path.getNextElement(element);
            
            if (nextElement) {
                this.debug.info('Drawing segment', { 
                    from: `${element.cell.row},${element.cell.col}`,
                    to: `${nextElement.cell.row},${nextElement.cell.col}`,
                    hasDomElement: !!element.cell.domElement
                });
                this._renderSegment(ctx, element, nextElement, coordSystem, showArrows);
                segmentCount++;
            }
        });
        
        this.debug.success(`Rendered ${segmentCount} segments`);
        
        // Mode debug : afficher les points
        if (debug) {
            this._renderDebugPoints(ctx, path, coordSystem);
        }
        
        ctx.restore();
    }
    
    /**
     * Dessine un segment entre deux PathElement
     * @param {CanvasRenderingContext2D} ctx
     * @param {PathElement} element
     * @param {PathElement} nextElement
     * @param {CoordinateSystem} coordSystem
     * @param {boolean} showArrows
     * @private
     */
    _renderSegment(ctx, element, nextElement, coordSystem, showArrows) {
        const zone = element.specialZone || 'normal';
        const style = this.zoneStyles[zone] || this.zoneStyles.normal;
        
        // Obtenir les centres des cellules
        const start = coordSystem.getElementCenter(element.cell.domElement);
        const end = coordSystem.getElementCenter(nextElement.cell.domElement);
        
        // Debug premier segment seulement
        if (element.index === 0) {
            this.debug.info('First segment rendering', {
                zone,
                styleColor: style.color,
                styleWidth: style.lineWidth,
                styleOpacity: style.opacity,
                startX: start.x,
                startY: start.y,
                endX: end.x,
                endY: end.y,
                canvasWidth: ctx.canvas.width,
                canvasHeight: ctx.canvas.height
            });
        }
        
        // Dessiner la ligne
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        
        ctx.strokeStyle = style.color;
        ctx.lineWidth = style.lineWidth;
        ctx.globalAlpha = style.opacity;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Style pointillé pour certaines zones
        if (zone === 'checkpoint') {
            ctx.setLineDash([5, 5]);
        } else {
            ctx.setLineDash([]);
        }
        
        ctx.stroke();
        
        // Dessiner la flèche directionnelle
        if (showArrows) {
            this._renderArrow(ctx, start, end);
        }
    }
    
    /**
     * Dessine une flèche directionnelle au milieu d'un segment
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} start - {x, y}
     * @param {Object} end - {x, y}
     * @private
     */
    _renderArrow(ctx, start, end) {
        const arrowStyle = this.zoneStyles.arrow;
        const arrowSize = arrowStyle.size;
        
        // Point milieu du segment
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        // Angle de la flèche
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        
        // Points de la flèche
        const arrowAngle = Math.PI / 6; // 30 degrés
        const x1 = midX - arrowSize * Math.cos(angle - arrowAngle);
        const y1 = midY - arrowSize * Math.sin(angle - arrowAngle);
        const x2 = midX - arrowSize * Math.cos(angle + arrowAngle);
        const y2 = midY - arrowSize * Math.sin(angle + arrowAngle);
        
        // Dessiner la flèche
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(x1, y1);
        ctx.moveTo(midX, midY);
        ctx.lineTo(x2, y2);
        
        ctx.strokeStyle = arrowStyle.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1.0;
        ctx.setLineDash([]);
        ctx.stroke();
    }
    
    /**
     * Mode debug : affiche les points des PathElement
     * @param {CanvasRenderingContext2D} ctx
     * @param {Path} path
     * @param {CoordinateSystem} coordSystem
     * @private
     */
    _renderDebugPoints(ctx, path, coordSystem) {
        const pointColor = CSSVariables.get('--path-debug-point-color');
        const pointSize = CSSVariables.getFloat('--path-debug-point-size');
        
        path.forEach((element) => {
            const center = coordSystem.getElementCenter(element.cell.domElement);
            
            ctx.beginPath();
            ctx.arc(center.x, center.y, pointSize, 0, Math.PI * 2);
            ctx.fillStyle = pointColor;
            ctx.globalAlpha = 1.0;
            ctx.fill();
            
            // Afficher l'index
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(element.index.toString(), center.x, center.y);
        });
    }
    
    /**
     * Recharge les styles CSS (utile si les variables CSS changent)
     */
    reloadStyles() {
        this.zoneStyles = this._loadZoneStyles();
        this.debug.info('Styles reloaded from CSS variables');
    }
}
