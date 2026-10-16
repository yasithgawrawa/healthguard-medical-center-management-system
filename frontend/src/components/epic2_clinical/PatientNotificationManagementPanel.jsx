import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { patientNoticeApi } from "../../services/patientNoticeApi.js";
import { DataTable } from "../shared/DataTable.jsx";
import { Modal } from "../shared/Modal.jsx";
import { ConfirmDialog } from "../shared/ConfirmDialog.jsx";
import { Toast } from "../shared/Toast.jsx";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";
import { FormTextarea } from "../shared/forms/FormTextarea.jsx";

const clinicDate = date => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const fieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  message: z.string().trim().min(1, "Message is required").max(1000),
  recipient: z.enum(["one", "all"]),
  patientId: z.string(),
  expiryDate: z.string().refine(value => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value >= clinicDate(new Date())), "Choose today or a future expiry date")
});
const schema = fieldsSchema.refine(value => value.recipient !== "one" || /^[a-f0-9]{24}$/i.test(value.patientId), { path: ["patientId"], message: "Select a patient" });
const defaults = { title: "", message: "", recipient: "all", patientId: "", expiryDate: "" };
const displayDate = value => value ? new Date(value).toLocaleString("en-LK", { timeZone: "Asia/Colombo" }) : "No expiry";
const patientLabel = patient => `${patient.firstName} ${patient.lastName} (${patient._id})`;

