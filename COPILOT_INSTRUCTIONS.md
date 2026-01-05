# Tower Defense Game - Instructions Copilot

## 🎯 Objectif
Créer un jeu de tower defense complet utilisant **DOM pur + Canvas** avec une architecture MVC et un style de code JavaScript moderne inspiré de PHP 8.

---

## 🎨 Architecture Multi-Layers (DOM + Canvas)

### Concept Clé : Bijection des Coordonnées
**CRITIQUE** : Les coordonnées entre le layer DOM et les layers Canvas doivent être **100% bijectifs** (synchronisation parfaite).

### Structure des Layers

```
┌─────────────────────────────────────┐
│  Layer DOM (UI Overlay)             │ ← Boutons, menus, tooltips
│  z-index: 100                        │
├─────────────────────────────────────┤
│  Canvas Layer 3 (Effects)           │ ← Particules, explosions
│  z-index: 30                         │
├─────────────────────────────────────┤
│  Canvas Layer 2 (Entities)          │ ← Tours, ennemis, projectiles
│  z-index: 20                         │
├─────────────────────────────────────┤
│  Canvas Layer 1 (Ground)            │ ← Grille, terrain, chemin
│  z-index: 10                         │
└─────────────────────────────────────┘
```

### Exigences de Synchronisation

#### 1. Canvas Fullscreen (Viewport)
**IMPORTANT** : Les canvas prennent **tout le viewport** (plein écran).

```javascript
class LayerManager {
    /** @type {number} - Largeur du viewport */
    width = window.innerWidth;
    
    /** @type {number} - Hauteur du viewport */
    height = window.innerHeight;
    
    /** @type {HTMLCanvasElement} */
    groundCanvas = null;
    
    /** @type {HTMLCanvasElement} */
    entitiesCanvas = null;
    
    /** @type {HTMLCanvasElement} */
    effectsCanvas = null;
    
    /** @type {HTMLDivElement} */
    domLayer = null;
    
    /**
     * @returns {void}
     */
    init() {
        this.setupCanvasLayers();
        this.setupDOMLayer();
        this.handleResize();
    }
    
    /**
     * Configure tous les canvas en plein écran
     * @returns {void}
     */
    setupCanvasLayers() {
        [this.groundCanvas, this.entitiesCanvas, this.effectsCanvas].forEach(canvas => {
            // Taille interne du canvas (résolution)
            canvas.width = this.width;
            canvas.height = this.height;
            
            // Taille CSS (affichage)
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.margin = '0';
            canvas.style.padding = '0';
        });
    }
    
    /**
     * Configure le layer DOM pour couvrir tout le viewport
     * @returns {void}
     */
    setupDOMLayer() {
        this.domLayer.style.width = '100vw';
        this.domLayer.style.height = '100vh';
        this.domLayer.style.position = 'fixed';
        this.domLayer.style.top = '0';
        this.domLayer.style.left = '0';
        this.domLayer.style.margin = '0';
        this.domLayer.style.padding = '0';
        this.domLayer.style.pointerEvents = 'none';
    }
    
    /**
     * Gère le redimensionnement du viewport
     * @returns {void}
     */
    handleResize() {
        window.addEventListener('resize', this.onResize.bind(this));
    }
    
    /**
     * @returns {void}
     */
    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.setupCanvasLayers();
        this.setupDOMLayer();
    }
}
```

#### 2. Système de Coordonnées Unifié

**⚠️ DÉFI CRITIQUE** : Les éléments DOM peuvent être `relative`, `flex`, `absolute`, etc.  
Il faut **toujours** pouvoir calculer leurs coordonnées absolues réelles dans le viewport pour synchroniser avec les canvas.

**Créer une classe utilitaire pour gérer TOUTES les conversions de coordonnées :**

