import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  FlaskConical,
  HeartPulse,
  Microscope,
  Pill,
  Play,
  Sparkles,
  Stethoscope,
  Thermometer,
  UserCheck,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { clinicalApi } from "../../services/clinicalApi.js";
import { DataTable } from "../shared/DataTable.jsx";
import { FilterSelect } from "../shared/FilterSelect.jsx";
import { Modal } from "../shared/Modal.jsx";
import { SearchBar } from "../shared/SearchBar.jsx";
import { StatusBadge } from "../shared/StatusBadge.jsx";
import { Toast } from "../shared/Toast.jsx";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";
import { FormTextarea } from "../shared/forms/FormTextarea.jsx";
import { bloodPressurePattern, optionalVitalsNumber } from "../../utils/validationSchemas.js";

const patientName = (appointment) => {
  const patient = appointment?.patientId || {};
  return [patient.firstName, patient.lastName].filter(Boolean).join(" ") || "Patient";
};

const doctorName = (item) => {
  const doctor = item?.doctorId || {};
  return [doctor.firstName, doctor.lastName].filter(Boolean).join(" ") || "Doctor";
};

const formatDateTime = (value) => (value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-");

const vitalsSchema = z.object({
  temperature: optionalVitalsNumber("Temperature", 25, 45),
  bloodPressure: z.string().trim().regex(bloodPressurePattern, "Use format like 120/80").optional().or(z.literal("")),
  heartRate: optionalVitalsNumber("Heart rate", 20, 250),
  spo2: optionalVitalsNumber("SpO2", 50, 100)
});

const consultationSchema = z.object({
  diagnosis: z.string().trim().min(2, "Primary diagnosis is required").max(120, "Diagnosis is too long"),
  clinicalNotes: z.string().trim().min(3, "Clinical notes are required").max(1000, "Clinical notes cannot exceed 1000 characters"),
  chiefComplaints: z.string().trim().max(300, "Chief complaints too long").optional().or(z.literal("")),
  examinationFindings: z.string().trim().max(500, "Examination findings too long").optional().or(z.literal("")),
  secondaryDiagnosis: z.string().trim().max(150, "Secondary diagnosis too long").optional().or(z.literal("")),
  severity: z.string().optional().or(z.literal("")),
  patientAdvice: z.string().trim().max(500, "Patient advice too long").optional().or(z.literal("")),
  followUpPlan: z.string().trim().max(100, "Follow-up plan too long").optional().or(z.literal("")),
  handwrittenPrescriptionIssued: z.boolean().optional(),
  finalized: z.boolean().optional()
});

const labRequestSchema = z.object({
  testName: z.string().trim().min(2, "Test name is required").max(120, "Test name is too long"),
  priority: z.string().min(1, "Priority is required")
});

const labUpdateSchema = z.object({
  status: z.string().min(1, "Status is required"),
  resultSummary: z.string().trim().max(500, "Result summary is too long").optional().or(z.literal("")),
  resultUrl: z.string().trim().url("Enter a valid report URL").optional().or(z.literal(""))
}).refine((data) => {
  if (data.status === "completed" && (!data.resultSummary || data.resultSummary.trim().length < 3)) {
    return false;
  }
  return true;
}, {
  path: ["resultSummary"],
  message: "Result summary is required when marking lab test as completed"
});

const buildNumber = (value) => (value === "" || value === undefined ? undefined : Number(value));

const CLINICAL_PRESETS = [
  {
    label: "Viral Flu / URTI",
    diagnosis: "Acute Upper Respiratory Tract Infection (URTI) / Viral Flu",
    chiefComplaints: "Fever, body aches, runny nose, sore throat for 2-3 days",
    examinationFindings: "Pharyngeal congestion, clear chest auscultation, no wheezing or crackles",
    severity: "mild",
    clinicalNotes: "Symptomatic viral infection. Prescribed antipyretics, decongestant and hydration. Advised rest.",
    patientAdvice: "Drink plenty of warm fluids, steam inhalation twice daily, adequate bed rest. Return if fever persists > 3 days.",
    followUpPlan: "Review in 3 days"
  },
  {
    label: "Hypertension Review",
    diagnosis: "Essential Hypertension - Routine Clinical Review",
    chiefComplaints: "Routine blood pressure follow-up, occasional mild occipital headache",
    examinationFindings: "Heart sounds S1 S2 normal, no peripheral pedal edema, lungs clear",
    severity: "moderate",
    clinicalNotes: "Patient compliant with antihypertensive therapy. BP assessed and maintenance continued.",
    patientAdvice: "Maintain low sodium diet (<2g salt/day), 30 mins brisk walking daily, avoid stress, monitor BP weekly.",
    followUpPlan: "Review in 2 weeks"
  },
  {
    label: "Type 2 Diabetes Review",
    diagnosis: "Type 2 Diabetes Mellitus - Glycemic Follow-Up",
    chiefComplaints: "Routine diabetic review, good compliance, no polyuria or polydipsia",
    examinationFindings: "Peripheral pulses palpable, no diabetic foot ulcers, neurological sensation intact",
    severity: "moderate",
    clinicalNotes: "Regular glycemic control follow-up. Diet, lifestyle and medication adherence assessed.",
    patientAdvice: "Follow diabetic meal plan, foot hygiene and daily inspection, regular fasting blood sugar log.",
    followUpPlan: "Review in 1 month"
  },
  {
    label: "Acute Gastritis",
    diagnosis: "Acute Gastritis / Acid Peptic Disease",
    chiefComplaints: "Burning epigastric pain post-meals, nausea, occasional acid reflux",
    examinationFindings: "Mild epigastric tenderness, abdomen soft, bowel sounds normal",
    severity: "mild",
    clinicalNotes: "Suspected non-ulcer dyspepsia / acute gastritis triggered by irregular meal times.",
    patientAdvice: "Eat small frequent meals, avoid spicy and oily food, avoid NSAIDs on empty stomach, drink plenty of water.",
    followUpPlan: "Review in 5 days"
  },
  {
    label: "Musculoskeletal Strain",
    diagnosis: "Mechanical Musculoskeletal Strain / Lumbar Strain",
    chiefComplaints: "Lower backache / muscular strain exacerbated by prolonged sitting or lifting",
    examinationFindings: "Paraspinal muscle tenderness, straight leg raise negative, normal reflexes",
    severity: "mild",
    clinicalNotes: "Soft tissue strain. Prescribed analgesics, muscle relaxants and hot fermentation advice.",
    patientAdvice: "Apply warm compress, practice ergonomic posture, avoid heavy weight lifting for 1 week.",
    followUpPlan: "Review in 1 week"
  },
  {
    label: "Allergic Rhinitis",
    diagnosis: "Allergic Rhinitis & Bronchial Hyperresponsiveness",
    chiefComplaints: "Sneezing bouts, watery nasal discharge, itchy eyes, dry nocturnal cough",
    examinationFindings: "Pale nasal mucosa, conjunctival injection, vesicular breath sounds",
    severity: "mild",
    clinicalNotes: "Environmental allergen sensitivity. Prescribed antihistamines and nasal rinse.",
    patientAdvice: "Avoid dust, pollen, cold environments. Use dust-mite covers, warm saline gargles.",
    followUpPlan: "Review in 1 week"
  }
];

export const ClinicalWorkspacePanel = ({ mode }) => {
  const [appointments, setAppointments] = useState([]);
  const [labs, setLabs] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [queueTab, setQueueTab] = useState("all");
  const [dateScope, setDateScope] = useState("all");
  const [modal, setModal] = useState({ type: null, record: null });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const schema = modal.type === "vitals" ? vitalsSchema : modal.type === "consultation" ? consultationSchema : modal.type === "lab-request" ? labRequestSchema : labUpdateSchema;
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({ resolver: zodResolver(schema), mode: "onChange" });

  const load = async () => {
    try {
      if (mode === "lab") {
        setLabs(await clinicalApi.listLabRequests());
      } else {
        const [appointmentData, labData] = await Promise.all([
          clinicalApi.listAppointments(),
          mode === "doctor" ? clinicalApi.listLabRequests() : Promise.resolve([])
        ]);
        setAppointments(appointmentData);
        setLabs(labData);
      }
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load clinical workspace" });
    }
  };

  useEffect(() => {
    load();
  }, [mode]);

  const openModal = (type, record) => {
    if (type === "lab-update") {
      reset({ status: record.status || "verified", resultSummary: record.resultSummary || "", resultUrl: record.resultUrl || "" });
    } else if (type === "consultation") {
      const existing = record.consultation || {};
      reset({
        diagnosis: existing.diagnosis || "",
        clinicalNotes: existing.clinicalNotes || "",
        chiefComplaints: existing.chiefComplaints || record.reason || "",
        examinationFindings: existing.examinationFindings || "",
        secondaryDiagnosis: existing.secondaryDiagnosis || "",
        severity: existing.severity || "moderate",
        patientAdvice: existing.patientAdvice || "Rest adequately and drink plenty of warm fluids. Complete prescribed medications as instructed.",
        followUpPlan: existing.followUpPlan || "Review in 3 days",
        handwrittenPrescriptionIssued: existing.handwrittenPrescriptionIssued !== undefined ? existing.handwrittenPrescriptionIssued : true,
        finalized: existing.finalized !== undefined ? existing.finalized : true
      });
    } else {
      reset({});
    }
    setModal({ type, record });
  };

  const startConsultation = async (appointment) => {
    try {
      if (appointment.status === "checked_in") {
        await clinicalApi.updateAppointmentStatus(appointment._id, "in_consultation");
        appointment.status = "in_consultation";
      }
      openModal("consultation", appointment);
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Failed to start consultation" });
    }
  };

  const applyPreset = (preset) => {
    setValue("diagnosis", preset.diagnosis, { shouldValidate: true, shouldDirty: true });
    if (preset.chiefComplaints) setValue("chiefComplaints", preset.chiefComplaints, { shouldValidate: true, shouldDirty: true });
    if (preset.examinationFindings) setValue("examinationFindings", preset.examinationFindings, { shouldValidate: true, shouldDirty: true });
    if (preset.severity) setValue("severity", preset.severity, { shouldValidate: true, shouldDirty: true });
    if (preset.clinicalNotes) setValue("clinicalNotes", preset.clinicalNotes, { shouldValidate: true, shouldDirty: true });
    if (preset.patientAdvice) setValue("patientAdvice", preset.patientAdvice, { shouldValidate: true, shouldDirty: true });
    if (preset.followUpPlan) setValue("followUpPlan", preset.followUpPlan, { shouldValidate: true, shouldDirty: true });
  };

  const importTriageNotes = () => {
    if (!modal.record) return;
    const parts = [];
    if (modal.record.reason) parts.push(`Reported: ${modal.record.reason}`);
    if (modal.record.vitals) {
      const v = modal.record.vitals;
      const vList = [];
      if (v.temperature) vList.push(`Temp ${v.temperature}°C`);
      if (v.bloodPressure) vList.push(`BP ${v.bloodPressure}`);
      if (v.heartRate) vList.push(`Pulse ${v.heartRate} bpm`);
      if (v.spo2) vList.push(`SpO2 ${v.spo2}%`);
      if (vList.length) parts.push(`Vitals: ${vList.join(", ")}`);
    }
    setValue("chiefComplaints", parts.join(" | "), { shouldValidate: true, shouldDirty: true });
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const sourceRows = mode === "lab" ? labs : appointments;
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sourceRows.filter((item) => {
      const p = item.patientId || {};
      const d = item.doctorId || {};
      const diag = item.consultation?.diagnosis || "";
      const text = [
        p.firstName,
        p.lastName,
        p.phone,
        d.firstName,
        d.lastName,
        item.reason,
        item.testName,
        item.status,
        item.slotLabel,
        diag
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (query && !text.includes(query)) return false;

      if (mode === "lab") {
        return !status || item.status === status;
      }

      if (dateScope === "today") {
        const itemDate = (item.appointmentDate || "").slice(0, 10);
        if (itemDate !== todayStr) return false;
      }

      if (queueTab === "waiting" && item.status !== "checked_in") return false;
      if (queueTab === "in_consultation" && item.status !== "in_consultation") return false;
      if (queueTab === "completed" && item.status !== "completed") return false;

      if (status && item.status !== status) return false;

      return true;
    });
  }, [sourceRows, search, status, queueTab, dateScope, mode, todayStr]);

  const submit = async (values) => {
    setBusy(true);
    try {
      const record = modal.record;
      if (modal.type === "status") await clinicalApi.updateAppointmentStatus(record._id, values.status);
      if (modal.type === "vitals") {
        await clinicalApi.recordVitals({
          appointmentId: record._id,
          temperature: buildNumber(values.temperature),
          bloodPressure: values.bloodPressure,
          heartRate: buildNumber(values.heartRate),
          spo2: buildNumber(values.spo2)
        });
      }
      if (modal.type === "consultation") await clinicalApi.saveConsultation({ appointmentId: record._id, ...values });
      if (modal.type === "lab-request") await clinicalApi.createLabRequest({ appointmentId: record._id, ...values });
      if (modal.type === "lab-update") await clinicalApi.updateLabRequest(record._id, values);
      setToast({ type: "success", message: "Workflow updated successfully" });
      setModal({ type: null, record: null });
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to update workflow" });
    } finally {
      setBusy(false);
    }
  };

  const appointmentColumns = [
    {
      key: "patient",
      header: "Patient",
      render: (item) => {
        const p = item.patientId || {};
        const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || "Patient";
        return (
          <div>
            <div style={{ fontWeight: 600, color: "#0f172a" }}>{name}</div>
            {p.phone ? (
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>📞 {p.phone}</div>
            ) : null}
          </div>
        );
      }
    },
    {
      key: "date",
      header: "Schedule & Slot",
      render: (item) => {
        const isToday = (item.appointmentDate || "").slice(0, 10) === todayStr;
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.82rem", color: isToday ? "#0284c7" : "#334155" }}>
              {isToday ? "📅 Today" : formatDateTime(item.appointmentDate)}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
              Slot: <strong>{item.slotLabel || "Standard"}</strong>
            </div>
          </div>
        );
      }
    },
    { key: "reason", header: "Reason / Complaint" },
    {
      key: "vitals",
      header: "Triage Vitals",
      render: (item) => {
        const v = item.vitals;
        if (!v || (!v.temperature && !v.bloodPressure && !v.heartRate && !v.spo2)) {
          return <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontStyle: "italic" }}>Pending vitals</span>;
        }
        const isFever = v.temperature && Number(v.temperature) >= 38.0;
        const isHighBp = v.bloodPressure && parseInt(v.bloodPressure, 10) >= 140;
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
            {v.temperature ? (
              <span
                style={{
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: isFever ? "#fef2f2" : "#f1f5f9",
                  color: isFever ? "#dc2626" : "#334155",
                  border: `1px solid ${isFever ? "#fca5a5" : "#e2e8f0"}`
                }}
                title={isFever ? "High Temperature / Fever" : "Body Temperature"}
              >
                🌡️ {v.temperature}°C
              </span>
            ) : null}
            {v.bloodPressure ? (
              <span
                style={{
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: isHighBp ? "#fff7ed" : "#f1f5f9",
                  color: isHighBp ? "#ea580c" : "#334155",
                  border: `1px solid ${isHighBp ? "#fed7aa" : "#e2e8f0"}`
                }}
                title={isHighBp ? "Elevated Blood Pressure" : "Blood Pressure"}
              >
                🩸 {v.bloodPressure}
              </span>
            ) : null}
            {v.heartRate ? (
              <span style={{ fontSize: "0.76rem", color: "#475569", background: "#f8fafc", padding: "2px 6px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                ❤️ {v.heartRate} bpm
              </span>
            ) : null}
            {v.spo2 ? (
              <span style={{ fontSize: "0.76rem", color: "#0369a1", background: "#f0f9ff", padding: "2px 6px", borderRadius: "4px", border: "1px solid #bae6fd" }}>
                💨 {v.spo2}%
              </span>
            ) : null}
          </div>
        );
      }
    },
    { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (item) => {
        if (mode === "nurse") {
          return (
            <div className="inline-actions">
              <button type="button" onClick={() => openModal("status", item)}>Status</button>
              <button type="button" onClick={() => openModal("vitals", item)}>Vitals</button>
            </div>
          );
        }
        return (
          <div className="inline-actions" style={{ flexWrap: "wrap", gap: "6px" }}>
            {item.status === "checked_in" ? (
              <button
                type="button"
                className="button-primary"
                style={{ padding: "4px 10px", fontSize: "0.82rem", background: "#16a34a", borderColor: "#16a34a" }}
                onClick={() => startConsultation(item)}
                title="Call patient into doctor's room & begin consultation"
              >
                <Play size={13} style={{ display: "inline", marginRight: "3px" }} />
                Call & Consult
              </button>
            ) : item.status === "in_consultation" ? (
              <button
                type="button"
                className="button-primary"
                style={{ padding: "4px 10px", fontSize: "0.82rem", background: "#0284c7", borderColor: "#0284c7" }}
                onClick={() => openModal("consultation", item)}
                title="Continue active consultation"
              >
                <Stethoscope size={13} style={{ display: "inline", marginRight: "3px" }} />
                Continue Consult
              </button>
            ) : item.status === "completed" ? (
              <button
                type="button"
                className="table-link-button"
                style={{ padding: "4px 8px", fontSize: "0.82rem" }}
                onClick={() => openModal("consultation", item)}
                title="View finalized consultation notes"
              >
                <Eye size={13} style={{ display: "inline", marginRight: "3px" }} />
                View Notes
              </button>
            ) : (
              <button
                type="button"
                style={{ padding: "4px 8px", fontSize: "0.82rem" }}
                onClick={() => openModal("consultation", item)}
              >
                Consult
              </button>
            )}

            <button
              type="button"
              className="table-link-button"
              style={{ padding: "4px 8px", fontSize: "0.82rem" }}
              onClick={() => openModal("lab-request", item)}
              title="Request Laboratory Investigation"
            >
              <FlaskConical size={13} style={{ display: "inline", marginRight: "3px" }} />
              Lab
            </button>
          </div>
        );
      }
    }
  ];

  const labColumns = [
    { key: "testName", header: "Test" },
    { key: "doctor", header: "Doctor", render: (item) => `Dr. ${doctorName(item)}` },
    { key: "priority", header: "Priority", render: (item) => item.priority || "routine" },
    { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
    { key: "resultSummary", header: "Result Summary", render: (item) => item.resultSummary || "Pending" },
    { key: "actions", header: "Actions", render: (item) => <button className="table-link-button" type="button" onClick={() => openModal("lab-update", item)}>Update</button> }
  ];

  return (
    <section className="e1-panel" id={mode === "lab" ? "laboratory-results" : mode === "nurse" ? "patient-check-in-vitals" : "clinical-workflow"}>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="e1-panel-header">
        <div>
          <h2>{mode === "lab" ? "Laboratory Results" : mode === "nurse" ? "Patient Check-In & Vital Signs" : "Clinical Workflow"}</h2>
          <p>{mode === "lab" ? "Update lab requests without handling raw database IDs." : "Select a patient row and continue the care workflow."}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="table-toolbar compact-toolbar" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <SearchBar value={search} onChange={setSearch} placeholder={mode === "lab" ? "Search lab test, doctor, or status..." : "Search patient name, phone, slot, diagnosis..."} />
          </div>
          {mode !== "lab" ? (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>Date:</span>
              <button
                type="button"
                className={dateScope === "today" ? "button-primary" : "button-secondary"}
                style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                onClick={() => setDateScope("today")}
              >
                📅 Today Only
              </button>
              <button
                type="button"
                className={dateScope === "all" ? "button-primary" : "button-secondary"}
                style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                onClick={() => setDateScope("all")}
              >
                All Dates
              </button>
            </div>
          ) : null}
        </div>

        {mode !== "lab" ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", marginRight: "4px" }}>
                Queue View:
              </span>
              <button
                type="button"
                className={queueTab === "all" ? "button-primary" : "button-secondary"}
                style={{ padding: "5px 12px", fontSize: "0.82rem" }}
                onClick={() => { setQueueTab("all"); setStatus(""); }}
              >
                All Scheduled ({appointments.length})
              </button>
              <button
                type="button"
                className={queueTab === "waiting" ? "button-primary" : "button-secondary"}
                style={{
                  padding: "5px 12px",
                  fontSize: "0.82rem",
                  background: queueTab === "waiting" ? "#f59e0b" : undefined,
                  borderColor: queueTab === "waiting" ? "#f59e0b" : undefined,
                  color: queueTab === "waiting" ? "#ffffff" : undefined
                }}
                onClick={() => { setQueueTab("waiting"); setStatus(""); }}
              >
                ⏳ Waiting Room ({appointments.filter((a) => a.status === "checked_in").length})
              </button>
              <button
                type="button"
                className={queueTab === "in_consultation" ? "button-primary" : "button-secondary"}
                style={{
                  padding: "5px 12px",
                  fontSize: "0.82rem",
                  background: queueTab === "in_consultation" ? "#0284c7" : undefined,
                  borderColor: queueTab === "in_consultation" ? "#0284c7" : undefined,
                  color: queueTab === "in_consultation" ? "#ffffff" : undefined
                }}
                onClick={() => { setQueueTab("in_consultation"); setStatus(""); }}
              >
                🩺 In Consultation ({appointments.filter((a) => a.status === "in_consultation").length})
              </button>
              <button
                type="button"
                className={queueTab === "completed" ? "button-primary" : "button-secondary"}
                style={{
                  padding: "5px 12px",
                  fontSize: "0.82rem",
                  background: queueTab === "completed" ? "#16a34a" : undefined,
                  borderColor: queueTab === "completed" ? "#16a34a" : undefined,
                  color: queueTab === "completed" ? "#ffffff" : undefined
                }}
                onClick={() => { setQueueTab("completed"); setStatus(""); }}
              >
                ✓ Completed ({appointments.filter((a) => a.status === "completed").length})
              </button>
            </div>
            <div style={{ minWidth: "150px" }}>
              <FilterSelect
                label="Filter Status"
                value={status}
                onChange={(val) => { setStatus(val); if (val) setQueueTab("custom"); }}
                options={["booked", "checked_in", "in_consultation", "completed", "cancelled"]}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <FilterSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={["requested", "verified", "in_progress", "completed", "cancelled"]}
            />
          </div>
        )}
      </div>

      <DataTable columns={mode === "lab" ? labColumns : appointmentColumns} rows={rows} emptyText="No records match your filters." />

      {mode === "doctor" ? (
        <div className="staff-self-leave">
          <h3>Lab Results Requested By Me</h3>
          <DataTable columns={labColumns.filter((column) => column.key !== "actions")} rows={labs.slice(0, 6)} emptyText="No lab requests yet." />
        </div>
      ) : null}

      <Modal
        open={Boolean(modal.type)}
        title={
          modal.type === "consultation"
            ? "Clinical Consultation & Diagnosis"
            : modal.type === "vitals"
            ? "Record Vital Signs"
            : modal.type === "status"
            ? "Update Appointment Status"
            : modal.type === "lab-request"
            ? "Order Laboratory Investigation"
            : modal.type === "lab-update"
            ? "Update Laboratory Result"
            : "Update Workflow"
        }
        subtitle={modal.record ? `${patientName(modal.record)} • ${modal.record.slotLabel || "Standard Visit"}` : ""}
        onClose={() => setModal({ type: null, record: null })}
      >
        <form onSubmit={handleSubmit(submit)}>
          {modal.type === "status" ? (
            <FormSelect label="Status" error={errors.status?.message} {...register("status")}>
              <option value="">Select status</option>
              {["checked_in", "in_consultation", "completed", "cancelled"].map((item) => <option value={item} key={item}>{item.replace(/_/g, " ")}</option>)}
            </FormSelect>
          ) : null}
          {modal.type === "vitals" ? (
            <div className="form-grid">
              <FormInput label="Temperature" placeholder="37.2" type="number" step="0.1" error={errors.temperature?.message} {...register("temperature")} />
              <FormInput label="Blood Pressure" placeholder="120/80" error={errors.bloodPressure?.message} {...register("bloodPressure")} />
              <FormInput label="Heart Rate" placeholder="82" type="number" error={errors.heartRate?.message} {...register("heartRate")} />
              <FormInput label="SpO2" placeholder="98" type="number" error={errors.spo2?.message} {...register("spo2")} />
            </div>
          ) : null}
          {modal.type === "consultation" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Patient & Visit Context Header Card */}
              <div
                style={{
                  background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                  border: "1px solid #bae6fd",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Stethoscope size={18} color="#0284c7" />
                    <strong style={{ fontSize: "1rem", color: "#0c4a6e" }}>
                      {patientName(modal.record)}
                    </strong>
                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                      ({formatDateTime(modal.record.appointmentDate)})
                    </span>
                  </div>
                  <span
                    style={{
                      background: "#0284c7",
                      color: "#ffffff",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em"
                    }}
                  >
                    Clinical Evaluation
                  </span>
                </div>
                {modal.record.reason ? (
                  <div style={{ fontSize: "0.85rem", color: "#334155" }}>
                    <strong>Reported Patient Reason: </strong>
                    <span>{modal.record.reason}</span>
                  </div>
                ) : null}
                {modal.record?.vitals ? (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", background: "#ffffff", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.82rem" }}>
                    <strong style={{ color: "#0369a1", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Activity size={14} /> Recorded Vitals:
                    </strong>
                    {modal.record.vitals.temperature ? <span>🌡️ Temp: <strong>{modal.record.vitals.temperature}°C</strong></span> : null}
                    {modal.record.vitals.bloodPressure ? <span>🩸 BP: <strong>{modal.record.vitals.bloodPressure}</strong></span> : null}
                    {modal.record.vitals.heartRate ? <span>❤️ Pulse: <strong>{modal.record.vitals.heartRate} bpm</strong></span> : null}
                    {modal.record.vitals.spo2 ? <span>💨 SpO2: <strong>{modal.record.vitals.spo2}%</strong></span> : null}
                  </div>
                ) : null}
              </div>

              {/* Fast Clinical Presets & Autofill */}
              <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Sparkles size={14} color="#f59e0b" /> Fast Clinical Presets (Click to autofill):
                  </span>
                  {modal.record?.reason || modal.record?.vitals ? (
                    <button
                      type="button"
                      className="table-link-button"
                      style={{ fontSize: "0.75rem", padding: "2px 6px" }}
                      onClick={importTriageNotes}
                      title="Autofill Chief Complaints using patient's reason and triage vitals"
                    >
                      📋 Import Reason & Vitals
                    </button>
                  ) : null}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {CLINICAL_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      style={{
                        fontSize: "0.78rem",
                        padding: "4px 10px",
                        borderRadius: "16px",
                        background: "#ffffff",
                        border: "1px solid #93c5fd",
                        color: "#1d4ed8",
                        cursor: "pointer",
                        fontWeight: 500,
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 1: Clinical Presentation & Physical Examination */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "0.88rem", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
                  1. Clinical Presentation & Physical Examination
                </h4>
                <div className="form-grid">
                  <FormInput
                    label="Chief Complaints & Symptoms"
                    placeholder="e.g. High fever for 3 days, sore throat, cough"
                    error={errors.chiefComplaints?.message}
                    {...register("chiefComplaints")}
                  />
                  <FormInput
                    label="Physical Examination & Clinical Findings"
                    placeholder="e.g. Pharynx congested, bilateral lungs clear, no wheeze"
                    error={errors.examinationFindings?.message}
                    {...register("examinationFindings")}
                  />
                </div>
              </div>

              {/* Section 2: Diagnosis & Acuity */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "0.88rem", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
                  2. Assessment & Diagnosis
                </h4>
                <div className="form-grid">
                  <FormInput
                    label="Primary Diagnosis *"
                    placeholder="e.g. Acute Upper Respiratory Tract Infection (URTI)"
                    error={errors.diagnosis?.message}
                    {...register("diagnosis")}
                  />
                  <FormInput
                    label="Secondary / Differential Diagnosis"
                    placeholder="e.g. Tension headache, mild dehydration"
                    error={errors.secondaryDiagnosis?.message}
                    {...register("secondaryDiagnosis")}
                  />
                  <FormSelect label="Severity / Acuity Level" error={errors.severity?.message} {...register("severity")}>
                    <option value="mild">Mild (Routine outpatient care)</option>
                    <option value="moderate">Moderate (Symptomatic care required)</option>
                    <option value="severe">Severe (Urgent / closely monitored)</option>
                    <option value="chronic">Chronic / Maintenance follow-up</option>
                    <option value="routine">Routine Wellness / Check-up</option>
                  </FormSelect>
                  <FormSelect label="Follow-Up Recommendation" error={errors.followUpPlan?.message} {...register("followUpPlan")}>
                    <option value="No routine follow-up needed">No routine follow-up needed</option>
                    <option value="Review in 3 days">Review in 3 days</option>
                    <option value="Review in 5 days">Review in 5 days</option>
                    <option value="Review in 1 week">Review in 1 week</option>
                    <option value="Review in 2 weeks">Review in 2 weeks</option>
                    <option value="Review in 1 month">Review in 1 month</option>
                    <option value="Return immediately if symptoms worsen">Return immediately if symptoms worsen</option>
                  </FormSelect>
                </div>
              </div>

              {/* Section 3: Treatment Plan & Patient Instructions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "0.88rem", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
                  3. Treatment Plan & Patient Instructions
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <FormTextarea
                    label="Clinical Observations & Treatment Notes *"
                    rows={3}
                    placeholder="Detailed observations, treatment rationale, and clinical assessment..."
                    error={errors.clinicalNotes?.message}
                    {...register("clinicalNotes")}
                  />
                  <FormTextarea
                    label="Patient Care & Lifestyle Instructions"
                    rows={2}
                    placeholder="Non-pharmacological advice (e.g. bed rest, hydration, salt water gargling, dietary precautions)..."
                    error={errors.patientAdvice?.message}
                    {...register("patientAdvice")}
                  />
                </div>
              </div>

              {/* Section 4: Handwritten Prescription & Finalize Visit */}
              <div
                style={{
                  padding: "14px 16px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                <label className="checkbox-line" style={{ fontWeight: 700, color: "#166534", margin: 0 }}>
                  <input type="checkbox" defaultChecked={true} {...register("handwrittenPrescriptionIssued")} />
                  Handwritten physical prescription paper given to patient
                </label>
                <span style={{ display: "block", color: "#475569", fontSize: "0.83rem", paddingLeft: "24px" }}>
                  Doctor writes medicine details on the physical paper slip and hands it to the patient for pharmacy dispensing.
                </span>
              </div>

              <label className="checkbox-line" style={{ fontWeight: 700, marginTop: "2px" }}>
                <input type="checkbox" {...register("finalized")} /> Finalize consultation & mark visit as completed
              </label>
            </div>
          ) : null}
          {modal.type === "lab-request" ? (
            <div className="form-grid">
              <FormInput label="Test Name" placeholder="Fasting Blood Sugar" error={errors.testName?.message} {...register("testName")} />
              <FormSelect label="Priority" error={errors.priority?.message} {...register("priority")}>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
              </FormSelect>
            </div>
          ) : null}
          {modal.type === "lab-update" ? (
            <>
              <FormSelect label="Status" error={errors.status?.message} {...register("status")}>
                {["verified", "in_progress", "completed", "cancelled"].map((item) => <option value={item} key={item}>{item.replace(/_/g, " ")}</option>)}
              </FormSelect>
              <FormInput label="Result Summary" placeholder="FBS 112 mg/dL. Continue monitoring." error={errors.resultSummary?.message} {...register("resultSummary")} />
              <FormInput label="Result URL" placeholder="https://example.lk/reports/fbs.pdf" error={errors.resultUrl?.message} {...register("resultUrl")} />
            </>
          ) : null}
          <div className="modal-actions">
            <button className="button-secondary" type="button" onClick={() => setModal({ type: null, record: null })} disabled={busy}>Cancel</button>
            <button className="button-primary" type="submit" disabled={busy}>{busy ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
