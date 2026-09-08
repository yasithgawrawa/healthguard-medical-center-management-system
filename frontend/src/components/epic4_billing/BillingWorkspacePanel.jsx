import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Receipt } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { billingApi } from "../../services/billingApi.js";
import { clinicalApi } from "../../services/clinicalApi.js";
import { DataTable } from "../shared/DataTable.jsx";
import { Modal } from "../shared/Modal.jsx";
import { SearchBar } from "../shared/SearchBar.jsx";
import { StatusBadge } from "../shared/StatusBadge.jsx";
import { Toast } from "../shared/Toast.jsx";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";
import { requiredMoney, requiredQuantity } from "../../utils/validationSchemas.js";

const invoiceSchema = z.object({
  appointmentId: z.string().min(1, "Select appointment"),
  description: z.string().trim().min(2, "Description is required").max(120, "Description is too long"),
  quantity: requiredQuantity(),
  unitPrice: requiredMoney("Unit price")
});
const paymentSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: "Amount is required" }).min(0.01, "Amount must be greater than 0").max(10000000, "Amount is too high"),
  method: z.string().min(1, "Payment method is required")
});
const name = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Patient";

export const BillingWorkspacePanel = () => {
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({ type: null, record: null });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(modal.type === "payment" ? paymentSchema : invoiceSchema), mode: "onChange" });

  const load = async () => {
    try {
      const [invoiceData, appointmentData] = await Promise.all([billingApi.invoices(), clinicalApi.listAppointments()]);
      setInvoices(invoiceData || []);
      setAppointments(appointmentData || []);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load billing workspace" });
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return invoices.filter((item) => [name(item.patientId), item.status, item.subtotal, item.outstandingAmount].join(" ").toLowerCase().includes(query));
  }, [invoices, search]);

  const submit = async (values) => {
    setBusy(true);
    try {
      if (modal.type === "invoice") {
        const appointment = appointments.find((item) => item._id === values.appointmentId);
        await billingApi.createInvoice({ patientId: appointment.patientId?._id || appointment.patientId, appointmentId: appointment._id, items: [{ description: values.description, quantity: values.quantity, unitPrice: values.unitPrice }] });
      } else {
        await billingApi.recordPayment({ invoiceId: modal.record._id, amount: values.amount, method: values.method });
      }
      setToast({ type: "success", message: "Billing workflow saved" });
      setModal({ type: null, record: null });
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to save billing workflow" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="e1-panel" id="billing-payments">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="e1-panel-header">
        <div><h2>Billing & Payments</h2><p>Create invoices from patient appointments and record payments from invoice rows.</p></div>
        <button className="button-primary" type="button" onClick={() => { reset({}); setModal({ type: "invoice", record: null }); }}><Receipt size={17} /> Create Invoice</button>
      </div>
      <div className="table-toolbar compact-toolbar"><SearchBar value={search} onChange={setSearch} placeholder="Search patient, amount or status" /></div>
      <DataTable
        rows={rows}
        columns={[
          { key: "patient", header: "Patient", render: (item) => name(item.patientId) },
          { key: "subtotal", header: "Total", render: (item) => `Rs. ${Number(item.subtotal || 0).toFixed(2)}` },
          { key: "paid", header: "Paid", render: (item) => `Rs. ${Number(item.paidAmount || 0).toFixed(2)}` },
          { key: "outstanding", header: "Outstanding", render: (item) => `Rs. ${Number(item.outstandingAmount || 0).toFixed(2)}` },
          { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
          { key: "actions", header: "Actions", render: (item) => <button className="table-link-button" type="button" onClick={() => { reset({ amount: item.outstandingAmount || "", method: "cash" }); setModal({ type: "payment", record: item }); }} disabled={item.outstandingAmount <= 0}>Record Payment</button> }
        ]}
      />
      <Modal open={Boolean(modal.type)} title={modal.type === "payment" ? "Record Payment" : "Create Invoice"} onClose={() => setModal({ type: null, record: null })}>
        <form onSubmit={handleSubmit(submit)}>
          {modal.type === "invoice" ? <div className="form-grid"><FormSelect label="Appointment" error={errors.appointmentId?.message} {...register("appointmentId")}><option value="">Select appointment</option>{appointments.map((item) => <option value={item._id} key={item._id}>{name(item.patientId)} - {new Date(item.appointmentDate).toLocaleDateString()}</option>)}</FormSelect><FormInput label="Description" error={errors.description?.message} {...register("description")} /><FormInput label="Quantity" type="number" min="1" step="1" error={errors.quantity?.message} {...register("quantity")} /><FormInput label="Unit Price" type="number" min="0" step="0.01" error={errors.unitPrice?.message} {...register("unitPrice")} /></div> : null}
          {modal.type === "payment" ? <div className="form-grid"><FormInput label="Amount" type="number" min="0.01" step="0.01" error={errors.amount?.message} {...register("amount")} /><FormSelect label="Method" error={errors.method?.message} {...register("method")}><option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option></FormSelect></div> : null}
          <div className="modal-actions"><button className="button-secondary" type="button" onClick={() => setModal({ type: null, record: null })} disabled={busy}>Cancel</button><button className="button-primary" type="submit" disabled={busy}><CreditCard size={16} /> {busy ? "Saving..." : "Save"}</button></div>
        </form>
      </Modal>
    </section>
  );
};