```javascript
/**
 * Gère la conversion entre coordonnées viewport, canvas, DOM et grille
 * CRITIQUE : Assure la bijection parfaite entre tous les systèmes de coordonnées
 */
class CoordinateSystem {
    /** @type {number} */
    viewportWidth = window.innerWidth;
    
    /** @type {number} */
    viewportHeight = window.innerHeight;
    
    /** @type {number} */
    gridCellSize = 40;
    
    /**
     * @param {number} gridSize
     */
    constructor(gridSize) {
        this.gridCellSize = gridSize;
        this.updateViewportSize();
        this.handleResize();
    }
    
    /**
     * @returns {void}
     */
    updateViewportSize() {
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
    }
    
    /**
     * @returns {void}
     */
    handleResize() {
        window.addEventListener('resize', this.updateViewportSize.bind(this));
    }
    
    // ==========================================
    // CONVERSIONS DOM → COORDONNÉES ABSOLUES
    // ==========================================
    
    /**
     * Calcule les coordonnées ABSOLUES d'un élément DOM dans le viewport
     * Fonctionne quel que soit le positionnement CSS (relative, flex, absolute, etc.)
     * @param {HTMLElement} element
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getElementAbsolutePosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
    }
    
    /**
     * Calcule le centre absolu d'un élément DOM
     * @param {HTMLElement} element
     * @returns {{x: number, y: number}}
     */
    getElementCenter(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
    
    /**
     * Positionne un élément DOM à des coordonnées absolues du viewport
     * Compatible avec position: fixed/absolute dans le DOM layer
     * @param {HTMLElement} element
     * @param {number} x - Coordonnée X absolue (viewport)
     * @param {number} y - Coordonnée Y absolue (viewport)
     * @returns {void}
     */
    setElementAbsolutePosition(element, x, y) {
        element.style.position = 'fixed';
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    }
    
    /**
     * Positionne un élément DOM centré sur des coordonnées
     * @param {HTMLElement} element
     * @param {number} centerX
     * @param {number} centerY
     * @returns {void}
     */
    setElementCenteredPosition(element, centerX, centerY) {
        const rect = element.getBoundingClientRect();
        const x = centerX - rect.width / 2;
        const y = centerY - rect.height / 2;
        this.setElementAbsolutePosition(element, x, y);
    }
    
    // ==========================================
    // CONVERSIONS EVENT → CANVAS
    // ==========================================
    
    /**
     * Convertit les coordonnées d'événement souris en coordonnées canvas
     * Les canvas étant en fullscreen, clientX/Y correspondent directement
     * @param {MouseEvent} event
     * @returns {{x: number, y: number}}
     */
    eventToCanvas(event) {
        // Comme les canvas sont en fullscreen (fixed, top:0, left:0)
        // clientX/Y correspondent déjà aux coordonnées canvas
        return {
            x: event.clientX,
            y: event.clientY
        };
    }
    
    /**
     * Convertit coordonnées écran en coordonnées canvas
     * @param {number} clientX
     * @param {number} clientY
     * @returns {{x: number, y: number}}
     */
    screenToCanvas(clientX, clientY) {
        return {
            x: clientX,
            y: clientY
        };
    }
    
    // ==========================================
    // CONVERSIONS CANVAS ↔ DOM (BIJECTION)
    // ==========================================
    
    /**
     * Convertit coordonnées canvas en coordonnées DOM absolues
     * BIJECTION 1:1 car les deux utilisent le viewport comme référence
     * @param {number} canvasX
     * @param {number} canvasY
     * @returns {{x: number, y: number}}
     */
    canvasToDOMAbsolute(canvasX, canvasY) {
        // Bijection parfaite : les coordonnées canvas = coordonnées viewport
        return { x: canvasX, y: canvasY };
    }
    
    /**
     * Convertit coordonnées DOM absolues en coordonnées canvas
     * @param {number} domX - Coordonnée absolue (depuis viewport)
     * @param {number} domY - Coordonnée absolue (depuis viewport)
     * @returns {{x: number, y: number}}
     */
    domAbsoluteToCanvas(domX, domY) {
        // Bijection inverse
        return { x: domX, y: domY };
    }
    
    /**
     * Synchronise un élément DOM avec une position canvas
     * @param {HTMLElement} element
     * @param {number} canvasX
     * @param {number} canvasY
     * @param {boolean} centered - Si true, centre l'élément sur les coordonnées
     * @returns {void}
     */
    syncDOMWithCanvas(element, canvasX, canvasY, centered = false) {
        const domCoords = this.canvasToDOMAbsolute(canvasX, canvasY);
        
        if (centered) {
            this.setElementCenteredPosition(element, domCoords.x, domCoords.y);
        } else {
            this.setElementAbsolutePosition(element, domCoords.x, domCoords.y);
        }
    }
    
    // ==========================================
    // CONVERSIONS GRILLE
    // ==========================================
    
    /**
     * Convertit les coordonnées canvas en coordonnées de grille
     * @param {number} canvasX
     * @param {number} canvasY
     * @returns {{col: number, row: number}}
     */
    canvasToGrid(canvasX, canvasY) {
        return {
            col: Math.floor(canvasX / this.gridCellSize),
            row: Math.floor(canvasY / this.gridCellSize)
        };
    }
    
    /**
     * Convertit les coordonnées de grille en coordonnées canvas (centre de cellule)
     * @param {number} col
     * @param {number} row
     * @returns {{x: number, y: number}}
     */
    gridToCanvas(col, row) {
        return {
            x: col * this.gridCellSize + this.gridCellSize / 2,
            y: row * this.gridCellSize + this.gridCellSize / 2
        };
    }
    
    /**
     * Convertit coordonnées de grille en coordonnées DOM absolutes
     * @param {number} col
     * @param {number} row
     * @returns {{x: number, y: number}}
     */
    gridToDOMAbsolute(col, row) {
        const canvas = this.gridToCanvas(col, row);
        return this.canvasToDOMAbsolute(canvas.x, canvas.y);
    }
    
    // ==========================================
    // PIPELINES COMPLETS
    // ==========================================
    
    /**
     * Pipeline complet : Event → toutes les coordonnées
     * @param {MouseEvent} event
     * @returns {{canvas: {x: number, y: number}, grid: {col: number, row: number}}}
     */
    eventToCoordinates(event) {
        const canvas = this.eventToCanvas(event);
        const grid = this.canvasToGrid(canvas.x, canvas.y);
        return { canvas, grid };
    }
    
    /**
     * Convertit un élément DOM en coordonnées canvas (son centre)
     * @param {HTMLElement} element
     * @returns {{x: number, y: number}}
     */
    domElementToCanvas(element) {
        const center = this.getElementCenter(element);
        return this.domAbsoluteToCanvas(center.x, center.y);
    }
}
```

