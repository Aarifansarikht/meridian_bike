import { Link } from 'react-router-dom';

export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="logo" aria-label="Meridian Cycle Atelier — home">
      <svg viewBox="0 0 40 24" width="34" height="20" aria-hidden="true">
        <circle cx="9" cy="14" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="31" cy="14" r="7.5" fill="none" stroke="var(--accent)" strokeWidth="1.8" />
        <path d="M9 14 16 3h9l6 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      {!compact && (
        <span className="logo__word">
          MERIDIAN<span className="logo__sub">Cycle Atelier</span>
        </span>
      )}
    </Link>
  );
}
