import { Path } from './Path.js';
import { PathElement } from './PathElement.js';

/**
 * Factory pour créer différents types de chemins (Path)
 */
export class PathFactory {
    /**
     * Crée un path suivant le périmètre de la grille (boucle fermée)
     * @param {GridModel} gridModel
     * @param {CoordinateSystem} coordSystem
     * @param {DIContainer} diContainer
     * @returns {Path}
     */
    static createPerimeter(gridModel, coordSystem, diContainer) {
        const debug = diContainer.createDebug('PathFactory', true);
        const cells = [];
        
        const rows = gridModel.rows;
        const cols = gridModel.cols;
        
        // 1. Bord HAUT (gauche → droite) : row = 0, col = 0 → cols-1
        for (let col = 0; col < cols; col++) {
            cells.push(gridModel.getCell(0, col));
        }
        
        // 2. Bord DROIT (haut → bas) : col = cols-1, row = 1 → rows-1
        for (let row = 1; row < rows; row++) {
            cells.push(gridModel.getCell(row, cols - 1));
        }
        
        // 3. Bord BAS (droite → gauche) : row = rows-1, col = cols-2 → 0
        for (let col = cols - 2; col >= 0; col--) {
            cells.push(gridModel.getCell(rows - 1, col));
        }
        
        // 4. Bord GAUCHE (bas → haut) : col = 0, row = rows-2 → 1
        for (let row = rows - 2; row >= 1; row--) {
            cells.push(gridModel.getCell(row, 0));
        }
        
        // Créer les PathElement
        const elements = cells.map((cell, index) => new PathElement(cell, index));
        
        // Calculer les métadonnées (direction, distance)
        for (let i = 0; i < elements.length; i++) {
            const nextElement = (i < elements.length - 1) 
                ? elements[i + 1]  // Prochain élément
                : elements[0];      // Boucle vers le début
            
            elements[i].calculateMetadata(nextElement, coordSystem);
        }
        
        const path = new Path(elements, true, diContainer);
        
        debug.success('Perimeter path created', {
            totalCells: cells.length,
            totalDistance: path.getTotalDistance().toFixed(2) + 'px'
        });
        
        return path;
    }
    
    /**
     * Crée un path personnalisé à partir d'un array de cellules
     * @param {Cell[]} cells - Séquence de cellules
     * @param {boolean} isClosed - true pour boucle fermée
     * @param {CoordinateSystem} coordSystem
     * @param {DIContainer} diContainer
     * @returns {Path}
     */
    static createCustom(cells, isClosed, coordSystem, diContainer) {
        const debug = diContainer.createDebug('PathFactory', true);
        
        // Créer les PathElement
        const elements = cells.map((cell, index) => new PathElement(cell, index));
        
        // Calculer les métadonnées
        for (let i = 0; i < elements.length; i++) {
            let nextElement = null;
            
            if (i < elements.length - 1) {
                nextElement = elements[i + 1];
            } else if (isClosed) {
                nextElement = elements[0];
            }
            
            elements[i].calculateMetadata(nextElement, coordSystem);
        }
        
        const path = new Path(elements, isClosed, diContainer);
        
        debug.success('Custom path created', {
            totalCells: cells.length,
            isClosed,
            totalDistance: path.getTotalDistance().toFixed(2) + 'px'
        });
        
        return path;
    }
}