**Exemple d'utilisation - Synchronisation DOM ↔ Canvas :**

```javascript
// Cas 1 : Afficher un tooltip DOM au-dessus d'une tour (canvas)
const tower = { x: 150, y: 200 }; // Coordonnées canvas
const tooltip = document.getElementById('tower-tooltip');

// Synchroniser la position
coordinateSystem.syncDOMWithCanvas(tooltip, tower.x, tower.y - 50, true);
// Le tooltip apparaîtra exactement 50px au-dessus de la tour

// Cas 2 : Détecter sur quelle case de grille un bouton DOM est positionné
const button = document.getElementById('special-ability-btn');
const canvasPos = coordinateSystem.domElementToCanvas(button);
const gridPos = coordinateSystem.canvasToGrid(canvasPos.x, canvasPos.y);
console.log(`Bouton sur la case: row=${gridPos.row}, col=${gridPos.col}`);

// Cas 3 : Click sur canvas → afficher info DOM
canvas.addEventListener('click', (event) => {
    const coords = coordinateSystem.eventToCoordinates(event);
    const infoPanel = document.getElementById('cell-info');
    
    // Afficher le panel exactement là où on a cliqué
    coordinateSystem.syncDOMWithCanvas(infoPanel, coords.canvas.x, coords.canvas.y);
    infoPanel.textContent = `Grille: ${coords.grid.col}, ${coords.grid.row}`;
});
```

#### 3. HTML Structure pour Layers Fullscreen

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tower Defense</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            overflow: hidden; /* Pas de scrollbars */
            width: 100vw;
            height: 100vh;
        }
    </style>
</head>
<body>
    <!-- Canvas Layers (fullscreen, empilés) -->
    <canvas id="canvas-ground"></canvas>
    <canvas id="canvas-entities"></canvas>
    <canvas id="canvas-effects"></canvas>
    
    <!-- DOM Layer (fullscreen overlay) -->
    <div id="dom-layer">
        <!-- Éléments UI positionnés de manière flexible ou absolue -->
        <div id="hud" style="position: absolute; top: 20px; left: 20px;">
            <!-- HUD en position absolute -->
            <div id="gold-counter">Gold: 100</div>
            <div id="wave-counter">Wave: 1</div>
        </div>
        
        <div id="tower-menu" style="display: flex; position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);">
            <!-- Menu en flexbox centré -->
            <button class="tower-btn">Canon</button>
            <button class="tower-btn">Archer</button>
            <button class="tower-btn">Mage</button>
        </div>
        
        <!-- Tooltips dynamiques (position calculée via CoordinateSystem) -->
        <div id="tooltip" style="position: fixed; display: none;">
            Info tooltip
        </div>
    </div>
</body>
</html>
```

#### 4. CSS Critique pour la Bijection Fullscreen

```css
/* Reset global */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body, html {
    width: 100%;
    height: 100%;
    overflow: hidden; /* Pas de scrollbars */
}

/* Canvas layers - Plein écran */
canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: block;
    /* Empêche l'anti-aliasing qui peut décaler les pixels */
    image-rendering: pixelated;
    image-rendering: crisp-edges;
}

