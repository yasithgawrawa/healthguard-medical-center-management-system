import { Activity, ArrowUpRight } from "lucide-react";
import { dispatchDashboardCommand } from "../../utils/dashboardCommands.js";

const handleCardClick = (href, onClick, command) => (event) => {
  if (onClick) onClick(event);
  if (!event.defaultPrevented && href?.startsWith("#")) {
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (!event.defaultPrevented) dispatchDashboardCommand(command);
};

export const DashboardCard = ({
  title,
  value,
  detail,
  icon: Icon = Activity,
  change,
  href,
  onClick,
  command,
  actionLabel,
  priority = "normal"
}) => {
  const clickable = Boolean(href || onClick || command);
  const Tag = clickable ? "button" : "article";
  const props = clickable
    ? {
        type: "button",
        onClick: handleCardClick(href, onClick, command),
        className: `dashboard-card dashboard-card-clickable dashboard-card-${priority}`
      }
    : {
        className: `dashboard-card dashboard-card-${priority}`
      };

  return (
  <Tag {...props}>
    <div className="dashboard-card-top">
      <span className="dashboard-card-label">{title}</span>
      <div className="dashboard-card-icon">
        <Icon size={18} />
      </div>
    </div>
    <strong>{value}</strong>
    {detail ? <p>{detail}</p> : null}
    {change ? (
      <div className="dashboard-card-change">
        <ArrowUpRight size={14} />
        <span>{change}</span>
      </div>
    ) : null}
    {actionLabel ? <span className="dashboard-card-action">{actionLabel}</span> : null}
  </Tag>
  );
};
