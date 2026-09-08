import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardPlus, FlaskConical, HeartPulse, Microscope, Pill, Stethoscope, Thermometer } from "lucide-react";
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
  temperature: z.string().optional(),
  bloodPressure: z.string().optional(),
  heartRate: z.string().optional(),
  spo2: z.string().optional()
});

const consultationSchema = z.object({
  diagnosis: z.string().trim().min(2, "Diagnosis is required"),
  clinicalNotes: z.string().trim().min(3, "Clinical notes are required"),
  finalized: z.boolean().optional()
});

const prescriptionSchema = z.object({
  medicineName: z.string().trim().min(2, "Medicine is required"),
  dosage: z.string().trim().min(1, "Dosage is required"),
  frequency: z.string().trim().min(1, "Frequency is required"),
  duration: z.string().trim().min(1, "Duration is required"),
  instructions: z.string().optional()
});

const labRequestSchema = z.object({
  testName: z.string().trim().min(2, "Test name is required"),
  priority: z.string().min(1, "Priority is required")
});

const labUpdateSchema = z.object({
  status: z.string().min(1, "Status is required"),
  resultSummary: z.string().optional(),
  resultUrl: z.string().optional()
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

  const schema = modal.type === "vitals" ? vitalsSchema : modal.type === "consultation" ? consultationSchema : modal.type === "prescription" ? prescriptionSchema : modal.type === "lab-request" ? labRequestSchema : labUpdateSchema;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({ resolver: zodResolver(schema) });

  const load = async () => {
    try {
      if (mode === "lab") {
        setLabs(await clinicalApi.listLabRequests());
      } else {
        setAppointments(await clinicalApi.listAppointments());
      }
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load clinical workspace" });
    }
  };

  useEffect(() => {
    load();
  }, [mode]);

  const openModal = (type, record) => {
    reset(type === "lab-update" ? { status: record.status || "verified", resultSummary: record.resultSummary || "", resultUrl: record.resultUrl || "" } : {});
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
      if (modal.type === "prescription") {
        await clinicalApi.createPrescription({ appointmentId: record._id, items: [values] });
      }
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
            <button type="button" onClick={() => openModal("prescription", item)}>Rx</button>
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

      <Modal open={Boolean(modal.type)} title="Update Workflow" subtitle={modal.record ? patientName(modal.record) || modal.record.testName : ""} onClose={() => setModal({ type: null, record: null })}>
        <form onSubmit={handleSubmit(submit)}>
          {modal.type === "status" ? (
            <FormSelect label="Status" error={errors.status?.message} {...register("status")}>
              <option value="">Select status</option>
              {["checked_in", "in_consultation", "completed", "cancelled"].map((item) => <option value={item} key={item}>{item.replace(/_/g, " ")}</option>)}
            </FormSelect>
          ) : null}
          {modal.type === "vitals" ? (
            <div className="form-grid">
              <FormInput label="Temperature" type="number" step="0.1" error={errors.temperature?.message} {...register("temperature")} />
              <FormInput label="Blood Pressure" error={errors.bloodPressure?.message} {...register("bloodPressure")} />
              <FormInput label="Heart Rate" type="number" error={errors.heartRate?.message} {...register("heartRate")} />
              <FormInput label="SpO2" type="number" error={errors.spo2?.message} {...register("spo2")} />
            </div>
          ) : null}
          {modal.type === "consultation" ? (
            <>
              <FormInput label="Diagnosis" error={errors.diagnosis?.message} {...register("diagnosis")} />
              <FormInput label="Clinical Notes" error={errors.clinicalNotes?.message} {...register("clinicalNotes")} />
              <label className="checkbox-line"><input type="checkbox" {...register("finalized")} /> Finalize visit</label>
            </>
          ) : null}
          {modal.type === "prescription" ? (
            <div className="form-grid">
              <FormInput label="Medicine" error={errors.medicineName?.message} {...register("medicineName")} />
              <FormInput label="Dosage" error={errors.dosage?.message} {...register("dosage")} />
              <FormInput label="Frequency" error={errors.frequency?.message} {...register("frequency")} />
              <FormInput label="Duration" error={errors.duration?.message} {...register("duration")} />
              <FormInput label="Instructions" error={errors.instructions?.message} {...register("instructions")} />
            </div>
          ) : null}
          {modal.type === "lab-request" ? (
            <div className="form-grid">
              <FormInput label="Test Name" error={errors.testName?.message} {...register("testName")} />
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
              <FormInput label="Result Summary" error={errors.resultSummary?.message} {...register("resultSummary")} />
              <FormInput label="Result URL" error={errors.resultUrl?.message} {...register("resultUrl")} />
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