#canvas-ground {
    z-index: 10;
}

#canvas-entities {
    z-index: 20;
}

#canvas-effects {
    z-index: 30;
}

/* DOM Layer - Plein écran overlay */
#dom-layer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 100;
    pointer-events: none; /* Les clics traversent le layer */
}

/* Les éléments enfants peuvent recevoir les clics */
#dom-layer > * {
    pointer-events: auto;
}

/* Éléments UI positionnés de manière flexible */
#hud {
    /* Position absolute - CoordinateSystem peut calculer sa position réelle */
    position: absolute;
}

#tower-menu {
    /* Flexbox - CoordinateSystem peut calculer la position de chaque bouton */
    display: flex;
    gap: 10px;
}

/* Éléments synchronisés dynamiquement avec canvas */
.synced-element {
    /* Position fixed pour alignement direct avec coordonnées viewport */
    position: fixed;
    /* Les coordonnées left/top seront définies via CoordinateSystem */
}

.tooltip, .info-panel {
    position: fixed; /* IMPORTANT : fixed pour correspondre aux canvas */
    display: none;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px;
    border-radius: 4px;
    font-size: 14px;
    white-space: nowrap;
    /* Les positions seront calculées via syncDOMWithCanvas() */
}
```

### Bonnes Pratiques de Synchronisation DOM ↔ Canvas

#### ✅ À FAIRE - Synchronisation Correcte

```javascript
// 1. TOUJOURS utiliser CoordinateSystem pour les conversions
const coords = this.coordinateSystem.eventToCoordinates(event);

// 2. Pour afficher un élément DOM à une position canvas
const tower = { x: 150, y: 200 };
const tooltip = document.getElementById('tooltip');
this.coordinateSystem.syncDOMWithCanvas(tooltip, tower.x, tower.y, true);

// 3. Pour récupérer la position canvas d'un élément DOM (quelle que soit sa position CSS)
const button = document.getElementById('ability-btn'); // Peut être en flex, relative, etc.
const canvasPos = this.coordinateSystem.domElementToCanvas(button);
// Maintenant on peut dessiner sur le canvas à cette position exacte

// 4. Gérer le resize du viewport
window.addEventListener('resize', () => {
    this.coordinateSystem.updateViewportSize();
    this.layerManager.onResize();
    // Re-synchroniser tous les éléments DOM dynamiques
    this.resyncAllDOMElements();
});

// 5. Exemple complet : Click canvas → afficher menu DOM contextuel
canvas.addEventListener('click', (event) => {
    const coords = this.coordinateSystem.eventToCoordinates(event);
    const contextMenu = document.getElementById('context-menu');
    
    // Afficher le menu exactement là où on a cliqué
    this.coordinateSystem.syncDOMWithCanvas(
        contextMenu, 
        coords.canvas.x, 
        coords.canvas.y
    );
    contextMenu.style.display = 'block';
});
```

#### ❌ À NE PAS FAIRE - Erreurs Courantes

```javascript
// ❌ ERREUR : Calculs de coordonnées en dur avec magic numbers
const x = event.clientX - 50; // Décalage garanti !
tooltip.style.left = `${x}px`;

// ❌ ERREUR : Positionner un élément DOM sans passer par CoordinateSystem
const tower = { x: 150, y: 200 };
tooltip.style.left = `${tower.x}px`; // Peut ne pas être aligné si on a du scroll, zoom, etc.

// ❌ ERREUR : Canvas de tailles différentes
groundCanvas.width = window.innerWidth;
entitiesCanvas.width = window.innerWidth + 50; // DÉSYNCHRONISATION !

// ❌ ERREUR : Utiliser offsetX/offsetY directement
canvas.addEventListener('click', (event) => {
    const x = event.offsetX; // Relatif à quel élément ? Peut varier !
});

// ❌ ERREUR : Ne pas tenir compte du type de positionnement DOM
const button = document.getElementById('btn');
// On assume que button est en absolute, mais il peut être en flex !
const x = parseInt(button.style.left); // Ne marchera pas pour flex/relative
// ✅ CORRECT : Utiliser getElementAbsolutePosition() ou domElementToCanvas()

// ❌ ERREUR : Oublier de gérer le resize
// Si le viewport change, la synchronisation est perdue
// ✅ CORRECT : Écouter 'resize' et re-synchroniser
```

### Debugging et Validation de la Bijection

```javascript
/**
 * Classe pour debug et valider la synchronisation DOM ↔ Canvas
 */
class CoordinateDebugger {
    /** @type {CoordinateSystem} */
    coordSystem = null;
    
