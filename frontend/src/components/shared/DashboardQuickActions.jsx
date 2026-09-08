import { ArrowRight } from "lucide-react";

export const DashboardQuickActions = ({ title = "Quick Actions", actions = [] }) => (
  <section className="quick-actions-panel" id="work">
    <div className="quick-actions-header">
      <h2>{title}</h2>
      <span>{actions.length} shortcuts</span>
    </div>
    <div className="quick-actions-grid">
      {actions.map(({ label, detail, icon: Icon, href = "#" }) => (
        <a className="quick-action-card" href={href} key={label}>
          <div className="quick-action-icon">
            <Icon size={20} />
          </div>
          <div>
            <strong>{label}</strong>
            <p>{detail}</p>
          </div>
          <ArrowRight size={18} />
        </a>
      ))}
    </div>
  </section>
);
