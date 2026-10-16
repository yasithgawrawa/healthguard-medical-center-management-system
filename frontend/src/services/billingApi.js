// Billing Workspace | API Request | Provide billing API calls through the shared HTTP client.
import { apiClient } from "./apiClient.js";

// Billing Workspace | API Request | Extract the payload from the shared API success response.
const unwrap = ({ data }) => data.data;
// Billing Workspace | API Request | Fetch a file as a Blob so the browser can save it.
const download = async (url) => (await apiClient.get(url, { responseType: "blob" })).data;

export const billingApi = {
  // View Revenue Summary | API Request | Send GET /e4/billing/summary and return the response payload.
  summary: async () => unwrap(await apiClient.get("/e4/billing/summary")),
  // View Invoices | API Request | Send GET /e4/billing/invoices and return the response payload.
  invoices: async () => unwrap(await apiClient.get("/e4/billing/invoices")),
  // Create Invoice | API Request | Send POST /e4/billing/invoices and return the response payload.
  createInvoice: async (payload) => unwrap(await apiClient.post("/e4/billing/invoices", payload)),
  // View Payments | API Request | Send GET /e4/billing/payments and return the response payload.
  payments: async () => unwrap(await apiClient.get("/e4/billing/payments")),
  // Record Payment | API Request | Send POST /e4/billing/payments and return the response payload.
  recordPayment: async (payload) => unwrap(await apiClient.post("/e4/billing/payments", payload)),
  // Update Payment Status | API Request | Send PATCH /e4/billing/payments/${id}/status and return the response payload.
  updatePaymentStatus: async (id, status) => unwrap(await apiClient.patch(`/e4/billing/payments/${id}/status`, { status })),
  // View Supplier Bills | API Request | Send GET /e4/billing/supplier-bills and return the response payload.
  supplierBills: async () => unwrap(await apiClient.get("/e4/billing/supplier-bills")),
  // Pay Supplier Bill | API Request | Send PATCH /e4/billing/supplier-bills/${id}/pay and return the response payload.
  paySupplierBill: async (id, method) => unwrap(await apiClient.patch(`/e4/billing/supplier-bills/${id}/pay`, { method })),
  // View Expenses | API Request | Send GET /e4/billing/expenses and return the response payload.
  expenses: async (params = {}) => unwrap(await apiClient.get("/e4/billing/expenses", { params })),
  // View Expense Details | API Request | Send GET /e4/billing/expenses/${id} and return the response payload.
  getExpense: async (id) => unwrap(await apiClient.get(`/e4/billing/expenses/${id}`)),
  // Create Expense | API Request | Send POST /e4/billing/expenses and return the response payload.
  createExpense: async (payload) => unwrap(await apiClient.post("/e4/billing/expenses", payload)),
  // Update Expense | API Request | Send PATCH /e4/billing/expenses/${id} and return the response payload.
  updateExpense: async (id, payload) => unwrap(await apiClient.patch(`/e4/billing/expenses/${id}`, payload)),
  // Delete Expense | API Request | Send DELETE /e4/billing/expenses/${id} and return the response payload.
  deleteExpense: async (id) => unwrap(await apiClient.delete(`/e4/billing/expenses/${id}`)),
  // View Salaries | API Request | Send GET /e4/billing/payroll and return the response payload.
  payroll: async () => unwrap(await apiClient.get("/e4/billing/payroll")),
  // View Salary Attendance Days | API Request | Send GET /e4/billing/payroll/attendance-days and return the response payload.
  salaryAttendanceDays: async (params) => unwrap(await apiClient.get("/e4/billing/payroll/attendance-days", { params })),
  // Preview Salary | API Request | Send POST /e4/billing/payroll/preview and return the response payload.
  previewPayroll: async (payload) => unwrap(await apiClient.post("/e4/billing/payroll/preview", payload)),
  // Create Salary Draft | API Request | Send POST /e4/billing/payroll and return the response payload.
  createPayroll: async (payload) => unwrap(await apiClient.post("/e4/billing/payroll", payload)),
  // Update Salary Status | API Request | Send PATCH /e4/billing/payroll/${id}/status and return the response payload.
  updatePayrollStatus: async (id, status) => unwrap(await apiClient.patch(`/e4/billing/payroll/${id}/status`, { status })),
  // Download Invoice Receipt | API Request | Download the selected paid invoice's receipt and save it in the browser.
  downloadReceipt: async (id) => download(`/e4/billing/invoices/${id}/receipt`),
  // Download Payslip | API Request | Download the selected salary record using the shared payslip download flow.
  downloadPayslip: async (id) => download(`/e4/billing/payroll/${id}/payslip`),
  // Consolidate Patient Invoices | API Request | Send POST /e4/billing/invoices/consolidate and return the response payload.
  consolidateInvoices: async (patientId) => unwrap(await apiClient.post("/e4/billing/invoices/consolidate", { patientId })),
  // View Doctor Earnings | API Request | Send GET /e4/billing/doctor-earnings and return the response payload.
  doctorEarnings: async (doctorId) => unwrap(await apiClient.get("/e4/billing/doctor-earnings", { params: doctorId ? { doctorId } : {} }))
};