    /** @type {CanvasRenderingContext2D} */
    debugCtx = null;
    
    /**
     * @param {CoordinateSystem} coordSystem
     * @param {HTMLCanvasElement} debugCanvas
     */
    constructor(coordSystem, debugCanvas) {
        this.coordSystem = coordSystem;
        this.debugCtx = debugCanvas.getContext('2d');
    }
    
    /**
     * Affiche visuellement les coordonnées sur tous les layers
     * @param {MouseEvent} event
     * @returns {void}
     */
    showCoordinates(event) {
        const coords = this.coordSystem.eventToCoordinates(event);
        console.log({
            screen: { x: event.clientX, y: event.clientY },
            canvas: coords.canvas,
            grid: coords.grid
        });
        
        // Dessiner un indicateur sur le canvas
        this.drawCrosshair(coords.canvas.x, coords.canvas.y);
        
        // Afficher tooltip DOM à la même position
        this.showTooltip(coords.canvas.x, coords.canvas.y, coords);
    }
    
    /**
     * Dessine une croix pour vérifier l'alignement canvas
     * @param {number} x
     * @param {number} y
     * @returns {void}
     */
    drawCrosshair(x, y) {
        this.debugCtx.strokeStyle = '#ff00ff';
        this.debugCtx.lineWidth = 2;
        
        // Ligne verticale
        this.debugCtx.beginPath();
        this.debugCtx.moveTo(x, y - 20);
        this.debugCtx.lineTo(x, y + 20);
        this.debugCtx.stroke();
        
        // Ligne horizontale
        this.debugCtx.beginPath();
        this.debugCtx.moveTo(x - 20, y);
        this.debugCtx.lineTo(x + 20, y);
        this.debugCtx.stroke();
    }
    
    /**
     * Affiche un tooltip DOM exactement à la position canvas
     * @param {number} x
     * @param {number} y
     * @param {Object} coords
     * @returns {void}
     */
    showTooltip(x, y, coords) {
        let tooltip = document.getElementById('debug-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'debug-tooltip';
            tooltip.style.position = 'fixed';
            tooltip.style.background = 'rgba(255, 0, 255, 0.8)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '4px 8px';
            tooltip.style.borderRadius = '3px';
            tooltip.style.fontSize = '12px';
            tooltip.style.pointerEvents = 'none';
            document.body.appendChild(tooltip);
        }
        
        tooltip.textContent = `Canvas: ${coords.canvas.x}, ${coords.canvas.y} | Grid: ${coords.grid.col}, ${coords.grid.row}`;
        
        // Synchroniser avec la position canvas
        this.coordSystem.syncDOMWithCanvas(tooltip, x + 25, y - 25);
        tooltip.style.display = 'block';
    }
    
    /**
     * Teste la bijection en comparant les conversions aller-retour
     * @returns {void}
     */
    testBijection() {
        console.log('=== Test de Bijection DOM ↔ Canvas ===');
        
        // Test 1 : Canvas → DOM → Canvas
        const originalCanvas = { x: 200, y: 300 };
        const dom = this.coordSystem.canvasToDOMAbsolute(originalCanvas.x, originalCanvas.y);
        const backToCanvas = this.coordSystem.domAbsoluteToCanvas(dom.x, dom.y);
        
        const test1Pass = originalCanvas.x === backToCanvas.x && originalCanvas.y === backToCanvas.y;
        console.log(`Test 1 - Canvas→DOM→Canvas: ${test1Pass ? '✅ PASS' : '❌ FAIL'}`);
        console.log('  Original:', originalCanvas, '→ DOM:', dom, '→ Back:', backToCanvas);
        
        // Test 2 : Vérifier qu'un élément DOM a la bonne position
        const testDiv = document.createElement('div');
        testDiv.style.width = '20px';
        testDiv.style.height = '20px';
        testDiv.style.background = 'red';
        document.body.appendChild(testDiv);
        
        const targetCanvas = { x: 400, y: 250 };
        this.coordSystem.syncDOMWithCanvas(testDiv, targetCanvas.x, targetCanvas.y, true);
        
        setTimeout(() => {
            const actualCenter = this.coordSystem.getElementCenter(testDiv);
            const diff = {
                x: Math.abs(actualCenter.x - targetCanvas.x),
                y: Math.abs(actualCenter.y - targetCanvas.y)
            };
            
            const test2Pass = diff.x < 1 && diff.y < 1; // Tolérance 1px
            console.log(`Test 2 - DOM position sync: ${test2Pass ? '✅ PASS' : '❌ FAIL'}`);
            console.log('  Target:', targetCanvas, 'Actual:', actualCenter, 'Diff:', diff);
            
            testDiv.remove();
        }, 100);
    }
}
```

**Utilisation du debugger :**

```javascript
// Dans main.js
const coordSystem = new CoordinateSystem(40);
const debugger = new CoordinateDebugger(coordSystem, effectsCanvas);

