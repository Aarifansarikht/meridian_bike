import { memo, useId } from 'react';
import { formatPrice } from '../../../utils/formatConfiguration.js';

/** Accessible on/off switch for visibility-type options (accessories). */
function ToggleControl({ label, value, onChange, hint, price }) {
  const id = useId();
  const delta = value ? price?.on ?? 0 : price?.off ?? 0;
  return (
    <div className="control control--toggle">
      <label htmlFor={id} className="toggle">
        <span className="toggle__text">
          <span className="control__label">{label}</span>
          <span className="control__value">
            {value ? 'Fitted' : 'Removed'}
            {delta !== 0 && ` · ${delta > 0 ? '+' : '−'}${formatPrice(Math.abs(delta))}`}
          </span>
        </span>
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="toggle__input"
        />
        <span className="toggle__track" aria-hidden="true">
          <span className="toggle__thumb" />
        </span>
      </label>
      {hint && <p className="control__hint">{hint}</p>}
    </div>
  );
}

export default memo(ToggleControl);
