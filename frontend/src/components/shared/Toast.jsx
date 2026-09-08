import { AlertCircle, CheckCircle2 } from "lucide-react";

export const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  const Icon = toast.type === "error" ? AlertCircle : CheckCircle2;

  return (
    <div className={`toast toast-${toast.type || "success"}`}>
      <Icon size={18} />
      <span>{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification">
        Close
      </button>
    </div>
  );
};
