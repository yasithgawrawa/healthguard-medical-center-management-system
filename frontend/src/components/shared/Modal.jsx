import { X } from "lucide-react";

// Shared Modal | Frontend Logic | Render a shared dialog with its title, content, and close action.
export const Modal = ({ open, title, subtitle, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-shell" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
};
