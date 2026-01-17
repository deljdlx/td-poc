import { Event } from "./Event.js";


export class HitEvent extends Event {
  constructor(missile, target) {

    super("combat:hit", missile, {
      missile: missile,
      target: target,
    });

    console.group('%cCombatEvent.js :: 12 =============================', 'color: #149734; font-size: 1rem');
    console.log(this);
    console.groupEnd();
  }
}