export const PatientNotificationManagementPanel = () => {
  const [notices, setNotices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [patientError, setPatientError] = useState("");
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);
  const { register, handleSubmit, reset, watch, setError, formState: { errors } } = useForm({ resolver: zodResolver(modal?.type === "edit" ? fieldsSchema.pick({ title: true, message: true, expiryDate: true }) : schema), defaultValues: defaults });
  const recipient = watch("recipient");
  const selectedPatientId = watch("patientId");
  const load = async () => {
    setLoading(true);
    setLoadError("");
    try { setNotices(await patientNoticeApi.list()); }
    catch (error) { setLoadError(error.response?.data?.message || "Unable to load notifications"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (modal?.type !== "create" || recipient !== "one") return;
    let active = true;
    const timer = setTimeout(async () => {
      setPatientError("");
      try {
        const results = await patientNoticeApi.patients(search);
        if (active) setPatients(previous => {
          const selected = previous.find(patient => patient._id === selectedPatientId);
          return selected && !results.some(patient => patient._id === selected._id) ? [selected, ...results] : results;
        });
      } catch { if (active) setPatientError("Unable to search patients. Please try again."); }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [search, modal?.type, recipient, selectedPatientId]);
  const close = () => { if (!busy) setModal(null); };
  const open = (type, notice = null) => {
    reset(notice ? { ...defaults, ...notice, patientId: notice.patientId?._id || "", expiryDate: notice.expiryDate ? clinicDate(new Date(notice.expiryDate)) : "" } : defaults);
    setSearch("");
    setModal({ type, notice });
  };
  const save = async values => {
    setBusy(true);
    try {
      const body = { title: values.title, message: values.message, expiryDate: values.expiryDate || null };
      if (modal.type === "edit") await patientNoticeApi.update(modal.notice._id, body);
      else await patientNoticeApi.create({ ...body, recipient: values.recipient, patientId: values.recipient === "one" ? values.patientId : null });
      setModal(null);
      setToast({ type: "success", message: "Notification saved" });
      await load();
    } catch (error) {
      Object.entries(error.response?.data?.errors || {}).forEach(([key, message]) => setError(key.replace(/^body\./, ""), { message }));
      setToast({ type: "error", message: error.response?.data?.message || "Unable to save notification" });
    } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await patientNoticeApi.remove(modal.notice._id);
      setModal(null);
      setToast({ type: "success", message: "Notification deleted" });
      await load();
    } catch (error) { setToast({ type: "error", message: error.response?.data?.message || "Unable to delete notification" }); }
    finally { setBusy(false); }
  };
  const columns = [
    { key: "notificationId", header: "Notification ID" },
    { key: "title", header: "Title" },
    { key: "recipient", header: "Recipient", render: item => item.recipient === "all" ? "All Patients" : item.patientId ? patientLabel(item.patientId) : "Patient unavailable" },
    { key: "createdAt", header: "Created", render: item => displayDate(item.createdAt) },
    { key: "expiryDate", header: "Expiry", render: item => <>{displayDate(item.expiryDate)}{item.expiryDate && new Date(item.expiryDate) <= new Date() ? " (Expired)" : ""}</> },
    { key: "actions", header: "Actions", render: item => <div className="notice-actions">
      <button className="table-link-button" onClick={() => open("view", item)}>View</button>
      <button className="table-link-button" onClick={() => open("edit", item)}>Edit</button>
      <button className="table-link-button" onClick={() => open("delete", item)}>Delete</button>
    </div> }
  ];
  return <>
    <Toast toast={toast} onClose={() => setToast(null)} />
    <section className="operation-panel" id="patient-notice-management">
      <div className="e1-panel-header"><div><h2>Patient Notification Management</h2><p>Send in-app notices to one patient or all patients.</p></div>
        <button className="button-primary" onClick={() => open("create")}><Plus size={17} />New Notification</button>
      </div>
      {loadError ? <p role="alert">{loadError} <button className="table-link-button" onClick={load}>Retry</button></p> : null}
      <DataTable columns={columns} rows={notices} emptyText={loading ? "Loading..." : loadError ? "Notifications unavailable" : "No notifications"} />
    </section>
    <Modal open={modal?.type === "create" || modal?.type === "edit"} title={modal?.type === "edit" ? "Edit Notification" : "Create Notification"} onClose={close}>
      <form onSubmit={handleSubmit(save)}>
        <FormInput label="Title" required maxLength={120} error={errors.title?.message} {...register("title")} />
        {modal?.type === "create" ? <>
          <FormSelect label="Recipient" error={errors.recipient?.message} {...register("recipient")}><option value="all">All Patients</option><option value="one">One Patient</option></FormSelect>
          {recipient === "one" ? <>
            <FormInput label="Search patients by name" value={search} onChange={event => setSearch(event.target.value)} />
            {patientError ? <p role="alert">{patientError}</p> : null}
            <FormSelect label="Selected Patient" required error={errors.patientId?.message} {...register("patientId")}><option value="">Select a patient</option>{patients.map(patient => <option key={patient._id} value={patient._id}>{patientLabel(patient)}</option>)}</FormSelect>
          </> : null}
        </> : <p>Recipient: {modal?.notice?.recipient === "all" ? "All Patients" : modal?.notice?.patientId ? patientLabel(modal.notice.patientId) : "Patient unavailable"}</p>}
        <FormTextarea label="Message" required rows={5} maxLength={1000} error={errors.message?.message} {...register("message")} />
        <FormInput label="Expiry Date (optional)" type="date" min={clinicDate(new Date())} error={errors.expiryDate?.message} {...register("expiryDate")} />
        <p>Expires at the end of the selected day, Sri Lanka time.</p>
        <div className="modal-actions"><button type="button" className="button-secondary" disabled={busy} onClick={close}>Cancel</button><button className="button-primary" disabled={busy}>{busy ? "Saving..." : "Save Notification"}</button></div>
      </form>
    </Modal>
    <Modal open={modal?.type === "view"} title={modal?.notice?.title || "Notification"} onClose={close}>
      <p>{modal?.notice?.notificationId}</p><p className="notice-message">{modal?.notice?.message}</p>
      <p>Created: {displayDate(modal?.notice?.createdAt)}</p><p>Expiry: {displayDate(modal?.notice?.expiryDate)}</p>
    </Modal>
    <ConfirmDialog open={modal?.type === "delete"} title="Delete notification?" message={`Delete “${modal?.notice?.title || ""}”? Patients will no longer be able to access this notice.`} confirmLabel="Delete Notification" busy={busy} onCancel={close} onConfirm={remove} />
  </>;
};
