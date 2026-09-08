import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal.jsx";

export const ConfirmDialog = ({ open, title, message, confirmLabel = "Confirm", busy, onCancel, onConfirm }) => (
  <Modal open={open} title={title} onClose={onCancel}>
    <div className="confirm-dialog-body">
      <div className="confirm-icon">
        <AlertTriangle size={22} />
      </div>
      <p>{message}</p>
    </div>
    <div className="modal-actions">
      <button className="button-secondary" type="button" onClick={onCancel} disabled={busy}>
        Cancel
      </button>
      <button className="button-primary danger-action" type="button" onClick={onConfirm} disabled={busy}>
        {busy ? "Please wait..." : confirmLabel}
      </button>
    </div>
  </Modal>
);
