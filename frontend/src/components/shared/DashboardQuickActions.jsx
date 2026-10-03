import { ArrowRight } from "lucide-react";
import { dispatchDashboardCommand } from "../../utils/dashboardCommands.js";

const handleQuickAction = (href, command) => (event) => {
  if (href?.startsWith("#")) {
    event.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  dispatchDashboardCommand(command);
};

export const DashboardQuickActions = ({ title = "Quick Actions", actions = [] }) => (
  <section className="quick-actions-panel" id="work">
    <div className="quick-actions-header">
      <h2>{title}</h2>
      <span>{actions.length} shortcuts</span>
    </div>
    <div className="quick-actions-grid">
      {actions.map(({ label, detail, icon: Icon, href = "#", command }) => (
        <a className="quick-action-card" href={href} key={label} onClick={handleQuickAction(href, command)}>
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
