import { CalendarCheck, CheckCircle2, ClipboardPlus, FlaskConical, Stethoscope, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { ClinicalWorkspacePanel } from "../../components/epic2_clinical/ClinicalWorkspacePanel.jsx";
import { StaffSelfServicePanel } from "../../components/epic1_user_staff/StaffSelfServicePanel.jsx";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";
import { clinicalApi } from "../../services/clinicalApi.js";

export const DoctorDashboard = () => {
  const [metrics, setMetrics] = useState({
    waitingCount: 0,
    todayApptCount: 0,
    completedCount: 0,
    labOrderCount: 0
  });

  useEffect(() => {
    Promise.all([
      clinicalApi.listAppointments().catch(() => []),
      clinicalApi.listLabRequests().catch(() => [])
    ]).then(([appointments, labRequests]) => {
      const today = new Date().toISOString().slice(0, 10);
      const todayAppts = (appointments || []).filter((a) => (a.appointmentDate || "").slice(0, 10) === today);
      const waiting = (appointments || []).filter((a) => a.status === "checked_in");
      const completed = (appointments || []).filter((a) => a.status === "completed");

      setMetrics({
        waitingCount: waiting.length,
        todayApptCount: todayAppts.length || appointments.filter((a) => ["booked", "checked_in"].includes(a.status)).length,
        completedCount: completed.length,
        labOrderCount: (labRequests || []).length
      });
    });
  }, []);

  return (
    <div id="overview" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="dashboard-header-banner">
        <div>
          <h1>Doctor Workspace</h1>
          <p>Review appointments, record consultations, issue handwritten prescriptions and request laboratory tests.</p>
        </div>
        <div className="dashboard-live-indicator">
          <div className="live-dot" />
          <span>Clinical Queue Active</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <DashboardCard
          title="Waiting For Doctor"
          value={`${metrics.waitingCount} Patients`}
          detail={metrics.waitingCount > 0 ? "Checked in & ready for consultation" : "No patients in waiting room"}
          icon={UserCheck}
          change={metrics.waitingCount > 0 ? "In Triage" : "Queue Clear"}
        />
        <DashboardCard
          title="Active Appointment Queue"
          value={`${metrics.todayApptCount} Scheduled`}
          detail="Booked patient visits in system"
          icon={CalendarCheck}
          change="Live Queue"
        />
        <DashboardCard
          title="Completed Consultations"
          value={`${metrics.completedCount} Finalized`}
          detail="Visits with diagnosis & handwritten Rx"
          icon={Stethoscope}
          change="Care Delivered"
        />
        <DashboardCard
          title="Diagnostic Lab Orders"
          value={`${metrics.labOrderCount} Requests`}
          detail="Laboratory investigations ordered"
          icon={FlaskConical}
          change="Lab Tracking"
        />
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
};
