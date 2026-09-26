import { memo, useId } from 'react';
import { FACTORY } from '../../../config/configurationOptions.js';
import { formatPrice } from '../../../utils/formatConfiguration.js';

/**
 * Swatch colour picker built on native radio inputs (arrow-key navigation, screen-reader
 * semantics for free) plus a native colour input for custom colours.
 *
 * value: FACTORY | '#rrggbb' | '@optionId'
 */
function ColorPicker({ label, value, onChange, swatches, factoryLabel, match, matchLabel, hint, price, valueLabel }) {
  const name = useId();
  const isCustom = typeof value === 'string' && value.startsWith('#') && !swatches.some((s) => s.hex === value);
  const choices = [
    { key: FACTORY, name: factoryLabel ? `${factoryLabel} (factory)` : 'Factory', className: 'swatch--factory' },
    ...(match ? [{ key: `@${match}`, name: matchLabel, className: 'swatch--match' }] : []),
    ...swatches.map((s) => ({ key: s.hex, name: s.name, hex: s.hex })),
  ];

  return (
    <fieldset className="control">
      <legend className="control__head">
        <span className="control__label">{label}</span>
        <span className="control__value">{valueLabel}</span>
      </legend>
      {hint && <p className="control__hint">{hint}</p>}
      <div className="swatches">
        {choices.map((c) => (
          <label key={c.key} className={`swatch ${c.className ?? ''}`} title={c.name}>
            <input
              type="radio"
              name={name}
              value={c.key}
              checked={value === c.key}
              onChange={() => onChange(c.key)}
              className="visually-hidden"
            />
            <span className="swatch__chip" style={c.hex ? { '--swatch': c.hex } : undefined} aria-hidden="true" />
            <span className="visually-hidden">{c.name}</span>
          </label>
        ))}
        <label className={`swatch swatch--custom ${isCustom ? 'is-checked' : ''}`} title="Custom colour">
          <input
            type="color"
            value={isCustom ? value : '#888888'}
            onChange={(e) => onChange(e.target.value)}
            className="swatch__native"
            aria-label={`${label}: pick a custom colour`}
          />
          <span className="swatch__chip" style={isCustom ? { '--swatch': value } : undefined} aria-hidden="true" />
        </label>
      </div>
      {price > 0 && <p className="control__price">Custom colour +{formatPrice(price)}</p>}
    </fieldset>
  );
}

export default memo(ColorPicker);
