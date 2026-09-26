/**
 * Pure translation of a serializable configuration into per-part render states.
 * This is the only bridge between Redux data and the Three.js layer.
 *
 * partState = { visible, finish, texture, colors: { channelId: '#hex' }, links: { channelId: sourceChannelId } }
 */
import { getBikeOptions } from '../config/bikes.js';
import { FACTORY } from '../config/configurationOptions.js';
import { emptyPartState } from '../three/bikeController.js';

/** Follows '@optionId' references (e.g. "fork matches frame") to a concrete value. */
export function resolveColorValue(value, config, depth = 0) {
  if (typeof value === 'string' && value.startsWith('@') && depth < 4) {
    return resolveColorValue(config[value.slice(1)] ?? FACTORY, config, depth + 1);
  }
  return value;
}

export function resolvePartStates(bike, config) {
  const states = Object.fromEntries(Object.keys(bike.parts).map((id) => [id, emptyPartState()]));
  const get = (id) => states[id] ?? (states[id] = emptyPartState());

  for (const option of getBikeOptions(bike)) {
    const value = config[option.id] ?? option.default;
    switch (option.type) {
      case 'color': {
        const hex = resolveColorValue(value, config);
        if (hex && hex !== FACTORY) {
          const channel = option.channel ?? bike.parts[option.part]?.primary ?? '*';
          get(option.part).colors[channel] = hex;
        }
        break;
      }
      case 'finish':
        get(option.part).finish = value ?? FACTORY;
        break;
      case 'texture':
        get(option.part).texture = value ?? FACTORY;
        break;
      case 'toggle':
        get(option.part).visible = Boolean(value);
        break;
      case 'choice': {
        const choice = option.choices.find((c) => c.id === value);
        for (const effect of choice?.effects ?? []) {
          const s = get(effect.part);
          if ('visible' in effect) s.visible = effect.visible;
          if (effect.sameAs) s.links[effect.channel] = effect.sameAs;
        }
        break;
      }
      default:
        break;
    }
  }
  return states;
}
