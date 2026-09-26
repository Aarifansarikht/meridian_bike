import { memo, useId } from 'react';
import { formatPrice } from '../../../utils/formatConfiguration.js';

const priceLabel = (p) => (p === 0 ? 'Included' : `${p > 0 ? '+' : '−'}${formatPrice(Math.abs(p))}`);

/** Card-style single choice (variants, setups, graphics packages...). */
function OptionSelector({ label, value, onChange, choices, hint }) {
  const name = useId();
  return (
    <fieldset className="control">
      <legend className="control__head">
        <span className="control__label">{label}</span>
      </legend>
      {hint && <p className="control__hint">{hint}</p>}
      <div className="choice-list">
        {choices.map((c) => (
          <label key={c.id} className="choice">
            <input
              type="radio"
              name={name}
              value={c.id}
              checked={value === c.id}
              onChange={() => onChange(c.id)}
              className="visually-hidden"
            />
            <span className="choice__radio" aria-hidden="true" />
            <span className="choice__text">{c.label}</span>
            <span className="choice__price">{priceLabel(c.price)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default memo(OptionSelector);
