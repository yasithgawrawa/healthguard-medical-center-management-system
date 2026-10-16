// Define and dispatch browser events that connect dashboard shortcuts to workspaces.
export const DASHBOARD_COMMAND_EVENT = "healthguard:dashboard-command";

// Broadcast a custom browser event for dashboard workspace actions.
export const dispatchDashboardCommand = (command) => {
  if (!command || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DASHBOARD_COMMAND_EVENT, { detail: command }));
};
