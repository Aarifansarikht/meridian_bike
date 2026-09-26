import { useSelector } from 'react-redux';
import { selectConfigurationId, selectConfigurationSummary } from '../../store/selectors.js';
import { formatPrice } from '../../utils/formatConfiguration.js';

/** Read-only, dynamically generated summary of every active option. */
export default function ConfigurationSummary() {
  const summary = useSelector(selectConfigurationSummary);
  const configId = useSelector(selectConfigurationId);
  if (!summary) return null;

  return (
    <div className="summary">
      <div className="summary__head">
        <div>
          <p className="eyebrow">{summary.bike.category}</p>
          <h2 className="summary__title" id="summary-title">
            {summary.bike.name}
          </h2>
        </div>
        <div className="summary__id">
          <span>Configuration ID</span>
          <code>{configId}</code>
        </div>
      </div>

      <dl className="summary__groups">
        {summary.groups.map((g) => (
          <div key={g.id} className="summary__group">
            <dt className="summary__group-title">{g.label}</dt>
            {g.items.map((item) => (
              <dd key={item.id} className={`summary__row ${item.changed ? 'is-changed' : ''}`}>
                <span className="summary__label">{item.label}</span>
                <span className="summary__value">
                  {item.hex && <span className="summary__dot" style={{ background: item.hex }} aria-hidden="true" />}
                  {item.value}
                </span>
                <span className="summary__price">{item.price ? `${item.price > 0 ? '+' : '−'}${formatPrice(Math.abs(item.price))}` : ''}</span>
              </dd>
            ))}
          </div>
        ))}
      </dl>

      <div className="summary__total">
        <span>
          Estimated price <small>incl. base {formatPrice(summary.bike.basePrice)}</small>
        </span>
        <strong>{formatPrice(summary.price)}</strong>
      </div>
    </div>
  );
}
