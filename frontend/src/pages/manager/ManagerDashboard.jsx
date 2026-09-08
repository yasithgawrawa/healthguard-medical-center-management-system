import { CalendarPlus, ClipboardCheck, ClipboardList } from "lucide-react";
import { BillingWorkspacePanel } from "../../components/epic4_billing/BillingWorkspacePanel.jsx";
import { InventoryWorkspacePanel } from "../../components/epic3_inventory/InventoryWorkspacePanel.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";
import { WorkforceManagementPanel } from "../../components/epic1_user_staff/WorkforceManagementPanel.jsx";

export const ManagerDashboard = () => (
  <div id="overview" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <div className="dashboard-header-banner">
      <div>
        <h1>Manager Overview</h1>
        <p>Plan shifts, monitor attendance and review leave requests for day-to-day staffing.</p>
      </div>
      <div className="dashboard-live-indicator">
        <div className="live-dot" />
        <span>Operations Normal</span>
      </div>
    </div>

    <DashboardQuickActions
      actions={[
        { label: "Create Shift", detail: "Schedule active staff", icon: CalendarPlus, href: "#manager-workforce" },
        { label: "Review Attendance", detail: "Search staff attendance records", icon: ClipboardCheck, href: "#manager-workforce" },
        { label: "Review Leave", detail: "Approve or reject requests", icon: ClipboardList, href: "#manager-workforce" },
        { label: "Finance Reports", detail: "Revenue, outstanding and payroll", icon: ClipboardCheck, href: "#billing-payments" }
      ]}
    />

    <WorkforceManagementPanel />
    <InventoryWorkspacePanel />
    <BillingWorkspacePanel />
  </div>
);
