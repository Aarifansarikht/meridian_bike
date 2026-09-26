/**
 * URL <-> configuration. Only non-default values are written, so links stay short:
 *   /configurator/metro?frameColor=1f4a36&frameFinish=matte&kickstand=0
 */
import { getBikeOptions, getDefaultConfiguration } from '../config/bikes.js';
import { FACTORY, FINISHES, TEXTURES } from '../config/configurationOptions.js';

const HEX = /^[0-9a-f]{6}$/i;

function encodeValue(option, value) {
  switch (option.type) {
    case 'color':
      return value.startsWith('#') ? value.slice(1).toLowerCase() : value; // 'factory' | '@frameColor'
    case 'toggle':
      return value ? '1' : '0';
    default:
      return String(value);
  }
}

function decodeValue(option, raw) {
  switch (option.type) {
    case 'color':
      if (raw === FACTORY) return FACTORY;
      if (HEX.test(raw)) return `#${raw.toLowerCase()}`;
      if (option.match && raw === `@${option.match}`) return raw;
      return undefined;
    case 'finish':
      return option.choices.includes(raw) && FINISHES[raw] ? raw : undefined;
    case 'texture':
      return option.choices.includes(raw) && TEXTURES[raw] ? raw : undefined;
    case 'toggle':
      return raw === '1' ? true : raw === '0' ? false : undefined;
    case 'choice':
      return option.choices.some((c) => c.id === raw) ? raw : undefined;
    default:
      return undefined;
  }
}

export function serializeConfiguration(bike, config) {
  const params = new URLSearchParams();
  for (const option of getBikeOptions(bike)) {
    const value = config[option.id];
    if (value === undefined || value === option.default) continue;
    params.set(option.id, encodeValue(option, value));
  }
  return params.toString();
}

/** Parses & validates URL params; invalid or unknown values silently fall back to defaults. */
export function deserializeConfiguration(bike, searchParams) {
  const config = getDefaultConfiguration(bike);
  for (const option of getBikeOptions(bike)) {
    const raw = searchParams.get(option.id);
    if (raw == null) continue;
    const value = decodeValue(option, raw);
    if (value !== undefined) config[option.id] = value;
  }
  return config;
}

/** Validates a single value coming from the UI (same rules as the URL). */
export function isValidOptionValue(option, value) {
  if (option.type === 'color') {
    return value === FACTORY || (typeof value === 'string' && (HEX.test(value.slice(1)) || value === `@${option.match}`));
  }
  if (option.type === 'toggle') return typeof value === 'boolean';
  return decodeValue(option, String(value)) !== undefined;
}

/** Short deterministic ID, e.g. "MTR-4K9QZ2". FNV-1a over the canonical query string. */
export function configurationId(bike, config) {
  const input = `${bike.id}?${serializeConfiguration(bike, config)}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${bike.code}-${(hash >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(-6)}`;
}

export function buildShareUrl(bike, config) {
  const qs = serializeConfiguration(bike, config);
  return `${window.location.origin}/configurator/${bike.id}${qs ? `?${qs}` : ''}`;
}
