import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { OperationPanel } from "../../components/shared/OperationPanel.jsx";
import { commonId } from "../../utils/operationConfigs.js";

const labActions = [
  {
    label: "Update Lab Request",
    method: "patch",
    path: "/e2/clinical/lab-requests/:id",
    fields: [
      commonId,
      { name: "status", label: "Status", type: "select", required: true, options: [
        { value: "verified", label: "Verified" },
        { value: "in_progress", label: "In progress" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" }
      ] },
      { name: "resultSummary", label: "Result summary" },
      { name: "resultUrl", label: "Result URL" }
    ]
  }
];

export const LabDashboard = () => (
  <div id="overview">
    <h1>Laboratory Dashboard</h1>
    <div className="dashboard-grid">
      <DashboardCard title="Requests" value="Verify" detail="Review new lab requests" />
      <DashboardCard title="Progress" value="Update" detail="Track sample processing" />
      <DashboardCard title="Results" value="Upload" detail="Publish completed test results" />
    </div>
    <OperationPanel title="Laboratory Requests" description="E2 lab verification, progress and result updates." listPath="/e2/clinical/lab-requests" actions={labActions} />
  </div>
);
