import { Link } from 'react-router-dom';
import { BIKES, BIKE_LIST, getBikeOptions } from '../../config/bikes.js';
import { formatPrice } from '../../utils/formatConfiguration.js';
import Icon from '../common/Icon.jsx';

const hero = BIKES.corsa;
const optionCount = BIKE_LIST.reduce((n, b) => n + getBikeOptions(b).length, 0);

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__copy">
        <p className="eyebrow reveal">Meridian Cycle Atelier · Made to order</p>
        <h1 id="hero-title" className="hero__title reveal">
          Built around
          <br />
          <em>you.</em>
        </h1>
        <p className="hero__lead reveal">
          Choose a platform, then shape every finish in real-time 3D — paint, rims, tyres, cockpit and accessories —
          and share the exact build in one tap.
        </p>
        <div className="hero__ctas reveal">
          <Link to={`/configurator/${hero.id}`} className="btn btn--primary btn--lg">
            Configure your bike <Icon name="arrowRight" size={18} />
          </Link>
          <a href="#models" className="btn btn--ghost btn--lg">
            Explore models
          </a>
        </div>
        <dl className="hero__stats reveal">
          <div>
            <dt>Platforms</dt>
            <dd>{BIKE_LIST.length}</dd>
          </div>
          <div>
            <dt>Configurable options</dt>
            <dd>{optionCount}</dd>
          </div>
          <div>
            <dt>Rendering</dt>
            <dd>Real-time</dd>
          </div>
        </dl>
      </div>

      <div className="hero__visual">
        <div className="hero__halo" aria-hidden="true" />
        <img
          src={hero.render}
          alt={`${hero.name} road bicycle, three-quarter view`}
          className="hero__bike"
          width="1600"
          height="1000"
          fetchPriority="high"
        />
        <aside className="hero__card glass" aria-label={`${hero.name} highlights`}>
          <p className="eyebrow">{hero.category}</p>
          <p className="hero__card-name">{hero.name}</p>
          <ul>
            {hero.specs.slice(1, 4).map((s) => (
              <li key={s.label}>
                <span>{s.label}</span>
                <span>{s.value}</span>
              </li>
            ))}
          </ul>
          <p className="hero__card-price">From {formatPrice(hero.basePrice)}</p>
        </aside>
      </div>
    </section>
  );
}
