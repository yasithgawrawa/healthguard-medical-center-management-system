import { CalendarCheck, CheckCircle2, ClipboardPlus, DollarSign, Edit3, FlaskConical, Stethoscope, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { ClinicalWorkspacePanel } from "../../components/epic2_clinical/ClinicalWorkspacePanel.jsx";
import { StaffSelfServicePanel } from "../../components/epic1_user_staff/StaffSelfServicePanel.jsx";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";
import { Modal } from "../../components/shared/Modal.jsx";
import { Toast } from "../../components/shared/Toast.jsx";
import { FormInput } from "../../components/shared/forms/FormInput.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { clinicalApi } from "../../services/clinicalApi.js";

const money = (val) => `Rs. ${Number(val || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    waitingCount: 0,
    todayApptCount: 0,
    completedCount: 0,
    labOrderCount: 0
  });
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [myFee, setMyFee] = useState(user?.consultationFee || 1500);
  const [newFeeInput, setNewFeeInput] = useState(user?.consultationFee || 1500);
  const [busyFee, setBusyFee] = useState(false);
  const [toast, setToast] = useState(null);

  const loadData = () => {
    Promise.all([
      clinicalApi.listAppointments().catch(() => []),
      clinicalApi.listLabRequests().catch(() => []),
      clinicalApi.listDoctors().catch(() => [])
    ]).then(([appointments, labRequests, doctors]) => {
      const today = new Date().toISOString().slice(0, 10);
      const todayAppts = (appointments || []).filter((a) => (a.appointmentDate || "").slice(0, 10) === today);
      const waiting = (appointments || []).filter((a) => a.status === "checked_in");
      const completed = (appointments || []).filter((a) => a.status === "completed");

      const me = doctors.find((d) => d._id === user?._id || d.email === user?.email);
      if (me?.consultationFee) {
        setMyFee(me.consultationFee);
        setNewFeeInput(me.consultationFee);
      }

      setMetrics({
        waitingCount: waiting.length,
        todayApptCount: todayAppts.length || appointments.filter((a) => ["booked", "checked_in"].includes(a.status)).length,
        completedCount: completed.length,
        labOrderCount: (labRequests || []).length
      });
    });
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSaveFee = async (e) => {
    e.preventDefault();
    setBusyFee(true);
    try {
      const val = Number(newFeeInput);
      if (isNaN(val) || val < 0) {
        setToast({ type: "error", message: "Please enter a valid consultation fee" });
        setBusyFee(false);
        return;
      }
      await clinicalApi.updateDoctorFee({ consultationFee: val });
      setMyFee(val);
      setToast({ type: "success", message: `Consultation fee updated to ${money(val)}` });
      setFeeModalOpen(false);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Failed to update fee" });
    } finally {
      setBusyFee(false);
    }
  };

  return (
    <div id="overview" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="dashboard-header-banner">
        <div>
          <h1>Doctor Workspace</h1>
          <p>Review appointments, record consultations, issue handwritten prescriptions and request laboratory tests.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ background: "#ffffff", padding: "6px 14px", borderRadius: "8px", border: "1px solid #bae6fd", display: "flex", alignItems: "center", gap: "8px" }}>
            <DollarSign size={15} color="#0284c7" />
            <span style={{ fontSize: "0.85rem", color: "#0f172a" }}>
              My Channelling Fee: <strong style={{ color: "#0284c7" }}>{money(myFee)}</strong>
            </span>
            <button
              type="button"
              className="table-link-button"
              style={{ fontSize: "0.78rem", padding: "2px 6px" }}
              onClick={() => { setNewFeeInput(myFee); setFeeModalOpen(true); }}
            >
              <Edit3 size={12} style={{ display: "inline", marginRight: "2px" }} /> Edit
            </button>
          </div>
          <div className="dashboard-live-indicator">
            <div className="live-dot" />
            <span>Clinical Queue Active</span>
          </div>
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

      <Modal
        open={feeModalOpen}
        title="Update My Consultation / Channelling Fee"
        subtitle="This fee will automatically apply to patient appointments booked with you."
        onClose={() => setFeeModalOpen(false)}
      >
        <form onSubmit={handleSaveFee} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-grid">
            <FormInput
              label="Consultation Fee (Rs.)"
              type="number"
              min="0"
              step="100"
              placeholder="2000.00"
              value={newFeeInput}
              onChange={(e) => setNewFeeInput(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button className="button-secondary" type="button" onClick={() => setFeeModalOpen(false)} disabled={busyFee}>Cancel</button>
            <button className="button-primary" type="submit" disabled={busyFee}>{busyFee ? "Saving..." : "Save Fee"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
