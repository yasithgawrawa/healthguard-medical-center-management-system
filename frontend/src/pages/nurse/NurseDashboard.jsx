import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { OperationPanel } from "../../components/shared/OperationPanel.jsx";
import { e2Actions } from "../../utils/operationConfigs.js";

export const NurseDashboard = () => (
  <div id="overview">
    <h1>Nurse Dashboard</h1>
    <div className="dashboard-grid">
      <DashboardCard title="Queue" value="Check-in" detail="Prepare patients for care" />
      <DashboardCard title="Vitals" value="Capture" detail="Temperature, pressure and SpO2" />
      <DashboardCard title="Patients" value="Track" detail="Monitor checked-in patients" />
    </div>
    <OperationPanel title="Patient Check-In And Vitals" description="E2 appointment status and vital-sign capture." listPath="/e2/clinical/appointments" actions={e2Actions.slice(0, 3)} />
  </div>
);
