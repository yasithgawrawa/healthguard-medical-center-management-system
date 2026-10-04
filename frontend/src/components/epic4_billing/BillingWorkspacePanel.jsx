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
const dateOnly = (value) => (value ? new Date(value).toLocaleDateString() : "-");
const getInvoiceClient = (item) => customerLabel(item);
const normalizePhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length > 9 ? digits.slice(-9) : digits;
};
const chargeSummary = (items = []) => items.reduce((summary, item) => {
  const description = (item.description || "").toLowerCase();
  const amount = Number(item.lineTotal || 0);
  if (description.includes("consultation") || description.includes("channelling") || description.includes("doctor")) {
    summary.consultation += amount;
  } else if (description.includes("lab") || description.includes("investigation") || description.includes("test")) {
    summary.lab += amount;
  } else if (description.includes("medicine") || description.includes("medication") || description.includes("dispensed")) {
    summary.medicines += amount;
  } else {
    summary.other += amount;
  }
  return summary;
}, { consultation: 0, lab: 0, medicines: 0, other: 0 });
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
const supplierBillSchema = z.object({
  method: z.string().min(1, "Payment method is required")
});
const payrollSchema = z.object({
  staffId: z.string().min(1, "Select staff member"),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Select payroll month")
    .refine((month) => month <= new Date().toISOString().slice(0, 7), "Future payroll months are not allowed"),
  dailyPay: requiredMoney("Daily pay").min(0.01, "Daily pay must be greater than 0"),
  workingDays: requiredQuantity("Working days").max(31, "Working days cannot exceed 31"),
  allowances: requiredMoney("Allowances"),
  deductions: requiredMoney("Deductions")
});

