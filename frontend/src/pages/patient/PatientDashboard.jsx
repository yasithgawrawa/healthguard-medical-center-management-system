import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { OperationPanel } from "../../components/shared/OperationPanel.jsx";
import { e2Actions } from "../../utils/operationConfigs.js";

export const PatientDashboard = () => (
  <div id="overview">
    <h1>Patient Dashboard</h1>
    <div className="dashboard-grid">
      <DashboardCard title="Appointments" value="Book" detail="Schedule and review visits" />
      <DashboardCard title="Lab Reports" value="View" detail="Access completed reports" />
      <DashboardCard title="Invoices" value="Track" detail="Review balances and receipts" />
    </div>
    <OperationPanel title="My Appointments" description="E2 appointment booking and history." listPath="/e2/clinical/appointments" actions={[e2Actions[0]]} />
    <OperationPanel title="My Invoices" description="E4 invoices and outstanding balances." listPath="/e4/billing/invoices" actions={[]} />
  </div>
);