// Activer le debug au survol
document.addEventListener('mousemove', (event) => {
    if (event.shiftKey) { // Maintenir Shift pour activer
        debugger.showCoordinates(event);
    }
});

// Tester la bijection au chargement
window.addEventListener('load', () => {
    debugger.testBijection();
});
```

---

## 🎯 Résumé : Bijection DOM ↔ Canvas

### Principes Fondamentaux

1. **Canvas fullscreen** : Les canvas prennent tout le viewport (100vw × 100vh)

2. **CoordinateSystem centralisé** : TOUTES les conversions passent par cette classe unique

3. **Méthodes clés** :
   - `getElementAbsolutePosition(element)` : Position réelle d'un élément DOM (marche avec relative/flex/absolute)
   - `syncDOMWithCanvas(element, x, y)` : Place un élément DOM aux coordonnées canvas
   - `domElementToCanvas(element)` : Récupère les coordonnées canvas d'un élément DOM
   - `eventToCoordinates(event)` : Convertit un click en coordonnées canvas + grille

4. **Position CSS : `fixed`** : Pour les éléments synchronisés dynamiquement, utiliser `position: fixed` pour alignement direct avec le viewport

5. **Tests de validation** : Utiliser `CoordinateDebugger.testBijection()` pour vérifier la synchronisation parfaite

### Checklist de Synchronisation

Avant de coder :
- [ ] Canvas configurés en fullscreen (`100vw`, `100vh`, `position: fixed`)
- [ ] DOM layer avec `position: fixed` et `pointer-events: none`
- [ ] CoordinateSystem instancié et disponible globalement
- [ ] Event listener sur `resize` pour re-synchroniser
- [ ] CoordinateDebugger activé pour les tests

Pendant le dev :
- [ ] JAMAIS de calculs de coordonnées en dur
- [ ] TOUJOURS passer par CoordinateSystem pour conversions
- [ ] Tester avec Shift+Survol pour voir les coordonnées
- [ ] Vérifier `testBijection()` dans la console

---
        });
        
        // Dessiner un indicateur sur le canvas
        this.drawCrosshair(coords.canvas.x, coords.canvas.y);
        
        // Afficher tooltip DOM à la même position
        this.showTooltip(coords.canvas.x, coords.canvas.y, coords.grid);
    }
    
    /**
     * @param {number} x
     * @param {number} y
     * @returns {void}
     */
    drawCrosshair(x, y) {
        // Dessine une croix pour vérifier l'alignement
    }
    
    /**
     * @param {number} x
     * @param {number} y
     * @param {{col: number, row: number}} grid
     * @returns {void}
     */
    showTooltip(x, y, grid) {
        // Affiche un tooltip DOM exactement à la position canvas
    }
}
```

---

## 🏗️ Architecture MVC

### Structure
```
/
├── index.html
├── styles/
│   ├── main.css
│   └── ui.css
├── js/
│   ├── main.js              # Point d'entrée
│   ├── controllers/
│   │   ├── GameController.js
│   │   ├── TowerController.js
│   │   └── UIController.js
│   ├── models/
│   │   ├── GameModel.js
│   │   ├── Tower.js
│   │   ├── Enemy.js
│   │   ├── Projectile.js
│   │   ├── Grid.js
│   │   └── Wave.js
│   ├── views/
│   │   ├── GroundView.js    # Canvas Layer 1
│   │   ├── EntitiesView.js  # Canvas Layer 2
│   │   ├── EffectsView.js   # Canvas Layer 3
│   │   ├── DOMView.js       # DOM Layer (overlay)
│   │   └── MenuView.js
│   └── utils/
│       ├── CoordinateSystem.js  # ⚠️ CRITIQUE pour bijection
│       ├── LayerManager.js
│       ├── Vector2D.js
│       └── Collision.js
└── assets/
```

### Séparation des Responsabilités

#### Models (Logique métier)
- Gèrent les données et la logique du jeu
- Pas de manipulation DOM/Canvas
- Notifient les changements via événements
- Exemples : `Tower`, `Enemy`, `GameModel`

#### Views (Affichage)
- Rendu Canvas et DOM
- Écoutent les models pour se mettre à jour
- Pas de logique métier
- Exemples : `CanvasView`, `HUDView`

