import { Activity, HeartPulse, Stethoscope, Thermometer, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { ClinicalWorkspacePanel } from "../../components/epic2_clinical/ClinicalWorkspacePanel.jsx";
import { StaffSelfServicePanel } from "../../components/epic1_user_staff/StaffSelfServicePanel.jsx";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";
import { clinicalApi } from "../../services/clinicalApi.js";
import { e1Api } from "../../services/e1Api.js";

export const NurseDashboard = () => {
  const [metrics, setMetrics] = useState({
    awaitingArrival: 0,
    inTriage: 0,
    vitalsDone: 0,
    activeDoctors: 0
  });

  useEffect(() => {
    Promise.all([
      clinicalApi.listAppointments().catch(() => []),
      e1Api.listStaff().catch(() => [])
    ]).then(([appointments, staffList]) => {
      const booked = (appointments || []).filter((a) => a.status === "booked");
      const checkedIn = (appointments || []).filter((a) => a.status === "checked_in");
      const vitalsCompleted = (appointments || []).filter((a) => ["in_consultation", "completed"].includes(a.status) || a.vitals);
      const doctors = (staffList || []).filter((s) => s.role === "doctor" && s.status === "active");

      setMetrics({
        awaitingArrival: booked.length,
        inTriage: checkedIn.length,
        vitalsDone: vitalsCompleted.length,
        activeDoctors: doctors.length
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
        />
        <DashboardCard
          title="In Triage (Needs Vitals)"
          value={`${metrics.inTriage} In Clinic`}
          detail={metrics.inTriage > 0 ? "Arrived patients awaiting vitals capture" : "Triage station clear"}
          icon={UserCheck}
          change={metrics.inTriage > 0 ? "Immediate Action" : "Up To Date"}
        />
        <DashboardCard
          title="Vitals Recorded"
          value={`${metrics.vitalsDone} Handed Off`}
          detail="Temperature, BP, Pulse & SpO2 recorded"
          icon={Thermometer}
          change="Baseline Logged"
        />
        <DashboardCard
          title="Active Doctors On Duty"
          value={`${metrics.activeDoctors} Available`}
          detail="OPD consultation room physicians"
          icon={Stethoscope}
          change="Clinicians Active"
        />
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
};
