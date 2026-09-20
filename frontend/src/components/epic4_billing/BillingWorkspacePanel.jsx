import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, CreditCard, DollarSign, Download, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { billingApi } from "../../services/billingApi.js";
import { clinicalApi } from "../../services/clinicalApi.js";
import { e1Api } from "../../services/e1Api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROLES } from "../../utils/roles.js";
import { requiredMoney, requiredQuantity } from "../../utils/validationSchemas.js";
import { printInvoicePDF, printPayslipPDF } from "../../utils/invoicePrintTemplate.js";
import { DASHBOARD_COMMAND_EVENT } from "../../utils/dashboardCommands.js";
import { customerLabel, patientLabel } from "../../utils/personLabels.js";
import { DataTable } from "../shared/DataTable.jsx";
import { Modal } from "../shared/Modal.jsx";
import { SearchBar } from "../shared/SearchBar.jsx";
import { StatusBadge } from "../shared/StatusBadge.jsx";
import { Toast } from "../shared/Toast.jsx";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const getInvoiceClient = (item) => customerLabel(item);
// Resolves a staff name from multiple possible shapes the API may return:
// 1. Populated: { userId: { firstName, lastName } }
// 2. Flat merged: { firstName, lastName } (userId fields hoisted)
// 3. Fallback: employeeId string
const staffName = (staff) => {
  if (!staff) return "Unknown";
  const u = staff.userId || {};
  const fromNested = [u.firstName, u.lastName].filter(Boolean).join(" ");
  if (fromNested) return fromNested;
  const fromFlat = [staff.firstName, staff.lastName].filter(Boolean).join(" ");
  if (fromFlat) return fromFlat;
  return staff.employeeId || "—";
};
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
  shiftRate: requiredMoney("Shift payment rate").min(0.01, "Shift payment rate must be greater than 0"),
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState({ type: null, record: null });
  const [payrollPreview, setPayrollPreview] = useState(null);
  const [payrollPreviewLoading, setPayrollPreviewLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const isManager = [ROLES.MANAGER, ROLES.ADMIN].includes(user?.role);
  const isCashier = [ROLES.CASHIER, ROLES.ADMIN].includes(user?.role);
  const canManagePayroll = [ROLES.MANAGER, ROLES.ADMIN, ROLES.CASHIER].includes(user?.role);

  const schema = useMemo(() => {
    if (modal.type === "payment") {
      const exactBal = modal.record?.outstandingAmount ? Number(modal.record.outstandingAmount) : 0;
      return z.object({
        amount: z.coerce.number({ invalid_type_error: "Amount is required" })
          .refine(
            (val) => Math.abs(val - exactBal) <= 0.01,
            { message: `Full payment of Rs. ${exactBal.toFixed(2)} required. Partial payments are not permitted.` }
          ),
        method: z.string().min(1, "Payment method is required")
      });
    }
    if (modal.type === "payroll") return payrollSchema;
    return invoiceSchema;
  }, [modal.type, modal.record]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({ resolver: zodResolver(schema), mode: "onChange" });
  const selectedStaffId = watch("staffId");
  const selectedPayrollMonth = watch("month");
  const selectedShiftRate = watch("shiftRate");
  const selectedAllowances = watch("allowances");
  const selectedDeductions = watch("deductions");

  const load = async () => {
    try {
      const requests = [billingApi.invoices(), billingApi.summary()];
      if (isCashier || isManager) requests.push(billingApi.payments()); else requests.push(Promise.resolve([]));
      if (canManagePayroll) {
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
    const handleDashboardCommand = (event) => {
      const command = event.detail || {};
      if (command.workspace !== "billing") return;
      if (command.tab) setActiveTab(command.tab);
      if (command.statusFilter !== undefined) setStatusFilter(command.statusFilter);
      if (command.search !== undefined) setSearch(command.search);
      if (command.action === "createInvoice" && isCashier) {
        reset({});
        setModal({ type: "invoice", record: null });
      }
    };

    window.addEventListener(DASHBOARD_COMMAND_EVENT, handleDashboardCommand);
    return () => window.removeEventListener(DASHBOARD_COMMAND_EVENT, handleDashboardCommand);
  }, [isCashier, reset]);

  useEffect(() => {
    if (modal.type !== "payroll" || !selectedStaffId) return;
    const selectedStaff = staff.find((item) => item._id === selectedStaffId);
    if (!selectedStaff) return;
    const defaultShiftRate = selectedStaff.shiftRate || (selectedStaff.baseSalary ? Number((Number(selectedStaff.baseSalary) / 26).toFixed(2)) : 0);
    setValue("shiftRate", defaultShiftRate, { shouldValidate: true });
    setValue("allowances", selectedStaff.allowances || 0, { shouldValidate: true });
    setValue("deductions", selectedStaff.deductions || 0, { shouldValidate: true });
  }, [modal.type, selectedStaffId, setValue, staff]);

  useEffect(() => {
    if (modal.type !== "payroll" || !selectedStaffId || !selectedPayrollMonth) {
      setPayrollPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPayrollPreviewLoading(true);
      try {
        const preview = await billingApi.previewPayroll({
          staffId: selectedStaffId,
          month: selectedPayrollMonth,
          shiftRate: selectedShiftRate || undefined,
          allowances: selectedAllowances || 0,
          deductions: selectedDeductions || 0
        });
        setPayrollPreview(preview);
      } catch (error) {
        setPayrollPreview(null);
      } finally {
        setPayrollPreviewLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [modal.type, selectedStaffId, selectedPayrollMonth, selectedShiftRate, selectedAllowances, selectedDeductions]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return invoices.filter((item) => {
      const text = [getInvoiceClient(item), item.customerPhone, item.patientId?.phone, item.status, item.subtotal, item.outstandingAmount, item.items?.map((i) => i.description).join(" ")].join(" ").toLowerCase();
      const matchesQuery = !query || text.includes(query);
      const matchesStatus = statusFilter === "all" ? true : statusFilter === "pending" ? item.status !== "paid" : item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

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
    printInvoicePDF(invoice);
  };

  const printPayslip = (item) => {
    printPayslipPDF(item);
  };

  return (
    <section className="e1-panel" id="billing-payments">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="e1-panel-header">
        <div><h2>Billing, Payments & Payroll</h2><p>Collect automatically generated invoices, reconcile revenue and process attendance-based payroll.</p></div>
        <div className="inline-actions">
          {canManagePayroll ? <button type="button" onClick={() => { setPayrollPreview(null); reset({ month: new Date().toISOString().slice(0, 7), shiftRate: 0, allowances: 0, deductions: 0 }); setModal({ type: "payroll", record: null }); }}><DollarSign size={17} /> Shift Payroll</button> : null}
        </div>
      </div>

      <div className="e1-tabbar">
        {["invoices", "payments", "revenue", "payroll"].map((tab) => (
          <button className={activeTab === tab ? "active" : ""} type="button" onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>
        ))}
      </div>

      {activeTab === "invoices" ? (
        <>
          <div className="table-toolbar compact-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ flex: 1, minWidth: "260px" }}>
              <SearchBar value={search} onChange={setSearch} placeholder="Search patient, medicine, or bill details..." />
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className={statusFilter === "all" ? "button-primary" : "button-secondary"}
                onClick={() => setStatusFilter("all")}
                style={{ padding: "5px 12px", fontSize: "0.82rem" }}
              >
                All ({invoices.length})
              </button>
              <button
                type="button"
                className={statusFilter === "pending" ? "button-primary" : "button-secondary"}
                onClick={() => setStatusFilter("pending")}
                style={{ padding: "5px 12px", fontSize: "0.82rem" }}
              >
                ⏳ Pending Bills ({invoices.filter((i) => i.status !== "paid").length})
              </button>
              <button
                type="button"
                className={statusFilter === "paid" ? "button-primary" : "button-secondary"}
                onClick={() => setStatusFilter("paid")}
                style={{ padding: "5px 12px", fontSize: "0.82rem" }}
              >
                Settled Paid ({invoices.filter((i) => i.status === "paid").length})
              </button>
            </div>
          </div>
          <DataTable
            rows={rows}
            columns={[
              { key: "patient", header: "Patient / Customer", render: (item) => getInvoiceClient(item) },
              { key: "phone", header: "Phone", render: (item) => item.customerPhone || item.patientId?.phone || "-" },
              {
                key: "details",
                header: "Invoice Charges",
                render: (item) => {
                  const hasDoctor = item.items?.some((i) => i.description?.toLowerCase().includes("consultation") || i.description?.toLowerCase().includes("channelling"));
                  const hasLab = item.items?.some((i) => i.description?.toLowerCase().includes("lab") || i.description?.toLowerCase().includes("investigation"));
                  const hasMed = item.items?.some((i) => i.description?.toLowerCase().includes("medicine") || i.description?.toLowerCase().includes("dispensed"));
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {hasDoctor ? (
                          <span style={{ fontSize: "0.72rem", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>
                            Consultation
                          </span>
                        ) : null}
                        {hasLab ? (
                          <span style={{ fontSize: "0.72rem", background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>
                            Lab
                          </span>
                        ) : null}
                        {hasMed ? (
                          <span style={{ fontSize: "0.72rem", background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>
                            Medicines
                          </span>
                        ) : null}
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "#334155" }}>
                        {item.items?.[0]?.description || "Medical Service"}
                        {item.items?.length > 1 ? (
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginLeft: "4px" }}>
                            (+{item.items.length - 1} more items)
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                }
              },
              { key: "subtotal", header: "Total", render: (item) => money(item.subtotal) },
              { key: "paid", header: "Paid", render: (item) => money(item.paidAmount) },
              { key: "outstanding", header: "Outstanding", render: (item) => money(item.outstandingAmount) },
              { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
              {
                key: "actions",
                header: "Actions",
                render: (item) => {
                  return (
                    <div className="inline-actions" style={{ flexWrap: "wrap", gap: "6px" }}>
                      {isCashier && item.outstandingAmount > 0 ? (
                        <button
                          className="button-primary"
                          style={{ padding: "4px 10px", fontSize: "0.82rem" }}
                          type="button"
                          onClick={() => {
                            reset({ amount: item.outstandingAmount || "", method: "cash" });
                            setModal({ type: "payment", record: item });
                          }}
                          title={item.invoiceType === "pharmacy" ? "Collect this pharmacy payment separately" : "Collect this invoice in full"}
                        >
                          <CreditCard size={13} style={{ display: "inline", marginRight: "3px" }} />
                          Collect
                        </button>
                      ) : null}
                      <button
                        className="button-secondary"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", fontSize: "0.8rem", fontWeight: 600 }}
                        type="button"
                        onClick={() => printInvoice(item)}
                        title={item.status === "paid" ? "View & Print Official Payment Receipt PDF" : "View & Print Invoice PDF"}
                      >
                        <Printer size={13} />
                        {item.status === "paid" ? "Receipt PDF" : "Invoice PDF"}
                      </button>
                    </div>
                  );
                }
              }
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
            { key: "staff", header: "Staff", render: (item) => {
              // item.staffId is the populated Staff doc; cross-reference staff state as fallback
              const resolvedStaff = typeof item.staffId === "object" ? item.staffId : staff.find((s) => s._id === item.staffId);
              return staffName(resolvedStaff) || staffName(staff.find((s) => s._id === (item.staffId?._id || item.staffId)));
            } },
            { key: "month", header: "Month" },
            { key: "payableShifts", header: "Payable Shifts", render: (item) => item.payableShifts ?? item.attendanceDays },
            { key: "totalShiftHours", header: "Shift Hours", render: (item) => Number(item.totalShiftHours || 0).toFixed(2) },
            { key: "shiftRate", header: "Rate / Shift", render: (item) => money(item.shiftRate || 0) },
            { key: "netSalary", header: "Net Salary", render: (item) => money(item.netSalary) },
            { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
            { key: "actions", header: "Actions", render: (item) => canManagePayroll ? <div className="inline-actions"><button type="button" onClick={() => changePayrollStatus(item, "reviewed")} disabled={busy || item.status !== "draft"}>Review</button><button type="button" onClick={() => changePayrollStatus(item, "approved")} disabled={busy || item.status !== "reviewed"}>Approve</button><button type="button" onClick={() => changePayrollStatus(item, "paid")} disabled={busy || item.status !== "approved"}>Mark Paid</button><button className="table-link-button" type="button" onClick={() => printPayslip(item)} title="Download Payslip as PDF"><Download size={13} style={{ display: "inline", marginRight: "4px" }} />Download PDF</button></div> : null }
          ]}
          emptyText="No payroll records yet."
        />
      ) : null}

      <Modal
        open={Boolean(modal.type)}
        title={modal.type === "payment" ? "Record Cashier Payment" : modal.type === "payroll" ? "Shift-Based Payroll" : "Create Invoice"}
        subtitle={modal.type === "payment" && modal.record ? `Patient: ${getInvoiceClient(modal.record)} • Due: ${money(modal.record.outstandingAmount)}` : ""}
        onClose={() => setModal({ type: null, record: null })}
      >
        <form onSubmit={handleSubmit(submit)}>
          {modal.type === "invoice" ? (
            <div className="form-grid">
              <FormSelect
                label="Completed Appointment"
                error={errors.appointmentId?.message}
                {...register("appointmentId", {
                  onChange: (e) => {
                    if (e.target.value) {
                      setValue("description", "Doctor Consultation Fee", { shouldValidate: true });
                      setValue("quantity", 1, { shouldValidate: true });
                      setValue("unitPrice", 1500, { shouldValidate: true });
                    }
                  }
                })}
              >
                <option value="">Select completed appointment</option>
                {appointments
                  .filter((item) => item.status === "completed")
                  .map((item) => (
                    <option value={item._id} key={item._id}>
                      {patientLabel(item.patientId)} - {new Date(item.appointmentDate).toLocaleDateString()} ({item.slotLabel || "Visit"})
                    </option>
                  ))}
              </FormSelect>
              <FormInput label="Description" placeholder="Doctor Consultation Fee" error={errors.description?.message} {...register("description")} />
              <FormInput label="Quantity" placeholder="1" type="number" min="1" step="1" error={errors.quantity?.message} {...register("quantity")} />
              <FormInput label="Unit Price (Rs.)" placeholder="1500.00" type="number" min="0" step="0.01" error={errors.unitPrice?.message} {...register("unitPrice")} />
            </div>
          ) : null}
          {modal.type === "payment" ? (
            <>
              {modal.record ? (
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e3a8a", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Patient Visit Charges Breakdown (Full Settlement Required):
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {modal.record.items?.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#334155" }}>
                        <span>&bull; {item.description} (x{item.quantity})</span>
                        <strong>{money(item.lineTotal)}</strong>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px dashed #cbd5e1", marginTop: "4px", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>
                      <span>Total Amount Due:</span>
                      <span style={{ color: "#16a34a" }}>{money(modal.record.outstandingAmount)}</span>
                    </div>
                  </div>
                </div>
              ) : null}
              {/* Policy notice */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "10px 12px", marginBottom: "12px", fontSize: "0.82rem", color: "#1e40af" }}>
                <span style={{ fontSize: "1rem", lineHeight: 1 }}>ℹ️</span>
                <span>Health Guard billing policy requires <strong>full invoice settlement in a single transaction</strong>. The amount is automatically set to the full outstanding balance and cannot be changed.</span>
              </div>
              <div className="form-grid">
                <FormInput
                  label="Amount (Rs.) — Full Settlement"
                  type="number"
                  min="0.01"
                  step="0.01"
                  error={errors.amount?.message}
                  readOnly
                  style={{ background: "#f1f5f9", cursor: "not-allowed", fontWeight: 600 }}
                  {...register("amount")}
                />
                <FormSelect label="Method" error={errors.method?.message} {...register("method")}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </FormSelect>
              </div>
            </>
          ) : null}
          {modal.type === "payroll" ? (
            <>
              <div className="form-grid">
                <FormSelect label="Staff Member" error={errors.staffId?.message} {...register("staffId")}>
                  <option value="">Select staff</option>
                  {staff.map((item) => {
                    const isExempt = item.role === "doctor" || item.payBasis === "exempt";
                    return (
                      <option value={item._id} key={item._id} disabled={isExempt}>
                        {staffName(item)} - {item.employeeId} {isExempt ? "• Clinic Owner (Paid per Consultation • Exempt)" : `(${item.role})`}
                      </option>
                    );
                  })}
                </FormSelect>
                <FormInput label="Payroll Month" type="month" error={errors.month?.message} {...register("month")} />
              </div>
              <div className="form-section-title">Shift Payment Components</div>
              <div className="form-grid-3">
                <FormInput label="Rate Per Completed Shift (Rs.)" placeholder="3500.00" type="number" min="0" step="0.01" error={errors.shiftRate?.message} {...register("shiftRate")} />
                <FormInput label="Allowances (Rs.)" placeholder="5000.00" type="number" min="0" step="0.01" error={errors.allowances?.message} {...register("allowances")} />
                <FormInput label="Deductions (Rs.)" placeholder="1500.00" type="number" min="0" step="0.01" error={errors.deductions?.message} {...register("deductions")} />
              </div>
              <div style={{ marginTop: "16px", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", background: "#ffffff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", padding: "12px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" }}>
                  <strong style={{ color: "#0f172a" }}>E1 Shift Attendance Preview</strong>
                  <span style={{ color: "#64748b", fontSize: "0.84rem" }}>
                    {payrollPreviewLoading ? "Loading linked shifts..." : payrollPreview?.existingPayroll ? "Payroll already exists for this staff/month" : "Checked-out shifts become payable"}
                  </span>
                </div>
                {payrollPreview ? (
                  <>
                    <div className="manager-summary-grid" style={{ margin: 0, padding: "12px" }}>
                      <div><strong>{payrollPreview.scheduledShifts || 0}</strong><span>scheduled shifts</span></div>
                      <div><strong>{payrollPreview.payableShifts || 0}</strong><span>payable shifts</span></div>
                      <div><strong>{Number(payrollPreview.totalShiftHours || 0).toFixed(2)}</strong><span>shift hours</span></div>
                      <div><strong>{money(payrollPreview.netSalary)}</strong><span>net payroll</span></div>
                    </div>
                    <div style={{ maxHeight: "220px", overflow: "auto", borderTop: "1px solid #e2e8f0" }}>
                      <table className="data-table" style={{ margin: 0, width: "100%" }}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Shift</th>
                            <th style={{ textAlign: "right" }}>Hours</th>
                            <th style={{ textAlign: "right" }}>Pay</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payrollPreview.payrollLines?.length ? payrollPreview.payrollLines.map((line) => (
                            <tr key={line.attendanceId || line.workDate}>
                              <td>{line.workDate}</td>
                              <td>{line.shiftLabel || "Completed shift"}</td>
                              <td style={{ textAlign: "right" }}>{Number(line.hours || 0).toFixed(2)}</td>
                              <td style={{ textAlign: "right", fontWeight: 700 }}>{money(line.amount)}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="4" style={{ textAlign: "center", color: "#64748b", padding: "18px" }}>
                                No checked-out E1 attendance shifts found for this month.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "18px", color: "#64748b", fontSize: "0.9rem" }}>
                    Select staff, month, and shift rate to preview payroll from E1 attendance.
                  </div>
                )}
              </div>
            </>
          ) : null}
          <div className="modal-actions"><button className="button-secondary" type="button" onClick={() => setModal({ type: null, record: null })} disabled={busy}>Cancel</button><button className="button-primary" type="submit" disabled={busy || (modal.type === "payroll" && payrollPreview?.existingPayroll)}><CreditCard size={16} /> {busy ? "Saving..." : modal.type === "payroll" ? "Create Shift Payroll" : "Save"}</button></div>
        </form>
      </Modal>
    </section>
  );
};
