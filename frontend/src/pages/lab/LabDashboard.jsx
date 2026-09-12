import { AlertCircle, CheckCircle2, FlaskConical, Microscope } from "lucide-react";
import { useEffect, useState } from "react";
import { ClinicalWorkspacePanel } from "../../components/epic2_clinical/ClinicalWorkspacePanel.jsx";
import { StaffSelfServicePanel } from "../../components/epic1_user_staff/StaffSelfServicePanel.jsx";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";
import { clinicalApi } from "../../services/clinicalApi.js";

export const LabDashboard = () => {
  const [metrics, setMetrics] = useState({
    requestedCount: 0,
    urgentCount: 0,
    inProgressCount: 0,
    completedCount: 0
  });

  useEffect(() => {
    clinicalApi.listLabRequests().then((labs) => {
      const list = labs || [];
      const requested = list.filter((l) => l.status === "requested");
      const urgent = list.filter((l) => l.priority === "urgent" && l.status !== "completed");
      const inProgress = list.filter((l) => ["verified", "in_progress"].includes(l.status));
      const completed = list.filter((l) => l.status === "completed");

      setMetrics({
        requestedCount: requested.length,
        urgentCount: urgent.length,
        inProgressCount: inProgress.length,
        completedCount: completed.length
      });
    }).catch(() => {});
  }, []);

  return (
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
        <DashboardCard
          title="New Test Requests"
          value={`${metrics.requestedCount} Orders`}
          detail={metrics.requestedCount > 0 ? "Awaiting technician verification" : "No unverified test requests"}
          icon={FlaskConical}
          change={metrics.requestedCount > 0 ? "Intake Queue" : "Clear"}
        />
        <DashboardCard
          title="Urgent Priority Tests"
          value={`${metrics.urgentCount} Urgent`}
          detail={metrics.urgentCount > 0 ? "Immediate diagnostic turnaround" : "No urgent tests pending"}
          icon={AlertCircle}
          change={metrics.urgentCount > 0 ? "High Priority" : "Normal"}
        />
        <DashboardCard
          title="Under Processing"
          value={`${metrics.inProgressCount} Samples`}
          detail="Samples undergoing active bench analysis"
          icon={Microscope}
          change="In Laboratory"
        />
        <DashboardCard
          title="Reports Published"
          value={`${metrics.completedCount} Complete`}
          detail="Results visible to physicians & patients"
          icon={CheckCircle2}
          change="Diagnostics Online"
        />
      </div>

      <DashboardQuickActions
        actions={[
          { label: "Verify Request", detail: "Accept test orders", icon: CheckCircle2, href: "#laboratory-results" },
          { label: "Update Progress", detail: "Mark processing status", icon: Microscope, href: "#laboratory-results" },
          { label: "Publish Result", detail: "Add summary or file link", icon: FlaskConical, href: "#laboratory-results" }
        ]}
      />

      <ClinicalWorkspacePanel mode="lab" />
      <StaffSelfServicePanel />
    </div>
  );
};
