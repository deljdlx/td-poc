# 🏗️ Architecture Refactoring Proposal

## Problème actuel

L'architecture mélange 3 couches qui devraient être séparées :
1. **DATA** (modèle métier)
2. **VIEW** (rendu DOM/Canvas)
3. **EVENTS** (communication entre couches)

### Violations identifiées

```
Cell (DATA + VIEW) ❌
├── tower (DATA) 
└── element.classList (VIEW) ← VIOLATION !

TowerDragHandler (UI + DATA) ❌
├── handleDragEnd() → UI validation ✅
├── updateTowerUI() → appelle Cell.setTower() (DATA) ← VIOLATION !
└── gridView.updateCell() → VIEW ✅

Game (LOGIC + DATA) ⚠️
├── placeTower() → modifie DATA puis émet event ← ORDRE INVERSÉ !
└── moveTower() → validation puis modification ✅
```

## Solution : Strict MVC Pattern

### 1. DATA Layer (Model) - Pure Data

**Cell.js** - Ne touche JAMAIS au DOM
```javascript
export class Cell {
    tower = null;
    
    // DATA ONLY - NO DOM ACCESS
    setTower(tower) {
        const oldTower = this.tower;
        this.tower = tower;
        
        // Émettre event pour notifier le changement
        EventBus.emitGlobal('cell:towerChanged', {
            cell: this,
            oldTower,
            newTower: tower
        });
    }
    
    removeTower() {
        this.setTower(null);
    }
}
```

**Tower.js** - Pure data entity
```javascript
export class Tower extends Entity {
    cell = null;  // Référence Cell
    x = 0;        // Position canvas (synchronisée)
    y = 0;
    
    // Business logic uniquement
    update(deltaTime) { /* ... */ }
    canShoot() { /* ... */ }
}
```

### 2. VIEW Layer - Pure Rendering

**GridView.js** - Écoute les changements de données
```javascript
export class GridView {
    constructor(container, model, diContainer) {
        // ...
        
        // Écouter les changements de données
        EventBus.onGlobal('cell:towerChanged', (data) => {
            this.updateCellVisual(data.cell);
        });
    }
    
    updateCellVisual(cell) {
        if (!cell.element) return;
        
        // Synchroniser le DOM avec les données
        if (cell.tower) {
            cell.element.classList.add('has-tower');
            this.renderTowerEmoji(cell);
        } else {
            cell.element.classList.remove('has-tower');
            this.clearTowerEmoji(cell);
        }
    }
    
    renderTowerEmoji(cell) {
        // Rendu pur basé sur cell.tower
        const existing = cell.element.querySelector('.tower-icon');
        if (existing) existing.remove();
        
        const icon = document.createElement('div');
        icon.className = 'tower-icon';
        icon.textContent = '🗼';
        cell.element.appendChild(icon);
    }
}
```

### 3. CONTROLLER Layer - Orchestration

**Game.js** - Valide AVANT de modifier
```javascript
placeTower(cell, towerTypeId = 'basic') {
    // 1. Validation métier
    if (!this.canPlaceTower(cell, towerTypeId)) {
        return false;
    }
    
    // 2. Créer entity
    const tower = new Tower(/* ... */);
    
    // 3. Émettre event AVANT modification (cancelable)
    const event = new TowerPlacingEvent(tower, cell);
    this.events.emit('towerPlacing', event);
    
    if (event.cancelled) {
        return false;
    }
    
    // 4. Modifier les données (émet cell:towerChanged)
    cell.setTower(tower);
    
    // 5. Synchroniser autres propriétés
    tower.cell = cell;
    const center = this.coordSystem.getElementCenter(cell.element);
    tower.x = center.x;
    tower.y = center.y;
    
    // 6. Ajouter à l'entity manager
    this.entityManager.addEntity(tower);
    this.playerManager.getActivePlayer().addTower(tower);
    
    // 7. Émettre event APRÈS modification (informational)
    const placedEvent = new TowerPlacedEvent(tower, cell);
    this.events.emit('towerPlaced', placedEvent);
    
    return true;
}

moveTower(tower, fromCell, toCell) {
    // 1. Validation métier
    if (!this.canMoveTower(tower, fromCell, toCell)) {
        return false;
    }
    
    // 2. Émettre event AVANT modification
    const event = new TowerMovingEvent(tower, fromCell, toCell);
    this.events.emit('towerMoving', event);
    
    if (event.cancelled) {
        return false;
    }
    
    // 3. Modifier les données (émet 2x cell:towerChanged)
    fromCell.removeTower();
    toCell.setTower(tower);
    
    // 4. Synchroniser Tower
    tower.cell = toCell;
    const center = this.coordSystem.getElementCenter(toCell.element);
    tower.x = center.x;
    tower.y = center.y;
    
    // 5. Émettre event APRÈS modification
    const movedEvent = new TowerMovedEvent(tower, fromCell, toCell);
    this.events.emit('towerMoved', movedEvent);
    
    return true;
}
```

