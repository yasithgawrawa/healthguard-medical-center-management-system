import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, ClipboardPlus, FlaskConical, HeartPulse, Microscope, Pill, Stethoscope, Thermometer } from "lucide-react";
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

export const ClinicalWorkspacePanel = ({ mode }) => {
  const [appointments, setAppointments] = useState([]);
  const [labs, setLabs] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState({ type: null, record: null });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const schema = modal.type === "vitals" ? vitalsSchema : modal.type === "consultation" ? consultationSchema : modal.type === "lab-request" ? labRequestSchema : labUpdateSchema;
  const {
    register,
    handleSubmit,
    reset,
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

  const sourceRows = mode === "lab" ? labs : appointments;
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sourceRows.filter((item) => {
      const text = [patientName(item), doctorName(item), item.reason, item.testName, item.status].join(" ").toLowerCase();
      return (!query || text.includes(query)) && (!status || item.status === status);
    });
  }, [sourceRows, search, status]);

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
    { key: "patient", header: "Patient", render: patientName },
    { key: "date", header: "Date & Time", render: (item) => formatDateTime(item.appointmentDate) },
    { key: "slotLabel", header: "Slot" },
    { key: "reason", header: "Reason" },
    { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (item) =>
        mode === "nurse" ? (
          <div className="inline-actions">
            <button type="button" onClick={() => openModal("status", item)}>Status</button>
            <button type="button" onClick={() => openModal("vitals", item)}>Vitals</button>
          </div>
        ) : (
          <div className="inline-actions">
            <button type="button" onClick={() => openModal("consultation", item)}>Consult</button>
            <button type="button" onClick={() => openModal("lab-request", item)}>Lab</button>
          </div>
        )
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
      <div className="table-toolbar compact-toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search patient, doctor, reason or status" />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={mode === "lab" ? ["requested", "verified", "in_progress", "completed", "cancelled"] : ["booked", "checked_in", "in_consultation", "completed", "cancelled"]} />
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
