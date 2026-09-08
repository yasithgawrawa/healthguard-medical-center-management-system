import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { OperationPanel } from "../../components/shared/OperationPanel.jsx";
import { e3Actions } from "../../utils/operationConfigs.js";

export const PharmacistDashboard = () => (
  <div id="overview">
    <h1>Pharmacist Dashboard</h1>
    <div className="dashboard-grid">
      <DashboardCard title="Medicines" value="CRUD" detail="Manage catalog and batches" />
      <DashboardCard title="Stock" value="Watch" detail="Low-stock and expiry alerts" />
      <DashboardCard title="Sales" value="Dispense" detail="Deduct trusted backend stock" />
    </div>
    <OperationPanel title="Inventory And Pharmacy" description="E3 medicines, suppliers, batches, purchases and sales." listPath="/e3/inventory/medicines" actions={e3Actions} />
  </div>
);
