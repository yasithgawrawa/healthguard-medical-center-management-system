// Provide inventory API calls through the shared HTTP client.
import { apiClient } from "./apiClient.js";

// Extract the payload from the shared API success response.
const unwrap = ({ data }) => data.data;
// Fetch a file as a Blob so the browser can save it.
const download = async (url) => (await apiClient.get(url, { responseType: "blob" })).data;

export const inventoryApi = {
  // Alerts & Reports
  // Send GET /e3/inventory/alerts and return the response payload.
  alerts: async () => unwrap(await apiClient.get("/e3/inventory/alerts")),
  // Send GET /e3/inventory/reports/sales and return the response payload.
  salesReport: async (period = "all") => unwrap(await apiClient.get("/e3/inventory/reports/sales", { params: { period } })),

  // Medicines
  // Send GET /e3/inventory/medicines and return the response payload.
  medicines: async (params) => unwrap(await apiClient.get("/e3/inventory/medicines", { params })),
  // Send POST /e3/inventory/medicines and return the response payload.
  createMedicine: async (payload) => unwrap(await apiClient.post("/e3/inventory/medicines", payload)),
  // Send PATCH /e3/inventory/medicines/${id} and return the response payload.
  updateMedicine: async (id, payload) => unwrap(await apiClient.patch(`/e3/inventory/medicines/${id}`, payload)),
  // Send DELETE /e3/inventory/medicines/${id} and return the response payload.
  deleteMedicine: async (id) => unwrap(await apiClient.delete(`/e3/inventory/medicines/${id}`)),

  // Batches
  // Send GET /e3/inventory/batches and return the response payload.
  batches: async () => unwrap(await apiClient.get("/e3/inventory/batches")),
  // Send POST /e3/inventory/batches and return the response payload.
  createBatch: async (payload) => unwrap(await apiClient.post("/e3/inventory/batches", payload)),
  // Send PATCH /e3/inventory/batches/${id} and return the response payload.
  updateBatch: async (id, payload) => unwrap(await apiClient.patch(`/e3/inventory/batches/${id}`, payload)),

  // Suppliers
  // Send GET /e3/inventory/suppliers and return the response payload.
  suppliers: async () => unwrap(await apiClient.get("/e3/inventory/suppliers")),
  // Send POST /e3/inventory/suppliers and return the response payload.
  createSupplier: async (payload) => unwrap(await apiClient.post("/e3/inventory/suppliers", payload)),
  // Send PATCH /e3/inventory/suppliers/${id} and return the response payload.
  updateSupplier: async (id, payload) => unwrap(await apiClient.patch(`/e3/inventory/suppliers/${id}`, payload)),
  // Send DELETE /e3/inventory/suppliers/${id} and return the response payload.
  deleteSupplier: async (id) => unwrap(await apiClient.delete(`/e3/inventory/suppliers/${id}`)),

  // Purchases
  // Send GET /e3/inventory/purchases and return the response payload.
  purchases: async () => unwrap(await apiClient.get("/e3/inventory/purchases")),
  // Send POST /e3/inventory/purchases and return the response payload.
  createPurchase: async (payload) => unwrap(await apiClient.post("/e3/inventory/purchases", payload)),

  // Medicine Returns
  // Send GET /e3/inventory/returns and return the response payload.
  returns: async () => unwrap(await apiClient.get("/e3/inventory/returns")),
  // Send GET /e3/inventory/returns/${id} and return the response payload.
  getReturnDetails: async (id) => unwrap(await apiClient.get(`/e3/inventory/returns/${id}`)),
  // Send POST /e3/inventory/returns and return the response payload.
  createReturn: async (payload) => unwrap(await apiClient.post("/e3/inventory/returns", payload)),
  // Send PATCH /e3/inventory/returns/${id} and return the response payload.
  updateReturn: async (id, payload) => unwrap(await apiClient.patch(`/e3/inventory/returns/${id}`, payload)),
  // Send DELETE /e3/inventory/returns/${id} and return the response payload.
  deleteReturn: async (id) => unwrap(await apiClient.delete(`/e3/inventory/returns/${id}`)),
  // Send PATCH /e3/inventory/returns/${id}/complete and return the response payload.
  completeReturn: async (id) => unwrap(await apiClient.patch(`/e3/inventory/returns/${id}/complete`)),

  // Sales / POS
  // Send GET /e3/inventory/sales and return the response payload.
  sales: async () => unwrap(await apiClient.get("/e3/inventory/sales")),
  // Send POST /e3/inventory/sales and return the response payload.
  createSale: async (payload) => unwrap(await apiClient.post("/e3/inventory/sales", payload)),
  // Send GET /e3/inventory/sales/${id} and return the response payload.
  getSaleDetails: async (id) => unwrap(await apiClient.get(`/e3/inventory/sales/${id}`)),
  // Fetch the selected sale's text bill as a downloadable Blob.
  downloadSaleBill: async (id) => download(`/e3/inventory/sales/${id}/bill`),

  // Pharmacy helpers
  // Send GET /e3/inventory/patients and return the response payload.
  patients: async () => unwrap(await apiClient.get("/e3/inventory/patients")),
  // Send GET /e3/inventory/prescriptions and return the response payload.
  prescriptions: async () => unwrap(await apiClient.get("/e3/inventory/prescriptions"))
};
