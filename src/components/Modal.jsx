import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, subtitle, children, footer }) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <div className="modal-sub">{subtitle}</div>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={17} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && (
          <div
            className="modal-body"
            style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
