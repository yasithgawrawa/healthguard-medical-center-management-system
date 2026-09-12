const STATUS_CONFIGS = {
  booked: { label: "Booked", color: "#475569", bg: "#f1f5f9", border: "#e2e8f0", dot: "#94a3b8" },
  scheduled: { label: "Scheduled", color: "#475569", bg: "#f1f5f9", border: "#e2e8f0", dot: "#94a3b8" },
  checked_in: { label: "Checked In", color: "#92400e", bg: "#fef3c7", border: "#fde68a", dot: "#d97706" },
  waiting: { label: "Waiting Room", color: "#92400e", bg: "#fef3c7", border: "#fde68a", dot: "#d97706" },
  in_consultation: { label: "In Consultation", color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd", dot: "#0284c7" },
  in_progress: { label: "In Progress", color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd", dot: "#0284c7" },
  completed: { label: "Completed", color: "#15803d", bg: "#dcfce7", border: "#bbf7d0", dot: "#16a34a" },
  paid: { label: "Paid", color: "#15803d", bg: "#dcfce7", border: "#bbf7d0", dot: "#16a34a" },
  reconciled: { label: "Reconciled", color: "#15803d", bg: "#dcfce7", border: "#bbf7d0", dot: "#16a34a" },
  issued: { label: "Issued / Unpaid", color: "#92400e", bg: "#fef3c7", border: "#fde68a", dot: "#d97706" },
  partially_paid: { label: "Partially Paid", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", dot: "#2563eb" },
  cancelled: { label: "Cancelled", color: "#be123c", bg: "#ffe4e6", border: "#fecdd3", dot: "#e11d48" },
  active: { label: "Active", color: "#15803d", bg: "#dcfce7", border: "#bbf7d0", dot: "#16a34a" },
  inactive: { label: "Inactive", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0", dot: "#94a3b8" },
  pending: { label: "Pending", color: "#b45309", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" },
  verified: { label: "Verified", color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4", dot: "#0f766e" }
};

export const StatusBadge = ({ status }) => {
  const normalized = String(status || "").toLowerCase().trim();
  const config = STATUS_CONFIGS[normalized] || {
    label: normalized.replace(/_/g, " ") || "Unknown",
    color: "#475569",
    bg: "#f1f5f9",
    border: "#e2e8f0",
    dot: "#94a3b8"
  };

  return (
    <span
      className={`status-badge status-${normalized.replace(/_/g, "-")}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 9px",
        borderRadius: "12px",
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.01em",
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        whiteSpace: "nowrap"
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: config.dot,
          flexShrink: 0
        }}
      />
      {config.label}
    </span>
  );
};
