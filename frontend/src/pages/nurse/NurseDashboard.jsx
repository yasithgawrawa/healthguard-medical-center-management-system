import { Activity, Thermometer, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { ClinicalWorkspacePanel } from "../../components/epic2_clinical/ClinicalWorkspacePanel.jsx";
import { StaffSelfServicePanel } from "../../components/epic1_user_staff/StaffSelfServicePanel.jsx";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { clinicalApi } from "../../services/clinicalApi.js";

export const NurseDashboard = () => {
  const [metrics, setMetrics] = useState({
    awaitingArrival: 0,
    inTriage: 0,
    vitalsDone: 0
  });

  useEffect(() => {
    clinicalApi.listAppointments().catch(() => []).then((appointments) => {
      const today = new Date().toLocaleDateString("en-CA");
      const todayAppointments = (appointments || []).filter((appointment) => (
        new Date(appointment.appointmentDate).toLocaleDateString("en-CA") === today
      ));
      const booked = todayAppointments.filter((a) => a.status === "booked");
      const checkedIn = todayAppointments.filter((a) => a.status === "checked_in" && !a.vitals);
      const vitalsCompleted = todayAppointments.filter((a) => a.vitals);

      setMetrics({
        awaitingArrival: booked.length,
        inTriage: checkedIn.length,
        vitalsDone: vitalsCompleted.length
      });
    });
  }, []);

  return (
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
        <DashboardCard
          title="Awaiting Arrival"
          value={`${metrics.awaitingArrival} Expected`}
          detail="Booked patients scheduled for check-in"
          icon={Activity}
          change="Arrival Queue"
          href="#patient-check-in-vitals"
          command={{ workspace: "clinical", mode: "nurse", queueTab: "booked", dateScope: "today", status: "", priority: "", search: "" }}
          actionLabel="Open check-in queue"
          priority={metrics.awaitingArrival > 0 ? "medium" : "normal"}
        />
        <DashboardCard
          title="In Triage (Needs Vitals)"
          value={`${metrics.inTriage} In Clinic`}
          detail={metrics.inTriage > 0 ? "Arrived patients awaiting vitals capture" : "Triage station clear"}
          icon={UserCheck}
          change={metrics.inTriage > 0 ? "Immediate Action" : "Up To Date"}
          href="#patient-check-in-vitals"
          command={{ workspace: "clinical", mode: "nurse", queueTab: "waiting", dateScope: "today", status: "", priority: "", search: "" }}
          actionLabel={metrics.inTriage > 0 ? "Record vitals now" : "Monitor triage"}
          priority={metrics.inTriage > 0 ? "high" : "normal"}
        />
        <DashboardCard
          title="Vitals Recorded"
          value={`${metrics.vitalsDone} Handed Off`}
          detail="Today's patients with recorded vital signs"
          icon={Thermometer}
          change="Baseline Logged"
          href="#patient-check-in-vitals"
          command={{ workspace: "clinical", mode: "nurse", queueTab: "vitals_recorded", dateScope: "today", status: "", priority: "", search: "" }}
          actionLabel="Review recorded vitals"
        />
      </div>

      <ClinicalWorkspacePanel mode="nurse" />
      <StaffSelfServicePanel />
    </div>
  );
};
