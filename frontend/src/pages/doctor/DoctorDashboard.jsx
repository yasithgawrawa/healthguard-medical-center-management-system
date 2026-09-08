import { CalendarCheck, ClipboardPlus, FlaskConical, Pill, Stethoscope } from "lucide-react";
import { ClinicalWorkspacePanel } from "../../components/epic2_clinical/ClinicalWorkspacePanel.jsx";
import { StaffSelfServicePanel } from "../../components/epic1_user_staff/StaffSelfServicePanel.jsx";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";

export const DoctorDashboard = () => (
  <div id="overview" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <div className="dashboard-header-banner">
      <div>
        <h1>Doctor Workspace</h1>
        <p>Review appointments, record consultations, create prescriptions and request laboratory tests.</p>
      </div>
      <div className="dashboard-live-indicator">
        <div className="live-dot" />
        <span>Clinical Queue Active</span>
      </div>
    </div>

    <div className="dashboard-grid">
      <DashboardCard title="Appointments" value="Review" detail="See booked and checked-in patients" icon={CalendarCheck} change="Live queue" />
      <DashboardCard title="Consultations" value="Record" detail="Save diagnosis and clinical notes" icon={Stethoscope} change="Patient linked" />
      <DashboardCard title="Prescriptions" value="Create" detail="Prepare medicine instructions" icon={Pill} change="Pharmacy ready" />
    </div>

    <DashboardQuickActions
      actions={[
        { label: "Open Queue", detail: "Review booked patients", icon: CalendarCheck, href: "#clinical-workflow" },
        { label: "Record Diagnosis", detail: "Save consultation notes", icon: ClipboardPlus, href: "#clinical-workflow" },
        { label: "Request Lab Test", detail: "Send a test request to the lab", icon: FlaskConical, href: "#clinical-workflow" }
      ]}
    />

    <ClinicalWorkspacePanel mode="doctor" />
    <StaffSelfServicePanel />
  </div>
);
