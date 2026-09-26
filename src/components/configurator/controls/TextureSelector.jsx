import { memo, useId } from 'react';
import { TEXTURES } from '../../../config/configurationOptions.js';
import { getPatternThumbnail } from '../../../three/patterns.js';
import { formatPrice } from '../../../utils/formatConfiguration.js';

/** Surface-texture picker; thumbnails are rendered from the same patterns used on the bike. */
function TextureSelector({ label, value, onChange, choices, hint }) {
  const name = useId();
  return (
    <fieldset className="control">
      <legend className="control__head">
        <span className="control__label">{label}</span>
        <span className="control__value">{TEXTURES[value]?.label}</span>
      </legend>
      {hint && <p className="control__hint">{hint}</p>}
      <div className="texture-grid">
        {choices.map((key) => {
          const preset = TEXTURES[key];
          return (
            <label key={key} className="texture-tile">
              <input
                type="radio"
                name={name}
                value={key}
                checked={value === key}
                onChange={() => onChange(key)}
                className="visually-hidden"
              />
              <span
                className={`texture-tile__img ${preset.pattern ? '' : 'texture-tile__img--none'}`}
                style={preset.pattern ? { backgroundImage: `url(${getPatternThumbnail(preset.pattern)})` } : undefined}
                aria-hidden="true"
              />
              <span className="texture-tile__text">{preset.label}</span>
              {preset.price > 0 && <span className="texture-tile__price">+{formatPrice(preset.price)}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default memo(TextureSelector);
