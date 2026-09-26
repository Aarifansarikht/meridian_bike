import { memo, useId } from 'react';
import { FINISHES } from '../../../config/configurationOptions.js';
import { formatPrice } from '../../../utils/formatConfiguration.js';

/** Segmented selector for physical surface finishes (gloss, matte, metallic...). */
function MaterialSelector({ label, value, onChange, choices, hint }) {
  const name = useId();
  return (
    <fieldset className="control">
      <legend className="control__head">
        <span className="control__label">{label}</span>
        <span className="control__value">{FINISHES[value]?.label}</span>
      </legend>
      {hint && <p className="control__hint">{hint}</p>}
      <div className="segmented" role="presentation">
        {choices.map((key) => (
          <label key={key} className="segmented__item">
            <input
              type="radio"
              name={name}
              value={key}
              checked={value === key}
              onChange={() => onChange(key)}
              className="visually-hidden"
            />
            <span className={`finish-dot finish-dot--${key}`} aria-hidden="true" />
            <span className="segmented__text">{FINISHES[key].label}</span>
            {FINISHES[key].price > 0 && <span className="segmented__price">+{formatPrice(FINISHES[key].price)}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default memo(MaterialSelector);
