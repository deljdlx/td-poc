import { DIContainer } from "./services/core/DIContainer.js";
import { Debug } from "./services/core/Debug.js";
import { CoordinateSystem } from "./services/engine/CoordinateSystem.js";
import { PopupManager } from "./services/ui/PopupManager.js";
import { UIUpdateManager } from "./services/ui/UIUpdateManager.js";

/**
 * Bootstrap - DI Container configuration
 *
 * Registers ONLY global application-wide services.
 * Game-specific services (GameClock, EntityManager, etc.) are created by Game itself.
 *
 * Global services registered here:
 * - debug.factory: Debug instance factory
 * - coordinateSystem: Singleton coordinate conversion system
 * - popupManager: Global popup/modal manager
 * - uiUpdateManager: Global UI update coordinator
 */

// Create container
const container = new DIContainer();

/**
 * Register all global services
 * @returns {void}
 */
export function bootstrapDI() {
  // Factory for creating Debug instances
  container.registerFactory("debug.factory", () => {
    return (context, enabled = true, logger = console) =>
      new Debug(context, enabled, logger);
  });

  // CoordinateSystem (singleton)
  container.registerFactory("coordinateSystem", () => {
    return new CoordinateSystem();
  });

  // UIUpdateManager (singleton)
  container.registerFactory("uiUpdateManager", (container) => {
    return new UIUpdateManager(container);
  });

  // PopupManager (singleton)
  container.registerFactory("popupManager", (container) => {
    return new PopupManager(container);
  });
}

// Export container
export { container };
