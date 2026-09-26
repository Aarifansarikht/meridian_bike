import { memo } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatConfiguration.js';
import { getBikeOptions } from '../../config/bikes.js';
import Icon from '../common/Icon.jsx';
import { prefetchBikeAssets } from '../../utils/preloadAssets.js';

function BikeCard({ bike, index, onQuickLook }) {
  return (
    <article className="bike-card" aria-labelledby={`bike-${bike.id}-name`}>
      <div className="bike-card__media">
        <span className="bike-card__index" aria-hidden="true">
          0{index + 1}
        </span>
        <img src={bike.render} alt={`${bike.name}, ${bike.category.toLowerCase()} bicycle`} loading="lazy" width="1600" height="1000" />
        <button type="button" className="bike-card__quicklook glass" onClick={() => onQuickLook(bike)}>
          <Icon name="cube" size={16} /> View in 3D
        </button>
      </div>
      <div className="bike-card__body">
        <p className="eyebrow">{bike.category}</p>
        <h3 id={`bike-${bike.id}-name`} className="bike-card__name">
          {bike.name}
        </h3>
        <p className="bike-card__desc">{bike.description}</p>
        <dl className="bike-card__specs">
          {bike.specs.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
        <div className="bike-card__foot">
          <div>
            <span className="bike-card__from">From</span>
            <span className="bike-card__price">{formatPrice(bike.basePrice)}</span>
            <span className="bike-card__opts">{getBikeOptions(bike).length} configurable options</span>
          </div>
          <Link
            to={`/configurator/${bike.id}`}
            className="btn btn--primary"
            aria-label={`Configure the ${bike.name}`}
            onPointerEnter={() => prefetchBikeAssets(bike)}
            onFocus={() => prefetchBikeAssets(bike)}
          >
            Configure <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default memo(BikeCard);
