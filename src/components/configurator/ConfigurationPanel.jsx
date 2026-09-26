import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentBike, selectPrice, selectVisibleCategories } from '../../store/selectors.js';
import { formatPrice } from '../../utils/formatConfiguration.js';
import OptionControl from './OptionControl.jsx';
import Icon from '../common/Icon.jsx';

/**
 * Category tabs + option list + price footer. On mobile the same component renders as a
 * bottom sheet (`sheet` = 'peek' | 'open').
 */
export default function ConfigurationPanel({ activeCategory, onCategoryChange, onReview, isMobile, sheet, onSheetChange }) {
  const bike = useSelector(selectCurrentBike);
  const categories = useSelector(selectVisibleCategories);
  const price = useSelector(selectPrice);
  const tabRefs = useRef({});
  const current = categories.find((c) => c.id === activeCategory) ?? categories[0];

  // Keep the active tab visible in the horizontally scrolling tab strip.
  useEffect(() => {
    tabRefs.current[current?.id]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [current?.id]);

  const onTabKey = (e, index) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    let next;
    if (delta) next = categories[(index + delta + categories.length) % categories.length];
    else if (e.key === 'Home') next = categories[0];
    else if (e.key === 'End') next = categories[categories.length - 1];
    if (!next) return;
    e.preventDefault();
    onCategoryChange(next.id);
    tabRefs.current[next.id]?.focus();
  };

  if (!bike || !current) return null;

  return (
    <aside
      className={`config-panel glass ${isMobile ? `config-panel--sheet is-${sheet}` : ''}`}
      aria-label={`${bike.name} configuration`}
    >
      {isMobile && (
        <button
          type="button"
          className="sheet-handle"
          aria-expanded={sheet === 'open'}
          aria-label={sheet === 'open' ? 'Collapse options' : 'Expand options'}
          onClick={() => onSheetChange(sheet === 'open' ? 'peek' : 'open')}
        >
          <span aria-hidden="true" />
        </button>
      )}

      <div className="config-panel__tabs" role="tablist" aria-label="Configuration categories">
        {categories.map((c, i) => (
          <button
            key={c.id}
            ref={(el) => (tabRefs.current[c.id] = el)}
            type="button"
            role="tab"
            id={`tab-${c.id}`}
            aria-selected={c.id === current.id}
            aria-controls={`panel-${c.id}`}
            tabIndex={c.id === current.id ? 0 : -1}
            className="tab"
            onClick={() => {
              onCategoryChange(c.id);
              if (isMobile && sheet !== 'open') onSheetChange('open');
            }}
            onKeyDown={(e) => onTabKey(e, i)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div
        className="config-panel__body"
        role="tabpanel"
        id={`panel-${current.id}`}
        aria-labelledby={`tab-${current.id}`}
        key={current.id}
      >
        {current.options.map((option) => (
          <OptionControl key={option.id} option={option} />
        ))}
        {bike.note && current.id === categories[0].id && (
          <p className="config-panel__note">
            <Icon name="info" size={16} /> {bike.note}
          </p>
        )}
      </div>

      <footer className="config-panel__footer">
        <div className="price">
          <span className="price__label">Estimated price</span>
          <span className="price__value" aria-live="polite">
            {formatPrice(price)}
          </span>
        </div>
        <button type="button" className="btn btn--primary" onClick={onReview}>
          Review &amp; share <Icon name="arrowRight" size={16} />
        </button>
      </footer>
    </aside>
  );
}
