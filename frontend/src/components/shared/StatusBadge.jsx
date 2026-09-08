export const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${String(status || "neutral").replace(/_/g, "-")}`}>
    {String(status || "not set").replace(/_/g, " ")}
  </span>
);
