/** Human-readable descriptions, pricing and share text for a configuration. */
import { getBikeOptions } from '../config/bikes.js';
import { FACTORY, FINISHES, PALETTES, CURRENCY, TEXTURES } from '../config/configurationOptions.js';

const priceFormatter = new Intl.NumberFormat(CURRENCY.locale, {
  style: 'currency',
  currency: CURRENCY.code,
  maximumFractionDigits: 0,
});
export const formatPrice = (value) => priceFormatter.format(value);

export function isOptionVisible(option, config) {
  if (!option.visibleWhen) return true;
  return Object.entries(option.visibleWhen).every(([id, v]) => (config[id] ?? null) === v);
}

export function isOptionAvailable(option, unavailableParts = []) {
  if (option.part && unavailableParts.includes(option.part)) return false;
  if (option.type === 'choice') {
    return option.choices.every((c) => c.effects.every((e) => !unavailableParts.includes(e.part)));
  }
  return true;
}

export function colorName(option, hex) {
  const swatch = PALETTES[option.palette]?.find((s) => s.hex.toLowerCase() === hex.toLowerCase());
  return swatch ? swatch.name : `Custom ${hex.toUpperCase()}`;
}

export function describeValue(bike, option, value) {
  switch (option.type) {
    case 'color': {
      if (!value || value === FACTORY) return option.factoryLabel ? `${option.factoryLabel} (factory)` : 'Factory';
      if (value.startsWith('@')) {
        const source = getBikeOptions(bike).find((o) => o.id === value.slice(1));
        return `Matched to ${source?.label.toLowerCase() ?? 'frame'}`;
      }
      return colorName(option, value);
    }
    case 'finish':
      return FINISHES[value]?.label ?? 'Factory';
    case 'texture':
      return TEXTURES[value]?.label ?? 'Factory';
    case 'toggle':
      return value ? 'Fitted' : 'Removed';
    case 'choice':
      return option.choices.find((c) => c.id === value)?.label ?? String(value);
    default:
      return String(value);
  }
}

export function optionPrice(option, value) {
  switch (option.type) {
    case 'color':
      return value && value !== FACTORY ? option.price ?? 0 : 0;
    case 'finish':
      return FINISHES[value]?.price ?? 0;
    case 'texture':
      return TEXTURES[value]?.price ?? 0;
    case 'toggle':
      return value ? option.price?.on ?? 0 : option.price?.off ?? 0;
    case 'choice':
      return option.choices.find((c) => c.id === value)?.price ?? 0;
    default:
      return 0;
  }
}

/** Options that are relevant to the current configuration (visible & available). */
export function activeOptions(bike, config, unavailableParts = []) {
  return getBikeOptions(bike).filter((o) => isOptionVisible(o, config) && isOptionAvailable(o, unavailableParts));
}

export function computePrice(bike, config, unavailableParts) {
  return activeOptions(bike, config, unavailableParts).reduce(
    (sum, o) => sum + optionPrice(o, config[o.id] ?? o.default),
    bike.basePrice,
  );
}

/** Structured summary grouped by category. */
export function buildSummary(bike, config, unavailableParts) {
  const opts = activeOptions(bike, config, unavailableParts);
  const groups = bike.categories
    .map((cat) => ({
      id: cat.id,
      label: cat.label,
      items: opts
        .filter((o) => o.category === cat.id)
        .map((o) => {
          const value = config[o.id] ?? o.default;
          return {
            id: o.id,
            label: o.label,
            value: describeValue(bike, o, value),
            hex: o.type === 'color' && typeof value === 'string' && value.startsWith('#') ? value : null,
            price: optionPrice(o, value),
            changed: value !== o.default,
          };
        }),
    }))
    .filter((g) => g.items.length > 0);
  return { bike, groups, price: computePrice(bike, config, unavailableParts) };
}

/** Plain-text summary used for WhatsApp, e-mail and clipboard. */
export function summaryToText(summary, { configurationId, url } = {}) {
  const lines = ['My Bicycle Configuration', '', `Model: ${summary.bike.name} (${summary.bike.category})`];
  for (const group of summary.groups) {
    lines.push('', group.label);
    for (const item of group.items) lines.push(`• ${item.label}: ${item.value}`);
  }
  lines.push('', `Estimated price: ${formatPrice(summary.price)}`);
  if (configurationId) lines.push(`Configuration ID: ${configurationId}`);
  if (url) lines.push('', `View it in 3D: ${url}`);
  return lines.join('\n');
}