#### Controllers (Coordination)
- Gèrent les interactions utilisateur
- Coordonnent models et views
- Exemples : `GameController`, `TowerController`

---

## 📜 Code Style JavaScript (PHP 8 like)

### ✅ 1. Propriétés Déclarées (comme PHP 8)

**OBLIGATOIRE** : Toutes les propriétés de classe doivent être déclarées en haut de la classe.

```javascript
class Tower {
    // Propriétés déclarées (comme PHP 8)
    x = 0;
    y = 0;
    range = 100;
    damage = 10;
    fireRate = 1000;
    lastFireTime = 0;
    target = null;
    level = 1;
    type = 'basic';
    
    /**
     * @param {number} x
     * @param {number} y
     * @param {Object} config
     */
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.range = config.range ?? this.range;
        this.damage = config.damage ?? this.damage;
        this.fireRate = config.fireRate ?? this.fireRate;
    }
}
```

### ✅ 2. JSDoc pour le Typage (strict)

**OBLIGATOIRE** : Typer tous les paramètres, retours et propriétés complexes.

```javascript
class GameController {
    /** @type {GameModel} */
    model = null;
    
    /** @type {CanvasView} */
    view = null;
    
    /** @type {Tower[]} */
    towers = [];
    
    /**
     * Initialise le contrôleur de jeu
     * @param {GameModel} model - Le modèle de jeu
     * @param {CanvasView} view - La vue canvas
     * @returns {void}
     */
    init(model, view) {
        this.model = model;
        this.view = view;
    }
    
    /**
     * Place une tour sur la grille
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {string} towerType - Type de tour
     * @returns {Tower|null} La tour créée ou null si impossible
     */
    placeTower(x, y, towerType) {
        if (!this.canPlaceTower(x, y)) {
            return null;
        }
        
        const tower = new Tower(x, y, { type: towerType });
        this.towers.push(tower);
        return tower;
    }
    
    /**
     * Vérifie si on peut placer une tour
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    canPlaceTower(x, y) {
        return this.model.grid.isBuildable(x, y);
    }
}
```

### ✅ 3. Méthodes > Fonctions Inline/Closures

**À FAIRE** : Préférer les méthodes de classe aux fonctions anonymes.

```javascript
// ❌ MAUVAIS : Closure/fonction inline
class Enemy {
    hp = 100;
    
    takeDamage(amount) {
        setTimeout(() => {
            this.hp -= amount;
            if (this.hp <= 0) {
                this.die();
            }
        }, 100);
    }
}

// ✅ BON : Méthode de classe
class Enemy {
    hp = 100;
    
    takeDamage(amount) {
        setTimeout(this.applyDamage.bind(this), 100, amount);
    }
    
    /**
     * Applique les dégâts
     * @param {number} amount
     * @returns {void}
     */
    applyDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.die();
        }
    }
    
    /**
     * Gère la mort de l'ennemi
     * @returns {void}
     */
    die() {
        // Logique de mort
    }
}
```

### ✅ 4. Event Listeners : Méthodes Nommées

```javascript
// ❌ MAUVAIS
class UIController {
    init() {
        document.getElementById('btn-start').addEventListener('click', () => {
            this.startGame();
        });
    }
}

// ✅ BON
class UIController {
    init() {
        this.bindEvents();
    }
    
    /**
     * Lie les événements DOM
     * @returns {void}
     */
    bindEvents() {
        const btnStart = document.getElementById('btn-start');
        btnStart.addEventListener('click', this.handleStartClick.bind(this));
    }
    
    /**
     * Gère le clic sur le bouton start
     * @param {MouseEvent} event
     * @returns {void}
     */
    handleStartClick(event) {
        event.preventDefault();
        this.startGame();
    }
    
    /**
     * Démarre le jeu
     * @returns {void}
     */
    startGame() {
        // Logique de démarrage
    }
}
```

### ✅ 5. Constantes et Configuration

```javascript
// config.js
export const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    GRID_SIZE: 40,
    FPS: 60,
};

export const TOWER_TYPES = {
    BASIC: {
        cost: 50,
        damage: 10,
        range: 100,
        fireRate: 1000,
    },
    SNIPER: {
        cost: 100,
        damage: 25,
        range: 200,
        fireRate: 2000,
    },
};

export const ENEMY_TYPES = {
    GOBLIN: {
        hp: 50,
        speed: 2,
        reward: 10,
    },
    ORC: {
        hp: 150,
        speed: 1,
        reward: 25,
    },
};
```

---

