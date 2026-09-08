import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { OperationPanel } from "../../components/shared/OperationPanel.jsx";
import { e1WorkforceActions, e3Actions, e4Actions } from "../../utils/operationConfigs.js";

export const ManagerDashboard = () => (
  <div id="overview">
    <h1>Manager Dashboard</h1>
    <div className="dashboard-grid">
      <DashboardCard title="Workforce" value="Monitor" detail="Attendance, shifts and leave" />
      <DashboardCard title="Inventory" value="Alerts" detail="Low-stock and expiry view" />
      <DashboardCard title="Finance" value="Reports" detail="Revenue, invoices and payroll" />
    </div>
    <OperationPanel title="Workforce Monitoring" description="E1 attendance, shifts and leave review." listPath="/e1/workforce/attendance" actions={e1WorkforceActions} />
    <OperationPanel title="Inventory Oversight" description="E3 stock, supplier and pharmacy workflows." listPath="/e3/inventory/alerts" actions={e3Actions} />
    <OperationPanel title="Finance And Payroll" description="E4 revenue, payment and payroll workflows." listPath="/e4/billing/summary" actions={e4Actions} />
  </div>
);
