import { Event } from "./Event.js";

/**
 * UIEvent - Base class for UI-related events
 */
export class UIEvent extends Event {
  /**
   * @param {string} eventType - Specific UI event type
   * @param {Object} source - UI element that emitted the event
   * @param {Object} [payload={}] - Additional event data
   */
  constructor(eventType, source, payload = {}) {
    super(`ui:${eventType}`, source, payload);
  }
}

/**
 * PopupEvent - Base class for popup-related events
 */
export class PopupEvent extends UIEvent {
  /**
   * @type {Object}
   */
  popup;

  /**
   * @param {string} eventType - Specific popup event type
   * @param {Object} popup - Popup instance
   * @param {Object} [payload={}] - Additional event data
   */
  constructor(eventType, popup, payload = {}) {
    super(`popup:${eventType}`, popup, payload);
    this.popup = popup;
  }
}

/**
 * PopupOpenedEvent - Popup was opened
 */
export class PopupOpenedEvent extends PopupEvent {
  /**
   * @type {string}
   */
  popupType;

  /**
   * @param {Object} popup
   * @param {string} popupType - 'towerStats', 'playerInfo', etc.
   */
  constructor(popup, popupType) {
    super("opened", popup, { popupType });
    this.popupType = popupType;
  }
}

/**
 * PopupClosedEvent - Popup was closed
 */
export class PopupClosedEvent extends PopupEvent {
  /**
   * @type {string}
   */
  popupType;

  /**
   * @param {Object} popup
   * @param {string} popupType
   */
  constructor(popup, popupType) {
    super("closed", popup, { popupType });
    this.popupType = popupType;
  }
}
