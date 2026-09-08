import { Activity, ArrowUpRight } from "lucide-react";

export const DashboardCard = ({ title, value, detail, icon: Icon = Activity, change }) => (
  <article className="dashboard-card">
    <div className="dashboard-card-top">
      <span className="dashboard-card-label">{title}</span>
      <div className="dashboard-card-icon">
        <Icon size={18} />
      </div>
    </div>
    <strong>{value}</strong>
    {detail ? <p>{detail}</p> : null}
    {change ? (
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "8px", fontSize: "0.75rem", color: "var(--success)", fontWeight: "700" }}>
        <ArrowUpRight size={14} />
        <span>{change}</span>
      </div>
    ) : null}
  </article>
);
