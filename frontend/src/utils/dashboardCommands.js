export const DASHBOARD_COMMAND_EVENT = "healthguard:dashboard-command";

export const dispatchDashboardCommand = (command) => {
  if (!command || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DASHBOARD_COMMAND_EVENT, { detail: command }));
};