## 📋 Conventions de Code

### Nommage
- **Classes** : `PascalCase` (ex: `GameController`)
- **Méthodes/Fonctions** : `camelCase` (ex: `placeTower()`)
- **Propriétés** : `camelCase` (ex: `fireRate`)
- **Constantes** : `UPPER_SNAKE_CASE` (ex: `CANVAS_WIDTH`)
- **Fichiers** : `PascalCase.js` pour les classes (ex: `Tower.js`)

### Structure d'une Classe

```javascript
/**
 * Description de la classe
 */
class NomDeLaClasse {
    // 1. Propriétés publiques déclarées
    propriete1 = valeurParDefaut;
    propriete2 = valeurParDefaut;
    
    // 2. Propriétés privées (si nécessaire)
    #proprietePrive = valeur;
    
    // 3. Constructeur
    /**
     * @param {Type} param1
     */
    constructor(param1) {
        this.propriete1 = param1;
    }
    
    // 4. Méthodes publiques
    /**
     * @returns {void}
     */
    methodePublique() {
        // ...
    }
    
    // 5. Méthodes privées (à la fin)
    /**
     * @returns {void}
     */
    #methodePrivee() {
        // ...
    }
}
```

### Typage JSDoc Standard

```javascript
/**
 * @typedef {Object} TowerConfig
 * @property {number} damage
 * @property {number} range
 * @property {number} fireRate
 */

/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 */

class Tower {
    /** @type {Position} */
    position = { x: 0, y: 0 };
    
    /**
     * Configure la tour
     * @param {TowerConfig} config
     * @returns {void}
     */
    configure(config) {
        // ...
    }
}
```

---

## 🎮 Exemple Complet : Pattern MVC

### Model
```javascript
// models/Tower.js
class Tower {
    x = 0;
    y = 0;
    range = 100;
    damage = 10;
    
    /** @type {Enemy|null} */
    target = null;
    
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    /**
     * @param {Enemy[]} enemies
     * @returns {void}
     */
    update(enemies) {
        this.findTarget(enemies);
        if (this.target) {
            this.fire();
        }
    }
    
    /**
     * @param {Enemy[]} enemies
     * @returns {void}
     */
    findTarget(enemies) {
        // Logique de recherche de cible
    }

    /**
     * @returns {void}
     */
    fire() {
        // Logique de tir
    }
}
```

### View
```javascript
// views/CanvasView.js
class CanvasView {
    /** @type {HTMLCanvasElement} */
    canvas = null;
    
    /** @type {CanvasRenderingContext2D} */
    ctx = null;
    
    /**
     * @param {string} canvasId
     */
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    }
    
    /**
     * @param {Tower[]} towers
     * @returns {void}
     */
    renderTowers(towers) {
        towers.forEach(this.renderTower.bind(this));
    }
    
    /**
     * @param {Tower} tower
     * @returns {void}
     */
    renderTower(tower) {
        this.ctx.fillStyle = '#00f';
        this.ctx.fillRect(tower.x - 10, tower.y - 10, 20, 20);
    }
}
```

### Controller
```javascript
// controllers/GameController.js
class GameController {
    /** @type {GameModel} */
    model = null;
    
    /** @type {CanvasView} */
    view = null;
    
    /** @type {number} */
    animationId = 0;
    
    /**
     * @param {GameModel} model
     * @param {CanvasView} view
     */
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }
    
    /**
     * @returns {void}
     */
    start() {
        this.gameLoop();
    }
    
    /**
     * @returns {void}
     */
    gameLoop() {
        this.update();
        this.render();
        this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * @returns {void}
     */
    update() {
        this.model.update();
    }
    
    /**
     * @returns {void}
     */
    render() {
        this.view.render(this.model);
    }
}
```

---

## ✅ Checklist de Code Review

Avant chaque commit, vérifier :
- [ ] Toutes les propriétés sont déclarées en haut de classe
- [ ] Tous les paramètres ont un JSDoc avec type
- [ ] Toutes les méthodes ont un JSDoc avec `@param` et `@returns`
- [ ] Pas de fonctions inline/closures (sauf cas exceptionnel justifié)
- [ ] Les event listeners utilisent des méthodes nommées avec `.bind(this)`
- [ ] Séparation MVC respectée
- [ ] Nommage cohérent (PascalCase/camelCase)
- [ ] Pas de logique métier dans les Views
- [ ] Pas de manipulation DOM dans les Models

---

## 🚀 Prochaine Étape
Créer la structure de base HTML/CSS et les premières classes MVC (GameModel, CanvasView, GameController)
