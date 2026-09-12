import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, CreditCard, DollarSign, Download, Receipt } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { billingApi } from "../../services/billingApi.js";
import { clinicalApi } from "../../services/clinicalApi.js";
import { e1Api } from "../../services/e1Api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROLES } from "../../utils/roles.js";
import { requiredMoney, requiredQuantity } from "../../utils/validationSchemas.js";
import { printInvoicePDF, printPayslipPDF, downloadInvoicePDF, downloadPayslipPDF } from "../../utils/invoicePrintTemplate.js";
import { DataTable } from "../shared/DataTable.jsx";
import { Modal } from "../shared/Modal.jsx";
import { SearchBar } from "../shared/SearchBar.jsx";
import { StatusBadge } from "../shared/StatusBadge.jsx";
import { Toast } from "../shared/Toast.jsx";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const name = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Patient";
const staffName = (staff) => [staff?.userId?.firstName, staff?.userId?.lastName].filter(Boolean).join(" ") || staff?.employeeId || "Staff";
const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const invoiceSchema = z.object({
  appointmentId: z.string().min(1, "Select appointment"),
  description: z.string().trim().min(2, "Description is required").max(120, "Description is too long"),
  quantity: requiredQuantity(),
  unitPrice: requiredMoney("Unit price").min(0.01, "Unit price must be greater than 0")
});
const paymentSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: "Amount is required" }).min(0.01, "Amount must be greater than 0").max(10000000, "Amount is too high"),
  method: z.string().min(1, "Payment method is required")
});
const payrollSchema = z.object({
  staffId: z.string().min(1, "Select staff member"),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Select payroll month"),
  baseSalary: requiredMoney("Base salary").min(0.01, "Base salary must be greater than 0"),
  allowances: requiredMoney("Allowances"),
  deductions: requiredMoney("Deductions")
});

