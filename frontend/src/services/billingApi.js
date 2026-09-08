import { apiClient } from "./apiClient.js";

const unwrap = ({ data }) => data.data;

export const billingApi = {
  summary: async () => unwrap(await apiClient.get("/e4/billing/summary")),
  invoices: async () => unwrap(await apiClient.get("/e4/billing/invoices")),
  createInvoice: async (payload) => unwrap(await apiClient.post("/e4/billing/invoices", payload)),
  payments: async () => unwrap(await apiClient.get("/e4/billing/payments")),
  recordPayment: async (payload) => unwrap(await apiClient.post("/e4/billing/payments", payload))
};
