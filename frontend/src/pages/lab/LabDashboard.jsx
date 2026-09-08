import { CheckCircle2, FlaskConical, Microscope, UploadCloud } from "lucide-react";
import { ClinicalWorkspacePanel } from "../../components/epic2_clinical/ClinicalWorkspacePanel.jsx";
import { StaffSelfServicePanel } from "../../components/epic1_user_staff/StaffSelfServicePanel.jsx";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";

export const LabDashboard = () => (
  <div id="overview" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <div className="dashboard-header-banner">
      <div>
        <h1>Laboratory Workspace</h1>
        <p>Review requested tests, update sample progress and publish completed results to patient records.</p>
      </div>
      <div className="dashboard-live-indicator">
        <div className="live-dot" />
        <span>Lab Queue Live</span>
      </div>
    </div>

    <div className="dashboard-grid">
      <DashboardCard title="Requests" value="Verify" detail="Review new doctor orders" icon={FlaskConical} change="Queue Ready" />
      <DashboardCard title="Processing" value="Track" detail="Move samples through lab stages" icon={Microscope} change="In Progress" />
      <DashboardCard title="Results" value="Publish" detail="Attach summaries and report links" icon={UploadCloud} change="Patient Visible" />
    </div>

    <DashboardQuickActions
      actions={[
        { label: "Verify Request", detail: "Accept test orders", icon: CheckCircle2, href: "#laboratory-results" },
        { label: "Update Progress", detail: "Mark processing status", icon: Microscope, href: "#laboratory-results" },
        { label: "Publish Result", detail: "Add summary or file link", icon: UploadCloud, href: "#laboratory-results" }
      ]}
    />

    <ClinicalWorkspacePanel mode="lab" />
    <StaffSelfServicePanel />
  </div>
);
