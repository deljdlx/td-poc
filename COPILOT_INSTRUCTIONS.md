# Tower Defense Game - Instructions Copilot

## 🎯 Objectif
Créer un jeu de tower defense complet utilisant **DOM pur + Canvas** avec une architecture MVC et un style de code JavaScript moderne inspiré de PHP 8.

---

## 🏗️ Architecture

### Structure MVC
```
assets/
├── js/
│   ├── utils/           # Services utilitaires (DI, Debug, Coordinates)
│   ├── models/          # Logique métier pure (pas de DOM/Canvas)
│   ├── views/           # Rendu Canvas + DOM (pas de logique)
│   ├── controllers/     # Coordination models ↔ views
│   ├── bootstrap.js     # Configuration DI
│   └── main.js          # Point d'entrée
├── css/
└── (autres assets)
```

### Séparation des Responsabilités
- **Models** : Logique métier, données, pas de manipulation DOM/Canvas
- **Views** : Rendu uniquement, écoute les models
- **Controllers** : Coordination, gestion événements

---

## �� Architecture Multi-Layers (DOM + Canvas)

### Concept Clé : Bijection des Coordonnées
**CRITIQUE** : Les coordonnées entre le layer DOM et les layers Canvas doivent être **100% bijectifs**.

### Structure des Layers
```
┌─────────────────────────────────────┐
│  Layer DOM (UI Overlay)             │ ← z-index: 100, pointer-events: none
├─────────────────────────────────────┤
│  Canvas Layer 3 (Effects)           │ ← z-index: 30
├─────────────────────────────────────┤
│  Canvas Layer 2 (Entities)          │ ← z-index: 20
├─────────────────────────────────────┤
│  Canvas Layer 1 (Ground)            │ ← z-index: 10
└─────────────────────────────────────┘
```

**Règles :**
- Canvas en **fullscreen** (`100vw`, `100vh`, `position: fixed`)
- DOM layer avec `pointer-events: none` (sauf enfants)
- **TOUJOURS** utiliser `CoordinateSystem` pour conversions
- Méthodes clés : `getElementAbsolutePosition()`, `syncDOMWithCanvas()`, `domElementToCanvas()`

---

## 📜 Code Style JavaScript (PHP 8-like)

### 1. Propriétés Déclarées (OBLIGATOIRE)
```javascript
class Tower {
    // Toutes les propriétés déclarées en haut
    x = 0;
    y = 0;
    range = 100;
    damage = 10;
    target = null;
    
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
```

### 2. JSDoc pour le Typage (OBLIGATOIRE)
```javascript
/**
 * @param {number} x
 * @param {number} y
 * @param {string} type
 * @returns {Tower|null}
 */
placeTower(x, y, type) {
    // ...
}
```

### 3. Méthodes > Fonctions Inline/Closures
```javascript
// ❌ MAUVAIS
addEventListener('click', () => { this.doSomething(); });

// ✅ BON
addEventListener('click', this.handleClick.bind(this));

handleClick(event) {
    this.doSomething();
}
```

### 4. Injection de Dépendances
```javascript
// ❌ MAUVAIS - Instanciation en dur
constructor() {
    this.debug = new Debug('MaClasse');
}

// ✅ BON - Injection
constructor(container) {
    this.debug = container.createDebug('MaClasse');
}
```

---

## 🔧 Injection de Dépendances (DI)

### Utilisation
```javascript
// Dans bootstrap.js - Enregistrer des services
container.registerFactory('monService', () => new MonService());

// Dans les classes - Injecter
constructor(container) {
    this.service = container.get('monService');
    this.debug = container.createDebug('MaClasse');
}
```

### Services Disponibles
- `debug.factory` - Factory pour Debug
- `coordinateSystem` - Singleton CoordinateSystem
- Ajouter d'autres au besoin dans `bootstrap.js`

---

## 📋 Conventions de Code

### Nommage
- **Classes** : `PascalCase` (ex: `GameController`)
- **Méthodes/Fonctions** : `camelCase` (ex: `placeTower()`)
- **Propriétés** : `camelCase` (ex: `fireRate`)
- **Constantes** : `UPPER_SNAKE_CASE` (ex: `MAX_HEALTH`)
- **Fichiers** : `PascalCase.js` pour classes (ex: `Tower.js`)

### Structure d'une Classe
```javascript
class NomClasse {
    // 1. Propriétés publiques
    prop1 = value;
    prop2 = value;
    
    // 2. Propriétés privées (si besoin)
    #private = value;
    
    // 3. Constructeur (avec DI)
    constructor(container) {
        this.debug = container.createDebug('NomClasse');
    }
    
    // 4. Méthodes publiques
    methodePublique() { }
    
    // 5. Méthodes privées
    #methodePrivee() { }
}
```

---

## ✅ Checklist de Code Review

Avant chaque commit :
- [ ] Propriétés déclarées en haut de classe
- [ ] JSDoc avec types pour params et returns
- [ ] Pas de fonctions inline/closures (sauf exception justifiée)
- [ ] Event listeners avec méthodes nommées + `.bind(this)`
- [ ] Injection de dépendances (pas de `new` en dur)
- [ ] Séparation MVC respectée
- [ ] Conversions coordonnées via `CoordinateSystem`

---

## 🎮 Roadmap Tower Defense

### Phase 1 : Base ✅
- [x] Structure MVC
- [x] Grid interactive DOM
- [x] Canvas overlay
- [x] Système de coordonnées
- [x] DI Container
- [x] Debug system

### Phase 2 : Game Core
- [ ] Système de tours (placement, rotation, portée)
- [ ] Ennemis (déplacement sur chemin, HP)
- [ ] Projectiles (collision, dégâts)
- [ ] Vagues d'ennemis

### Phase 3 : Gameplay
- [ ] Économie (or, coût tours)
- [ ] Types de tours (canon, archer, mage)
- [ ] Types d'ennemis (goblin, orc, boss)
- [ ] Upgrades

### Phase 4 : Polish
- [ ] Animations
- [ ] Particules
- [ ] UI/UX améliorée
- [ ] Sons (optionnel)
- [ ] Menu principal
- [ ] Sauvegarde (localStorage)

---

## 🚀 Prochaines Étapes

1. Créer les entités de base (Tower, Enemy, Projectile)
2. Système de pathfinding pour ennemis
3. Système de combat (détection, tir, collision)
4. Game loop avec delta time
5. Gestion des vagues progressives

---

## 💡 Notes

- **Variables CSS** : Utiliser pour couleurs, tailles, animations
- **Performance** : Object pooling pour projectiles/particules
- **Debug** : Activer/désactiver via `debug.enable()` / `debug.disable()`
- **Tests** : Vérifier la bijection DOM ↔ Canvas avec le debugger
