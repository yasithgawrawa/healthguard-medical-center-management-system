import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { OperationPanel } from "../../components/shared/OperationPanel.jsx";
import { e1StaffActions, e1WorkforceActions } from "../../utils/operationConfigs.js";

export const AdminDashboard = () => (
  <div id="overview">
    <h1>Admin Dashboard</h1>
    <div className="dashboard-grid">
      <DashboardCard title="Staff" value="Manage" detail="Create, update and deactivate staff" />
      <DashboardCard title="Roles" value="RBAC" detail="Control permitted actions" />
      <DashboardCard title="Shifts" value="Plan" detail="Maintain staff schedules" />
    </div>
    <OperationPanel title="Staff Management" description="E1 staff CRUD with deactivation and role assignment." listPath="/e1/staff" actions={e1StaffActions} />
    <OperationPanel title="Workforce Management" description="E1 shifts, attendance and leave workflows." listPath="/e1/workforce/shifts" actions={e1WorkforceActions} />
  </div>
);
