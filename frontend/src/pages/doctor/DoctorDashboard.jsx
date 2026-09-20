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
import { billingApi } from "../../services/billingApi.js";

const money = (val) => `Rs. ${Number(val || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    waitingCount: 0,
    todayApptCount: 0,
    completedCount: 0,
    labOrderCount: 0
  });
  const [earnings, setEarnings] = useState({
    totalAppointments: 0,
    completedConsultations: 0,
    consultationFeesBilled: 0,
    consultationFeesCollected: 0,
    outstandingFees: 0,
    consultations: []
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
      clinicalApi.listDoctors().catch(() => []),
      billingApi.doctorEarnings().catch(() => null)
    ]).then(([appointments, labRequests, doctors, earningsData]) => {
      const apptList = Array.isArray(appointments) ? appointments : [];
      const labList = Array.isArray(labRequests) ? labRequests : [];
      const docList = Array.isArray(doctors) ? doctors : [];
      const today = new Date().toISOString().slice(0, 10);
      const todayAppts = apptList.filter((a) => (a.appointmentDate || "").slice(0, 10) === today);
      const waiting = apptList.filter((a) => a.status === "checked_in");
      const completed = apptList.filter((a) => a.status === "completed");

      const me = docList.find((d) => d._id === user?._id || d.email === user?.email);
      if (me?.consultationFee) {
        setMyFee(me.consultationFee);
        setNewFeeInput(me.consultationFee);
      }

      if (earningsData) {
        setEarnings(earningsData);
      }

      setMetrics({
        waitingCount: waiting.length,
        todayApptCount: todayAppts.length || apptList.filter((a) => ["booked", "checked_in"].includes(a.status)).length,
        completedCount: completed.length,
        labOrderCount: labList.length
      });
    });
  };

  useEffect(() => {
    loadData();
    const handleFocus = () => loadData();
    window.addEventListener("focus", handleFocus);
    const interval = setInterval(loadData, 15000);
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
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
          <div style={{ background: "var(--success-bg)", padding: "6px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--success-border)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--success)" }}>
              👑 Clinic Owner
            </span>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.9)", padding: "6px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line-brand)", display: "flex", alignItems: "center", gap: "8px" }}>
            <DollarSign size={15} color="var(--accent-sky)" />
            <span style={{ fontSize: "0.85rem", color: "var(--ink-800)" }}>
              My Channelling Fee: <strong style={{ color: "var(--accent-sky)" }}>{money(myFee)}</strong>
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

      <div style={{
        background: "linear-gradient(135deg, rgba(236, 253, 245, 0.7) 0%, rgba(224, 242, 254, 0.7) 100%)",
        border: "1px solid var(--success-border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        boxShadow: "var(--shadow-sm)",
        backdropFilter: "blur(8px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, var(--success), var(--accent-emerald))", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 700, boxShadow: "0 4px 12px rgba(5, 150, 105, 0.2)" }}>
            🩺
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "var(--ink-900)", fontSize: "1.05rem", fontFamily: "var(--font-heading)" }}>
              Clinic Owner Compensation Model
            </div>
            <div style={{ color: "var(--ink-700)", fontSize: "0.85rem", marginTop: "2px" }}>
              Compensated via patient appointment fees ({money(myFee)} / visit). Exempt from employee shift payroll.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.03em" }}>Consultation Fees Collected</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--success)", fontFamily: "var(--font-heading)" }}>
              {money(earnings.consultationFeesCollected)}
            </div>
          </div>
          {earnings.outstandingFees > 0 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.03em" }}>Pending Collection</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--warning)", fontFamily: "var(--font-heading)" }}>
                {money(earnings.outstandingFees)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        <DashboardCard
          title="Waiting For Doctor"
          value={`${metrics.waitingCount} Patients`}
          detail={metrics.waitingCount > 0 ? "Checked in & ready for consultation" : "No patients in waiting room"}
          icon={UserCheck}
          change={metrics.waitingCount > 0 ? "In Triage" : "Queue Clear"}
          href="#clinical-workflow"
          command={{ workspace: "clinical", mode: "doctor", queueTab: "waiting", dateScope: "today", status: "", priority: "", search: "" }}
          actionLabel={metrics.waitingCount > 0 ? "Call next patient" : "Open queue"}
          priority={metrics.waitingCount > 0 ? "high" : "normal"}
        />
        <DashboardCard
          title="Active Appointment Queue"
          value={`${metrics.todayApptCount} Scheduled`}
          detail="Booked patient visits in system"
          icon={CalendarCheck}
          change="Live Queue"
          href="#clinical-workflow"
          command={{ workspace: "clinical", mode: "doctor", queueTab: "all", dateScope: "today", status: "", priority: "", search: "" }}
          actionLabel="Review schedule"
          priority={metrics.todayApptCount > 0 ? "medium" : "normal"}
        />
        <DashboardCard
          title="Completed Consultations"
          value={`${metrics.completedCount} Finalized`}
          detail="Visits with diagnosis & handwritten Rx"
          icon={Stethoscope}
          change="Care Delivered"
          href="#clinical-workflow"
          command={{ workspace: "clinical", mode: "doctor", queueTab: "completed", dateScope: "all", status: "", priority: "", search: "" }}
          actionLabel="View notes"
        />
        <DashboardCard
          title="Diagnostic Lab Orders"
          value={`${metrics.labOrderCount} Requests`}
          detail="Laboratory investigations ordered"
          icon={FlaskConical}
          change="Lab Tracking"
          href="#clinical-workflow"
          command={{ workspace: "clinical", mode: "doctor", queueTab: "all", dateScope: "all", status: "", priority: "", search: "" }}
          actionLabel="Track lab orders"
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