**TowerDragHandler.js** - Pur UI, délègue au Game
```javascript
handleDragEnd(element, data, endPos) {
    const targetCell = this.findCellAtPosition(endPos.x, endPos.y);
    
    // Validations UI uniquement
    if (!targetCell || targetCell === data.cell) {
        return false;
    }
    
    // Émettre événement pour que Game valide et exécute
    EventBus.emitGlobal('tower:moveAttempt', {
        tower: data.tower,
        fromCell: data.cell,
        toCell: targetCell
    });
    
    // Le succès sera géré par l'event towerMoved
    return true;
}

constructor(/* ... */) {
    // Écouter les mouvements réussis pour mettre à jour le drag
    EventBus.onGlobal('towerMoved', (data) => {
        // Re-enable drag sur la nouvelle cellule
        this.enableTowerDrag(data.toCell);
    });
}
```

## Flow complet avec nouvelle architecture

### Placement initial
```
User: Game.placeTower(cell, 'basic')
  ↓
Game: Validation + emit('towerPlacing')
  ↓
Game: cell.setTower(tower)
  ↓
Cell: emit('cell:towerChanged')
  ↓
GridView: Listener → updateCellVisual() → DOM
  ↓
Game: emit('towerPlaced')
  ↓
TowerDragHandler: Listener → enableTowerDrag()
```

### Drag & Drop
```
User: Drag start
  ↓
TowerDragHandler: handleDragStart()
  ↓
User: Drop
  ↓
TowerDragHandler: handleDragEnd()
  ↓
TowerDragHandler: emit('tower:moveAttempt')
  ↓
Game: Listener → moveTower()
  ↓
Game: Validation + emit('towerMoving')
  ↓
Game: fromCell.removeTower() + toCell.setTower()
  ↓
Cell: emit('cell:towerChanged') × 2
  ↓
GridView: Listener → updateCellVisual() × 2
  ↓
Game: tower.x/y sync + emit('towerMoved')
  ↓
TowerDragHandler: Listener → enableTowerDrag(toCell)
```

## Bénéfices

### ✅ Séparation stricte des responsabilités
- **Cell** : Données uniquement
- **GridView** : Rendu uniquement  
- **Game** : Logique métier uniquement
- **TowerDragHandler** : UI uniquement

### ✅ Source de vérité unique
- Les données sont dans Cell/Tower
- Le DOM est un reflet des données
- GridView synchronise automatiquement

### ✅ Events avant modification
- `towerPlacing` / `towerMoving` : Cancelable
- `towerPlaced` / `towerMoved` : Informational
- Permet hooks et plugins

### ✅ Testabilité
- Model testable sans DOM
- View testable avec mock events
- Controller testable unitairement

### ✅ Debuggable
- Event flow clair et traçable
- Chaque couche isolée
- Pas de side effects cachés

## Migration path

### Phase 1 : Cell pure data
1. Enlever `element.classList` de Cell.setTower/removeTower
2. Émettre events `cell:towerChanged`
3. GridView écoute et synchronise DOM

### Phase 2 : TowerDragHandler pure UI
1. Enlever appels à Cell.setTower() / gridView.updateCell()
2. Écouter `towerMoved` pour re-enable drag
3. Tout passe par Game.moveTower()

### Phase 3 : Events cancelable
1. Ajouter `towerPlacing` / `towerMoving` events
2. Modifier Game pour émettre AVANT modification
3. Permettre event.cancel()

### Phase 4 : Cleanup
1. Supprimer méthodes deprecated
2. Ajouter tests unitaires
3. Documentation

## Risques

- **Breaking changes** : Modifie le workflow actuel
- **Events multiples** : Plus complexe à suivre initialement
- **Performance** : Potentiellement plus d'events (mais négligeable)

## Recommandation

⚠️ **Je recommande fortement cette refactorisation** car l'architecture actuelle :
- Viole les principes SOLID
- Rend le debugging difficile
- Risque bugs de désynchronisation
- Difficile à tester
- Ne scale pas pour de nouvelles features

La migration peut se faire progressivement par phases sans tout casser.
