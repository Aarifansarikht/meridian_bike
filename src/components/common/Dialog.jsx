import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

/**
 * Accessible modal built on the native <dialog> element (focus trapping, Esc to close,
 * inert background). Closes on backdrop click.
 */
export default function Dialog({ open, onClose, labelledBy, className = '', children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog__surface">
        <button type="button" className="icon-btn dialog__close" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
        {open && children}
      </div>
    </dialog>
  );
}
