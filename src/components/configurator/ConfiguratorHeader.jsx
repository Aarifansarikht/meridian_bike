import { NavLink } from 'react-router-dom';
import { BIKE_LIST } from '../../config/bikes.js';
import { useConfiguratorActions, useHistoryState } from '../../hooks/useBikeConfiguration.js';
import Logo from '../common/Logo.jsx';
import Icon from '../common/Icon.jsx';
import { preloadBike } from '../three/BikeModel.jsx';

function IconButton({ icon, label, onClick, disabled }) {
  return (
    <button type="button" className="icon-btn" onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      <Icon name={icon} />
    </button>
  );
}

export default function ConfiguratorHeader({ bike, onShare, isMobile }) {
  const { undo, redo, reset } = useConfiguratorActions();
  const { canUndo, canRedo } = useHistoryState();

  return (
    <header className="cfg-header">
      <Logo compact={isMobile} />

      <nav className="bike-switch glass" aria-label="Choose model">
        {BIKE_LIST.map((b) => (
          <NavLink
            key={b.id}
            to={`/configurator/${b.id}`}
            className="bike-switch__item"
            aria-current={b.id === bike.id ? 'page' : undefined}
            onPointerEnter={() => preloadBike(b)}
            onFocus={() => preloadBike(b)}
          >
            {isMobile ? b.category : b.name}
          </NavLink>
        ))}
      </nav>

      <div className="cfg-header__actions">
        {!isMobile && (
          <div className="glass icon-group">
            <IconButton icon="undo" label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo} />
            <IconButton icon="redo" label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo} />
            <IconButton icon="reset" label="Reset to factory" onClick={reset} />
          </div>
        )}
        <button type="button" className="btn btn--light" onClick={onShare}>
          <Icon name="share" size={16} />
          {!isMobile && 'Share'}
          {isMobile && <span className="visually-hidden">Share</span>}
        </button>
      </div>
    </header>
  );
}
