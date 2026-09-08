import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { OperationPanel } from "../../components/shared/OperationPanel.jsx";
import { e4Actions } from "../../utils/operationConfigs.js";

export const CashierDashboard = () => (
  <div id="overview">
    <h1>Cashier Dashboard</h1>
    <div className="dashboard-grid">
      <DashboardCard title="Invoices" value="Generate" detail="Create service invoices" />
      <DashboardCard title="Payments" value="Record" detail="Verify and reconcile payments" />
      <DashboardCard title="Receipts" value="Issue" detail="Receipts from successful payments" />
    </div>
    <OperationPanel title="Billing And Payments" description="E4 invoices, payments, receipts and revenue state." listPath="/e4/billing/invoices" actions={e4Actions.slice(0, 2)} />
  </div>
);