export const BillingWorkspacePanel = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [staff, setStaff] = useState([]);
  const [summary, setSummary] = useState({ invoiced: 0, collected: 0, outstanding: 0, payrollExpense: 0 });
  const [activeTab, setActiveTab] = useState("invoices");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({ type: null, record: null });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const isManager = [ROLES.MANAGER, ROLES.ADMIN].includes(user?.role);
  const isCashier = [ROLES.CASHIER, ROLES.ADMIN].includes(user?.role);

  const schema = useMemo(() => {
    if (modal.type === "payment") {
      const maxBal = modal.record?.outstandingAmount ? Number(modal.record.outstandingAmount) : 10000000;
      return z.object({
        amount: z.coerce.number({ invalid_type_error: "Amount is required" })
          .min(0.01, "Amount must be greater than 0")
          .max(maxBal, `Amount cannot exceed outstanding balance of Rs. ${maxBal.toFixed(2)}`),
        method: z.string().min(1, "Payment method is required")
      });
    }
    if (modal.type === "payroll") return payrollSchema;
    return invoiceSchema;
  }, [modal.type, modal.record]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({ resolver: zodResolver(schema), mode: "onChange" });
  const selectedStaffId = watch("staffId");

  const load = async () => {
    try {
      const requests = [billingApi.invoices(), billingApi.summary()];
      if (isCashier || isManager) requests.push(billingApi.payments()); else requests.push(Promise.resolve([]));
      if (isManager) {
        requests.push(clinicalApi.listAppointments(), billingApi.payroll(), e1Api.listWorkforceStaff());
      } else {
        requests.push(isCashier ? clinicalApi.listAppointments() : Promise.resolve([]), Promise.resolve([]), Promise.resolve([]));
      }
      const [invoiceData, summaryData, paymentData, appointmentData, payrollData, staffData] = await Promise.all(requests);
      setInvoices(invoiceData || []);
      setSummary(summaryData || {});
      setPayments(paymentData || []);
      setAppointments(appointmentData || []);
      setPayroll(payrollData || []);
      setStaff(staffData || []);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load billing workspace" });
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (modal.type !== "payroll" || !selectedStaffId) return;
    const selectedStaff = staff.find((item) => item._id === selectedStaffId);
    if (!selectedStaff) return;
    setValue("baseSalary", selectedStaff.baseSalary || 0, { shouldValidate: true });
    setValue("allowances", selectedStaff.allowances || 0, { shouldValidate: true });
    setValue("deductions", selectedStaff.deductions || 0, { shouldValidate: true });
  }, [modal.type, selectedStaffId, setValue, staff]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return invoices.filter((item) => [name(item.patientId), item.status, item.subtotal, item.outstandingAmount].join(" ").toLowerCase().includes(query));
  }, [invoices, search]);

  const submit = async (values) => {
    setBusy(true);
    try {
      if (modal.type === "invoice") {
        const appointment = appointments.find((item) => item._id === values.appointmentId);
        await billingApi.createInvoice({
          patientId: appointment.patientId?._id || appointment.patientId,
          appointmentId: appointment._id,
          items: [{ description: values.description, quantity: values.quantity, unitPrice: values.unitPrice }]
        });
      }
      if (modal.type === "payment") {
        await billingApi.recordPayment({ invoiceId: modal.record._id, amount: values.amount, method: values.method });
      }
      if (modal.type === "payroll") {
        await billingApi.createPayroll(values);
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

  const changePaymentStatus = async (payment, status) => {
    setBusy(true);
    try {
      await billingApi.updatePaymentStatus(payment._id, status);
      setToast({ type: "success", message: `Payment ${status}` });
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to update payment" });
    } finally {
      setBusy(false);
    }
  };

  const changePayrollStatus = async (item, status) => {
    setBusy(true);
    try {
      await billingApi.updatePayrollStatus(item._id, status);
      setToast({ type: "success", message: `Payroll ${status}` });
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to update payroll" });
    } finally {
      setBusy(false);
    }
  };

  const downloadPayslip = async (item) => {
    setBusy(true);
    try {
      saveBlob(await billingApi.downloadPayslip(item._id), `healthguard-payslip-${item.month}-${item._id}.txt`);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to download payslip" });
    } finally {
      setBusy(false);
    }
  };

  const downloadReceipt = async (invoice) => {
    setBusy(true);
    try {
      saveBlob(await billingApi.downloadReceipt(invoice._id), `healthguard-receipt-${invoice._id}.txt`);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to download receipt" });
    } finally {
      setBusy(false);
    }
  };

  const printInvoice = (invoice) => {
    downloadInvoicePDF(invoice);
  };

  const printPayslip = (item) => {
    downloadPayslipPDF(item);
  };

  return (
    <section className="e1-panel" id="billing-payments">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="e1-panel-header">
        <div><h2>Billing, Payments & Payroll</h2><p>Create invoices, record payments, reconcile revenue and process attendance-based payroll.</p></div>
        <div className="inline-actions">
          {isCashier ? <button className="button-primary" type="button" onClick={() => { reset({}); setModal({ type: "invoice", record: null }); }}><Receipt size={17} /> Create Invoice</button> : null}
          {isManager ? <button type="button" onClick={() => { reset({ month: new Date().toISOString().slice(0, 7), allowances: 0, deductions: 0 }); setModal({ type: "payroll", record: null }); }}><DollarSign size={17} /> Calculate Payroll</button> : null}
        </div>
      </div>

      <div className="e1-tabbar">
        {["invoices", "payments", "revenue", "payroll"].map((tab) => (
          <button className={activeTab === tab ? "active" : ""} type="button" onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>
        ))}
      </div>

      {activeTab === "invoices" ? (
        <>
          <div className="table-toolbar compact-toolbar"><SearchBar value={search} onChange={setSearch} placeholder="Search patient, amount or status" /></div>
          <DataTable
            rows={rows}
            columns={[
              { key: "patient", header: "Patient", render: (item) => name(item.patientId) },
              {
                key: "details",
                header: "Service / Order Details",
                render: (item) => {
                  const isPharmacy = item.items?.some((i) => i.description?.toLowerCase().includes("medicine"));
                  return (
                    <div>
                      <span style={{ fontSize: "0.84rem", fontWeight: 600, color: isPharmacy ? "#0284c7" : "var(--brand-900)" }}>
                        {item.items?.[0]?.description || "Medical Service"}
                      </span>
                      {item.items?.length > 1 ? (
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginLeft: "4px" }}>
                          (+{item.items.length - 1} more items)
                        </span>
                      ) : null}
                    </div>
                  );
                }
              },
              { key: "subtotal", header: "Total", render: (item) => money(item.subtotal) },
              { key: "paid", header: "Paid", render: (item) => money(item.paidAmount) },
              { key: "outstanding", header: "Outstanding", render: (item) => money(item.outstandingAmount) },
              { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
              { key: "actions", header: "Actions", render: (item) => <div className="inline-actions">{isCashier ? <button className="table-link-button" type="button" onClick={() => { reset({ amount: item.outstandingAmount || "", method: "cash" }); setModal({ type: "payment", record: item }); }} disabled={item.outstandingAmount <= 0}>Record Payment</button> : null}<button className="table-link-button" type="button" onClick={() => printInvoice(item)} title="Download as PDF"><Download size={13} style={{ display: "inline", marginRight: "4px" }} />Download PDF</button></div> }
            ]}
          />
        </>
      ) : null}

      {activeTab === "payments" ? (
        <DataTable
          rows={payments}
          columns={[
            { key: "amount", header: "Amount", render: (item) => money(item.amount) },
            { key: "method", header: "Method", render: (item) => item.method?.replace("_", " ") },
            { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
            { key: "actions", header: "Actions", render: (item) => <div className="inline-actions"><button type="button" onClick={() => changePaymentStatus(item, "verified")} disabled={busy || item.status !== "recorded"}><CheckCircle size={15} /> Verify</button><button type="button" onClick={() => changePaymentStatus(item, "reconciled")} disabled={busy || item.status !== "verified"}>Reconcile</button></div> }
          ]}
          emptyText="No payments recorded yet."
        />
      ) : null}

      {activeTab === "revenue" ? (
        <div className="manager-summary-grid">
          <div><strong>{money(summary.invoiced)}</strong><span>total invoiced</span></div>
          <div><strong>{money(summary.collected)}</strong><span>payments collected</span></div>
          <div><strong>{money(summary.outstanding)}</strong><span>outstanding invoices</span></div>
          <div><strong>{money(summary.payrollExpense)}</strong><span>payroll expense</span></div>
        </div>
      ) : null}

      {activeTab === "payroll" ? (
        <DataTable
          rows={payroll}
          columns={[
            { key: "staff", header: "Staff", render: (item) => staffName(item.staffId) },
            { key: "month", header: "Month" },
            { key: "attendanceDays", header: "Attendance Days" },
            { key: "netSalary", header: "Net Salary", render: (item) => money(item.netSalary) },
            { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
            { key: "actions", header: "Actions", render: (item) => isManager ? <div className="inline-actions"><button type="button" onClick={() => changePayrollStatus(item, "reviewed")} disabled={busy || item.status !== "draft"}>Review</button><button type="button" onClick={() => changePayrollStatus(item, "approved")} disabled={busy || item.status !== "reviewed"}>Approve</button><button type="button" onClick={() => changePayrollStatus(item, "paid")} disabled={busy || item.status !== "approved"}>Mark Paid</button><button className="table-link-button" type="button" onClick={() => printPayslip(item)} title="Download Payslip as PDF"><Download size={13} style={{ display: "inline", marginRight: "4px" }} />Download PDF</button></div> : null }
          ]}
          emptyText="No payroll records yet."
        />
      ) : null}

      <Modal
        open={Boolean(modal.type)}
        title={modal.type === "payment" ? "Record Cashier Payment" : modal.type === "payroll" ? "Calculate Payroll" : "Create Invoice"}
        subtitle={modal.type === "payment" && modal.record ? `Patient: ${name(modal.record.patientId)} • Due: ${money(modal.record.outstandingAmount)}` : ""}
        onClose={() => setModal({ type: null, record: null })}
      >
        <form onSubmit={handleSubmit(submit)}>
          {modal.type === "invoice" ? <div className="form-grid"><FormSelect label="Completed Appointment" error={errors.appointmentId?.message} {...register("appointmentId")}><option value="">Select completed appointment</option>{appointments.filter((item) => item.status === "completed").map((item) => <option value={item._id} key={item._id}>{name(item.patientId)} - {new Date(item.appointmentDate).toLocaleDateString()}</option>)}</FormSelect><FormInput label="Description" placeholder="Consultation" error={errors.description?.message} {...register("description")} /><FormInput label="Quantity" placeholder="1" type="number" min="1" step="1" error={errors.quantity?.message} {...register("quantity")} /><FormInput label="Unit Price" placeholder="1500.00" type="number" min="0" step="0.01" error={errors.unitPrice?.message} {...register("unitPrice")} /></div> : null}
          {modal.type === "payment" ? <div className="form-grid"><FormInput label="Amount" placeholder="1500.00" type="number" min="0.01" step="0.01" error={errors.amount?.message} {...register("amount")} /><FormSelect label="Method" error={errors.method?.message} {...register("method")}><option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option></FormSelect></div> : null}
          {modal.type === "payroll" ? (
            <>
              <div className="form-grid">
                <FormSelect label="Staff Member" error={errors.staffId?.message} {...register("staffId")}>
                  <option value="">Select staff</option>
                  {staff.map((item) => <option value={item._id} key={item._id}>{staffName(item)} - {item.employeeId}</option>)}
                </FormSelect>
                <FormInput label="Payroll Month" type="month" error={errors.month?.message} {...register("month")} />
              </div>
              <div className="form-section-title">Compensation Components</div>
              <div className="form-grid-3">
                <FormInput label="Base Salary (Rs.)" placeholder="95000.00" type="number" min="0" step="0.01" error={errors.baseSalary?.message} {...register("baseSalary")} />
                <FormInput label="Allowances (Rs.)" placeholder="5000.00" type="number" min="0" step="0.01" error={errors.allowances?.message} {...register("allowances")} />
                <FormInput label="Deductions (Rs.)" placeholder="1500.00" type="number" min="0" step="0.01" error={errors.deductions?.message} {...register("deductions")} />
              </div>
            </>
          ) : null}
          <div className="modal-actions"><button className="button-secondary" type="button" onClick={() => setModal({ type: null, record: null })} disabled={busy}>Cancel</button><button className="button-primary" type="submit" disabled={busy}><CreditCard size={16} /> {busy ? "Saving..." : "Save"}</button></div>
        </form>
      </Modal>
    </section>
  );
};
