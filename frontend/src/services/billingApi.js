import { apiClient } from "./apiClient.js";

const unwrap = ({ data }) => data.data;
const download = async (url) => (await apiClient.get(url, { responseType: "blob" })).data;

export const billingApi = {
  summary: async () => unwrap(await apiClient.get("/e4/billing/summary")),
  invoices: async () => unwrap(await apiClient.get("/e4/billing/invoices")),
  createInvoice: async (payload) => unwrap(await apiClient.post("/e4/billing/invoices", payload)),
  payments: async () => unwrap(await apiClient.get("/e4/billing/payments")),
  recordPayment: async (payload) => unwrap(await apiClient.post("/e4/billing/payments", payload)),
  updatePaymentStatus: async (id, status) => unwrap(await apiClient.patch(`/e4/billing/payments/${id}/status`, { status })),
  payroll: async () => unwrap(await apiClient.get("/e4/billing/payroll")),
  createPayroll: async (payload) => unwrap(await apiClient.post("/e4/billing/payroll", payload)),
  updatePayrollStatus: async (id, status) => unwrap(await apiClient.patch(`/e4/billing/payroll/${id}/status`, { status })),
  downloadReceipt: async (id) => download(`/e4/billing/invoices/${id}/receipt`),
  downloadPayslip: async (id) => download(`/e4/billing/payroll/${id}/payslip`),
  consolidateInvoices: async (patientId) => unwrap(await apiClient.post("/e4/billing/invoices/consolidate", { patientId }))
};
