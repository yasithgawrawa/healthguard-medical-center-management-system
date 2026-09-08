import { Activity, HeartPulse, Thermometer, UserCheck } from "lucide-react";
import { ClinicalWorkspacePanel } from "../../components/epic2_clinical/ClinicalWorkspacePanel.jsx";
import { StaffSelfServicePanel } from "../../components/epic1_user_staff/StaffSelfServicePanel.jsx";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";

export const NurseDashboard = () => (
  <div id="overview" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <div className="dashboard-header-banner">
      <div>
        <h1>Nurse Triage Station</h1>
        <p>Check in arriving patients, record vital signs and prepare them for doctor consultation.</p>
      </div>
      <div className="dashboard-live-indicator">
        <div className="live-dot" />
        <span>Triage Active</span>
      </div>
    </div>

    <div className="dashboard-grid">
      <DashboardCard title="Patient Check-In" value="Queue" detail="Mark arrivals and prepare records" icon={UserCheck} change="Live flow" />
      <DashboardCard title="Vitals" value="Capture" detail="Temperature, pulse and SpO2" icon={Thermometer} change="Saved" />
      <DashboardCard title="Triage" value="Monitor" detail="Track patient handoffs" icon={HeartPulse} change="Ready" />
    </div>

    <DashboardQuickActions
      actions={[
        { label: "Check In Patient", detail: "Mark appointment arrival", icon: UserCheck, href: "#patient-check-in-vitals" },
        { label: "Record Vitals", detail: "Capture vital signs", icon: Thermometer, href: "#patient-check-in-vitals" },
        { label: "Monitor Queue", detail: "Review appointment status", icon: Activity, href: "#patient-check-in-vitals" }
      ]}
    />

    <ClinicalWorkspacePanel mode="nurse" />
    <StaffSelfServicePanel />
  </div>
);
