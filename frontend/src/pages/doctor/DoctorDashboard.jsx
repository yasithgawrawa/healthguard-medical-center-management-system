import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { OperationPanel } from "../../components/shared/OperationPanel.jsx";
import { e2Actions } from "../../utils/operationConfigs.js";

export const DoctorDashboard = () => (
  <div id="overview">
    <h1>Doctor Dashboard</h1>
    <div className="dashboard-grid">
      <DashboardCard title="Appointments" value="Today" detail="Consultation queue" />
      <DashboardCard title="Diagnosis" value="Record" detail="Clinical notes and care plans" />
      <DashboardCard title="Prescriptions" value="Create" detail="Send to pharmacy workflow" />
    </div>
    <OperationPanel title="Clinical Workflow" description="E2 appointments, vitals, consultations, prescriptions and lab requests." listPath="/e2/clinical/appointments" actions={e2Actions} />
  </div>
);