export const BillingWorkspacePanel = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [supplierBills, setSupplierBills] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [staff, setStaff] = useState([]);
  const [summary, setSummary] = useState({ invoiced: 0, collected: 0, outstanding: 0, payrollExpense: 0 });
  const [activeTab, setActiveTab] = useState("invoices");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payrollStatusFilter, setPayrollStatusFilter] = useState("all");
  const [payrollMonthFilter, setPayrollMonthFilter] = useState("");
  const [modal, setModal] = useState({ type: null, record: null });
  const [payrollPreview, setPayrollPreview] = useState(null);
  const [payrollPreviewLoading, setPayrollPreviewLoading] = useState(false);
  const [payrollPreviewError, setPayrollPreviewError] = useState("");
  const [attendanceDaysLoading, setAttendanceDaysLoading] = useState(false);
  const [checkoutKey, setCheckoutKey] = useState("");
  const [checkoutMethod, setCheckoutMethod] = useState("cash");
  const [checkoutError, setCheckoutError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const isManager = [ROLES.MANAGER, ROLES.ADMIN].includes(user?.role);
  const isCashier = [ROLES.CASHIER, ROLES.ADMIN].includes(user?.role);
  const canManagePayroll = [ROLES.MANAGER, ROLES.ADMIN, ROLES.CASHIER].includes(user?.role);
  const canCreatePayroll = [ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN].includes(user?.role);

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
    if (modal.type === "supplierBill") return supplierBillSchema;
    if (modal.type === "payroll") return payrollSchema;
    return invoiceSchema;
  }, [modal.type, modal.record]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({ resolver: zodResolver(schema), mode: "onChange" });
  const selectedStaffId = watch("staffId");
  const selectedPayrollMonth = watch("month");
  const selectedDailyPay = watch("dailyPay");
  const selectedWorkingDays = watch("workingDays");
  const selectedAllowances = watch("allowances");
  const selectedDeductions = watch("deductions");
  const payrollDeductionsInvalid = Boolean(
    payrollPreview && Number(selectedDeductions || 0) > Number(payrollPreview.baseSalary || 0) + Number(selectedAllowances || 0)
  );

  const load = async () => {
    try {
      const requests = [billingApi.invoices(), billingApi.summary()];
      if (isCashier || isManager) {
        requests.push(billingApi.payments(), billingApi.supplierBills());
      } else {
        requests.push(Promise.resolve([]), Promise.resolve([]));
      }
      if (canManagePayroll) {
        requests.push(clinicalApi.listAppointments(), billingApi.payroll(), e1Api.listWorkforceStaff());
      } else {
        requests.push(isCashier ? clinicalApi.listAppointments() : Promise.resolve([]), Promise.resolve([]), Promise.resolve([]));
      }
      const [invoiceData, summaryData, paymentData, supplierBillData, appointmentData, payrollData, staffData] = await Promise.all(requests);
      setInvoices(invoiceData || []);
      setSummary(summaryData || {});
      setPayments(paymentData || []);
      setSupplierBills(supplierBillData || []);
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
      if (command.action === "createSalary" && canCreatePayroll) {
        setActiveTab("payroll");
        setPayrollPreview(null);
        setPayrollPreviewError("");
        reset({ month: new Date().toISOString().slice(0, 7), dailyPay: 0, workingDays: 26, allowances: 0, deductions: 0 });
        setModal({ type: "payroll", record: null });
      }
    };

    window.addEventListener(DASHBOARD_COMMAND_EVENT, handleDashboardCommand);
    return () => window.removeEventListener(DASHBOARD_COMMAND_EVENT, handleDashboardCommand);
  }, [canCreatePayroll, isCashier, reset]);

  useEffect(() => {
    if (modal.type !== "payroll" || !selectedStaffId) return;
    const selectedStaff = staff.find((item) => item._id === selectedStaffId);
    if (!selectedStaff) return;
    const defaultDailyPay = selectedStaff.shiftRate || (selectedStaff.baseSalary ? Number((Number(selectedStaff.baseSalary) / 26).toFixed(2)) : 0);
    setValue("dailyPay", defaultDailyPay, { shouldValidate: true });
    setValue("workingDays", 26, { shouldValidate: true });
    setValue("allowances", selectedStaff.allowances || 0, { shouldValidate: true });
    setValue("deductions", selectedStaff.deductions || 0, { shouldValidate: true });
  }, [modal.type, selectedStaffId, setValue, staff]);

  useEffect(() => {
    if (modal.type !== "payroll" || !selectedStaffId || !selectedPayrollMonth || !selectedDailyPay || !selectedWorkingDays) {
      setPayrollPreview(null);
      setPayrollPreviewError("");
      return;
    }

    const timer = setTimeout(async () => {
      setPayrollPreviewLoading(true);
      setPayrollPreviewError("");
      try {
        const preview = await billingApi.previewPayroll({
          staffId: selectedStaffId,
          month: selectedPayrollMonth,
          dailyPay: selectedDailyPay,
          workingDays: selectedWorkingDays,
          allowances: selectedAllowances || 0,
          deductions: selectedDeductions || 0
        });
        setPayrollPreview(preview);
      } catch (error) {
        setPayrollPreview(null);
        setPayrollPreviewError(error.response?.data?.message || "Unable to preview salary");
      } finally {
        setPayrollPreviewLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [modal.type, selectedStaffId, selectedPayrollMonth, selectedDailyPay, selectedWorkingDays, selectedAllowances, selectedDeductions]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return invoices.filter((item) => {
      if (item.status === "cancelled") return false;
      const text = [getInvoiceClient(item), item.customerPhone, item.patientId?.phone, item.status, item.subtotal, item.outstandingAmount, item.items?.map((i) => i.description).join(" ")].join(" ").toLowerCase();
      const matchesQuery = !query || text.includes(query);
      const matchesStatus = statusFilter === "all" ? true : statusFilter === "pending" ? item.status !== "paid" && item.status !== "cancelled" : item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const checkoutGroups = useMemo(() => {
    const groups = new Map();
    const payableInvoices = invoices.filter((invoice) => invoice.status !== "cancelled" && Number(invoice.outstandingAmount || 0) > 0);
    const patientByPhone = new Map();

    payableInvoices.forEach((invoice) => {
      const patientId = invoice.patientId?._id || invoice.patientId || "";
      const phone = normalizePhone(invoice.patientId?.phone);
      if (patientId && phone && !patientByPhone.has(phone)) {
        patientByPhone.set(phone, {
          key: `patient:${patientId}`,
          patientId,
          patient: invoice.patientId,
          label: getInvoiceClient(invoice),
          customerPhone: invoice.patientId?.phone
        });
      }
    });

    payableInvoices.forEach((invoice) => {
      const invoicePatientId = invoice.patientId?._id || invoice.patientId || "";
      const matchedPatient = invoicePatientId ? null : patientByPhone.get(normalizePhone(invoice.customerPhone));
      const patientId = invoicePatientId || matchedPatient?.patientId || "";
      const key = patientId ? `patient:${patientId}` : `invoice:${invoice._id}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          patientId,
          patient: invoice.patientId || matchedPatient?.patient,
          customerName: patientId ? undefined : invoice.customerName,
          customerPhone: matchedPatient?.customerPhone || invoice.customerPhone,
          label: matchedPatient?.label || getInvoiceClient(invoice),
          invoices: [],
          items: [],
          totalOutstanding: 0
        });
      }
      const group = groups.get(key);
      group.invoices.push(invoice);
      group.items.push(...(invoice.items || []));
      group.totalOutstanding += Number(invoice.outstandingAmount || 0);
    });

    return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [invoices]);

  const selectedCheckoutGroup = useMemo(
    () => checkoutGroups.find((group) => group.key === checkoutKey),
    [checkoutGroups, checkoutKey]
  );

  const selectedCheckoutSummary = useMemo(
    () => chargeSummary(selectedCheckoutGroup?.items || []),
    [selectedCheckoutGroup]
  );

  const payrollRows = useMemo(() => payroll.filter((item) => (
    (payrollStatusFilter === "all" || item.status === payrollStatusFilter) &&
    (!payrollMonthFilter || item.month === payrollMonthFilter)
  )), [payroll, payrollStatusFilter, payrollMonthFilter]);

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
      if (modal.type === "supplierBill") {
        await billingApi.paySupplierBill(modal.record._id, values.method);
        setActiveTab("supplierBills");
      }
      if (modal.type === "payroll") {
        await billingApi.createPayroll(values);
        setActiveTab("payroll");
        setPayrollMonthFilter(values.month);
        setPayrollStatusFilter("all");
      }
      setToast({ type: "success", message: modal.type === "payroll" ? "Salary draft saved" : modal.type === "supplierBill" ? "Supplier bill paid" : "Billing workflow saved" });
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
      setToast({ type: "success", message: `Salary ${status}` });
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to update salary" });
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

  const useAttendanceDays = async () => {
    if (!selectedStaffId || !selectedPayrollMonth) {
      setToast({ type: "error", message: "Select staff and month first" });
      return;
    }
    setAttendanceDaysLoading(true);
    try {
      const result = await billingApi.salaryAttendanceDays({ staffId: selectedStaffId, month: selectedPayrollMonth });
      setValue("workingDays", result.workingDays || 0, { shouldValidate: true, shouldDirty: true });
      setToast({ type: "success", message: `Loaded ${result.workingDays || 0} attendance day(s)` });
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load attendance days" });
    } finally {
      setAttendanceDaysLoading(false);
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

  const collectUnifiedCheckout = async () => {
    setCheckoutError("");
    if (!selectedCheckoutGroup) {
      setCheckoutError("Select a patient or bill to collect.");
      return;
    }
    if (!checkoutMethod) {
      setCheckoutError("Select a payment method.");
      return;
    }
    if (selectedCheckoutGroup.totalOutstanding <= 0) {
      setCheckoutError("There is no outstanding amount to collect.");
      return;
    }

    setBusy(true);
    try {
      const unifiedInvoice = selectedCheckoutGroup.patientId
        ? await billingApi.consolidateInvoices(selectedCheckoutGroup.patientId)
        : selectedCheckoutGroup.invoices[0];

      if (!unifiedInvoice?._id || Number(unifiedInvoice.outstandingAmount || 0) <= 0) {
        throw new Error("No payable invoice found for this checkout.");
      }

      const amountDue = Number(unifiedInvoice.outstandingAmount || 0);
      const paymentResult = await billingApi.recordPayment({
        invoiceId: unifiedInvoice._id,
        amount: amountDue,
        method: checkoutMethod
      });
      const paidInvoice = paymentResult?.invoice || unifiedInvoice;
      printInvoicePDF({
        ...paidInvoice,
        patientId: typeof paidInvoice.patientId === "object" ? paidInvoice.patientId : selectedCheckoutGroup.patient,
        customerName: paidInvoice.customerName || selectedCheckoutGroup.customerName,
        customerPhone: paidInvoice.customerPhone || selectedCheckoutGroup.customerPhone,
        status: "paid",
        paidAmount: Number(paidInvoice.subtotal || amountDue),
        outstandingAmount: 0,
        updatedAt: paidInvoice.updatedAt || new Date().toISOString()
      });
      setCheckoutKey("");
      setToast({ type: "success", message: "Unified payment collected and invoice opened for printing" });
      await load();
    } catch (error) {
      setCheckoutError(error.response?.data?.message || error.message || "Unable to collect unified payment.");
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
        <div><h2>Billing, Payments & Salary</h2><p>Collect invoices, reconcile revenue and create simple salary drafts from daily pay and working days.</p></div>
        <div className="inline-actions">
          {canCreatePayroll ? <button type="button" onClick={() => { setActiveTab("payroll"); setPayrollPreview(null); setPayrollPreviewError(""); reset({ month: new Date().toISOString().slice(0, 7), dailyPay: 0, workingDays: 26, allowances: 0, deductions: 0 }); setModal({ type: "payroll", record: null }); }}><DollarSign size={17} /> Run Salary</button> : null}
        </div>
      </div>

      <div className="e1-tabbar">
        {[
          { key: "invoices", label: "invoices" },
          { key: "payments", label: "payments" },
          ...((isCashier || isManager) ? [{ key: "supplierBills", label: "supplier bills" }] : []),
          { key: "revenue", label: "revenue" },
          { key: "payroll", label: "salary" }
        ].map((tab) => (
          <button className={activeTab === tab.key ? "active" : ""} type="button" onClick={() => setActiveTab(tab.key)} key={tab.key}>{tab.label}</button>
        ))}
      </div>

      {activeTab === "invoices" ? (
        <>
          {isCashier ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                collectUnifiedCheckout();
              }}
              style={{ border: "1px solid #dbeafe", borderRadius: "8px", background: "#ffffff", marginBottom: "12px", overflow: "hidden" }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "end", padding: "12px", background: "#f8fafc" }}>
                <div style={{ flex: "1 1 280px" }}>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "5px" }}>
                    Unified Checkout
                  </label>
                  <select value={checkoutKey} onChange={(event) => { setCheckoutKey(event.target.value); setCheckoutError(""); }} aria-label="Unified checkout patient">
                    <option value="">Select patient or customer</option>
                    {checkoutGroups.map((group) => (
                      <option value={group.key} key={group.key}>
                        {group.label} - {money(group.totalOutstanding)} ({group.invoices.length} bill{group.invoices.length === 1 ? "" : "s"})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: "1 1 160px" }}>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "5px" }}>
                    Amount Due
                  </label>
                  <input value={money(selectedCheckoutGroup?.totalOutstanding || 0)} readOnly aria-label="Unified checkout amount due" />
                </div>
                <div style={{ flex: "1 1 150px" }}>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "5px" }}>
                    Method
                  </label>
                  <select value={checkoutMethod} onChange={(event) => { setCheckoutMethod(event.target.value); setCheckoutError(""); }} aria-label="Unified checkout payment method">
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <button className="button-primary" type="submit" disabled={busy || !selectedCheckoutGroup} style={{ flex: "0 0 auto" }}>
                  <CreditCard size={16} /> Collect & Print
                </button>
              </div>
              {selectedCheckoutGroup ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", padding: "10px 12px", borderTop: "1px solid #e2e8f0" }}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{selectedCheckoutGroup.invoices.length} bill{selectedCheckoutGroup.invoices.length === 1 ? "" : "s"}</span>
                  <span>Consultation {money(selectedCheckoutSummary.consultation)}</span>
                  <span>Lab {money(selectedCheckoutSummary.lab)}</span>
                  <span>Medicines {money(selectedCheckoutSummary.medicines)}</span>
                  {selectedCheckoutSummary.other > 0 ? <span>Other {money(selectedCheckoutSummary.other)}</span> : null}
                </div>
              ) : null}
              {checkoutError ? <p className="form-error" style={{ margin: "0 12px 12px" }}>{checkoutError}</p> : null}
            </form>
          ) : null}
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
                ⏳ Pending Bills ({invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled").length})
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
                          title="Collect this invoice in full"
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

      {activeTab === "supplierBills" ? (
        <DataTable
          rows={supplierBills}
          columns={[
            { key: "createdAt", header: "Bill Date", render: (item) => dateOnly(item.createdAt) },
            { key: "supplier", header: "Supplier", render: (item) => <strong>{item.supplierId?.name || "Supplier"}</strong> },
            {
              key: "purchase",
              header: "Purchase",
              render: (item) => {
                const purchase = item.purchaseId || {};
                const medicine = purchase.medicineId?.name || "Medicine";
                const batch = purchase.batchId?.batchNumber ? ` (${purchase.batchId.batchNumber})` : "";
                return `${medicine}${batch} - ${purchase.quantity || 0} ${purchase.medicineId?.unit || "units"}`;
              }
            },
            { key: "unitCost", header: "Unit Cost", render: (item) => money(item.purchaseId?.purchasePrice) },
            { key: "amount", header: "Amount Due", render: (item) => <strong>{money(item.amount)}</strong> },
            { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
            {
              key: "actions",
              header: "Actions",
              render: (item) => (
                <div className="inline-actions">
                  {isCashier && item.status === "pending" ? (
                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => {
                        reset({ method: "cash" });
                        setModal({ type: "supplierBill", record: item });
                      }}
                      disabled={busy}
                    >
                      <CreditCard size={15} /> Pay Supplier
                    </button>
                  ) : item.status === "paid" ? (
                    <span style={{ color: "#64748b", fontSize: "0.82rem" }}>Paid {item.paidAt ? dateOnly(item.paidAt) : ""}</span>
                  ) : null}
                </div>
              )
            }
          ]}
          emptyText="No supplier bills sent to cashier yet."
        />
      ) : null}

      {activeTab === "revenue" ? (
        <div className="manager-summary-grid">
          <div><strong>{money(summary.invoiced)}</strong><span>total invoiced</span></div>
          <div><strong>{money(summary.collected)}</strong><span>payments collected</span></div>
          <div><strong>{money(summary.outstanding)}</strong><span>outstanding invoices</span></div>
          <div><strong>{money(summary.payrollExpense)}</strong><span>salary expense</span></div>
          <div><strong>{money(summary.supplierPayables)}</strong><span>supplier bills pending</span></div>
          <div><strong>{money(summary.supplierPaid)}</strong><span>supplier bills paid</span></div>
        </div>
      ) : null}

      {activeTab === "payroll" ? (
        <>
          <div className="manager-summary-grid" style={{ marginBottom: "12px" }}>
            <div><strong>{payroll.filter((item) => item.status === "draft").length}</strong><span>salary drafts</span></div>
            <div><strong>{payroll.filter((item) => item.status === "reviewed").length}</strong><span>awaiting approval</span></div>
            <div><strong>{payroll.filter((item) => item.status === "approved").length}</strong><span>awaiting payment</span></div>
            <div><strong>{payroll.filter((item) => item.status === "paid").length}</strong><span>paid payrolls</span></div>
          </div>
          <div className="table-toolbar compact-toolbar" style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <input type="month" value={payrollMonthFilter} onChange={(event) => setPayrollMonthFilter(event.target.value)} max={new Date().toISOString().slice(0, 7)} aria-label="Filter payroll month" />
            <select value={payrollStatusFilter} onChange={(event) => setPayrollStatusFilter(event.target.value)} aria-label="Filter payroll status">
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <DataTable
          rows={payrollRows}
          columns={[
            { key: "staff", header: "Staff", render: (item) => {
              // item.staffId is the populated Staff doc; cross-reference staff state as fallback
              const resolvedStaff = typeof item.staffId === "object" ? item.staffId : staff.find((s) => s._id === item.staffId);
              return staffName(resolvedStaff) || staffName(staff.find((s) => s._id === (item.staffId?._id || item.staffId)));
            } },
            { key: "month", header: "Month" },
            { key: "workingDays", header: "Working Days", render: (item) => item.workingDays ?? item.payableShifts ?? item.attendanceDays },
            { key: "dailyPay", header: "Daily Pay", render: (item) => money(item.dailyPay ?? item.shiftRate ?? 0) },
            { key: "grossPay", header: "Gross Pay", render: (item) => money(item.baseSalary) },
            { key: "netSalary", header: "Net Salary", render: (item) => money(item.netSalary) },
            { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
            { key: "actions", header: "Next Step", render: (item) => canManagePayroll ? <div className="inline-actions">
              {item.status === "draft" && isManager ? <button type="button" onClick={() => changePayrollStatus(item, "reviewed")} disabled={busy}>Review</button> : null}
              {item.status === "reviewed" && isManager ? <button type="button" onClick={() => changePayrollStatus(item, "approved")} disabled={busy}>Approve</button> : null}
              {item.status === "approved" && isCashier ? <button type="button" onClick={() => changePayrollStatus(item, "paid")} disabled={busy}>Mark Paid</button> : null}
              {item.status === "paid" ? <button className="table-link-button" type="button" onClick={() => printPayslip(item)} title="Download Payslip as PDF"><Download size={13} style={{ display: "inline", marginRight: "4px" }} />Payslip PDF</button> : null}
              {((item.status === "draft" || item.status === "reviewed") && !isManager) || (item.status === "approved" && !isCashier) ? <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Awaiting authorized action</span> : null}
            </div> : null }
          ]}
          emptyText="No salary records yet."
        />
        </>
      ) : null}

      <Modal
        open={Boolean(modal.type)}
        title={modal.type === "payment" ? "Record Cashier Payment" : modal.type === "supplierBill" ? "Pay Supplier Bill" : modal.type === "payroll" ? "Simple Salary Draft" : "Create Invoice"}
        subtitle={
          modal.type === "payment" && modal.record
            ? `Patient: ${getInvoiceClient(modal.record)} • Due: ${money(modal.record.outstandingAmount)}`
            : modal.type === "supplierBill" && modal.record
              ? `Supplier: ${modal.record.supplierId?.name || "Supplier"} • Due: ${money(modal.record.amount)}`
              : ""
        }
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
          {modal.type === "supplierBill" ? (
            <>
              {modal.record ? (
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>
                    <span>{modal.record.purchaseId?.medicineId?.name || "Medicine purchase"}</span>
                    <span>{money(modal.record.amount)}</span>
                  </div>
                  <div style={{ marginTop: "6px", color: "#64748b", fontSize: "0.82rem" }}>
                    Batch {modal.record.purchaseId?.batchId?.batchNumber || "-"} • Qty {modal.record.purchaseId?.quantity || 0} • Unit cost {money(modal.record.purchaseId?.purchasePrice)}
                  </div>
                </div>
              ) : null}
              <div className="form-grid">
                <FormSelect label="Payment Method" error={errors.method?.message} {...register("method")}>
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
                    const alreadyProcessed = Boolean(selectedPayrollMonth && payroll.some((entry) => (entry.staffId?._id || entry.staffId) === item._id && entry.month === selectedPayrollMonth));
                    return (
                      <option value={item._id} key={item._id} disabled={isExempt || alreadyProcessed}>
                        {staffName(item)} - {item.employeeId} {isExempt ? "• Clinic Owner (Paid per Consultation • Exempt)" : alreadyProcessed ? "• Salary already created" : `(${item.role})`}
                      </option>
                    );
                  })}
                </FormSelect>
                <FormInput label="Payroll Month" type="month" max={new Date().toISOString().slice(0, 7)} error={errors.month?.message} {...register("month")} />
              </div>
              <div className="form-section-title">Salary Details</div>
              <div className="form-grid-3">
                <FormInput label="Daily Pay (Rs.)" placeholder="3500.00" type="number" min="0" step="0.01" error={errors.dailyPay?.message} {...register("dailyPay")} />
                <div>
                  <FormInput label="Working Days" placeholder="26" type="number" min="1" max="31" step="1" error={errors.workingDays?.message} {...register("workingDays")} />
                  <button
                    className="table-link-button"
                    type="button"
                    onClick={useAttendanceDays}
                    disabled={attendanceDaysLoading || !selectedStaffId || !selectedPayrollMonth}
                    style={{ marginTop: "6px" }}
                  >
                    {attendanceDaysLoading ? "Loading attendance..." : "Use attendance days"}
                  </button>
                </div>
                <FormInput label="Allowances (Rs.)" placeholder="5000.00" type="number" min="0" step="0.01" error={errors.allowances?.message} {...register("allowances")} />
              </div>
              <div className="form-grid">
                <FormInput label="Deductions (Rs.)" placeholder="1500.00" type="number" min="0" step="0.01" error={errors.deductions?.message} {...register("deductions")} />
              </div>
              {payrollDeductionsInvalid ? <p className="form-error">Deductions cannot exceed gross pay plus allowances.</p> : null}
              <div style={{ marginTop: "16px", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", background: "#ffffff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", padding: "12px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" }}>
                  <strong style={{ color: "#0f172a" }}>Salary Preview</strong>
                  <span style={{ color: "#64748b", fontSize: "0.84rem" }}>
                    {payrollPreviewLoading ? "Calculating..." : payrollPreview?.existingPayroll ? "Salary already exists for this staff/month" : "Daily pay x working days"}
                  </span>
                </div>
                {payrollPreview ? (
                  <div className="manager-summary-grid" style={{ margin: 0, padding: "12px" }}>
                    <div><strong>{money(payrollPreview.dailyPay ?? payrollPreview.shiftRate ?? 0)}</strong><span>daily pay</span></div>
                    <div><strong>{payrollPreview.workingDays ?? payrollPreview.payableShifts ?? 0}</strong><span>working days</span></div>
                    <div><strong>{money(payrollPreview.baseSalary)}</strong><span>gross pay</span></div>
                    <div><strong>{money(payrollPreview.netSalary)}</strong><span>net salary</span></div>
                  </div>
                ) : (
                  <div style={{ padding: "18px", color: "#64748b", fontSize: "0.9rem" }}>
                    {payrollPreviewError || "Select staff, month, daily pay and working days to preview salary."}
                  </div>
                )}
              </div>
            </>
          ) : null}
          <div className="modal-actions"><button className="button-secondary" type="button" onClick={() => setModal({ type: null, record: null })} disabled={busy}>Cancel</button><button className="button-primary" type="submit" disabled={busy || (modal.type === "payroll" && (payrollPreviewLoading || !payrollPreview || payrollPreview.existingPayroll || (payrollPreview.workingDays ?? payrollPreview.payableShifts ?? 0) === 0 || payrollDeductionsInvalid))}><CreditCard size={16} /> {busy ? "Saving..." : modal.type === "payroll" ? "Create Salary Draft" : modal.type === "supplierBill" ? "Mark Supplier Paid" : "Save"}</button></div>
        </form>
      </Modal>
    </section>
  );
};
