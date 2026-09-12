import { apiClient } from "./apiClient.js";

const unwrap = ({ data }) => data.data;
const download = async (url) => (await apiClient.get(url, { responseType: "blob" })).data;

export const inventoryApi = {
  // Alerts & Reports
  alerts: async () => unwrap(await apiClient.get("/e3/inventory/alerts")),
  salesReport: async (period = "all") => unwrap(await apiClient.get("/e3/inventory/reports/sales", { params: { period } })),

  // Medicines
  medicines: async (params) => unwrap(await apiClient.get("/e3/inventory/medicines", { params })),
  createMedicine: async (payload) => unwrap(await apiClient.post("/e3/inventory/medicines", payload)),
  updateMedicine: async (id, payload) => unwrap(await apiClient.patch(`/e3/inventory/medicines/${id}`, payload)),
  deleteMedicine: async (id) => unwrap(await apiClient.delete(`/e3/inventory/medicines/${id}`)),

  // Batches
  batches: async () => unwrap(await apiClient.get("/e3/inventory/batches")),
  createBatch: async (payload) => unwrap(await apiClient.post("/e3/inventory/batches", payload)),
  updateBatch: async (id, payload) => unwrap(await apiClient.patch(`/e3/inventory/batches/${id}`, payload)),

  // Suppliers
  suppliers: async () => unwrap(await apiClient.get("/e3/inventory/suppliers")),
  createSupplier: async (payload) => unwrap(await apiClient.post("/e3/inventory/suppliers", payload)),
  updateSupplier: async (id, payload) => unwrap(await apiClient.patch(`/e3/inventory/suppliers/${id}`, payload)),
  deleteSupplier: async (id) => unwrap(await apiClient.delete(`/e3/inventory/suppliers/${id}`)),

  // Purchases
  purchases: async () => unwrap(await apiClient.get("/e3/inventory/purchases")),
  createPurchase: async (payload) => unwrap(await apiClient.post("/e3/inventory/purchases", payload)),

  // Sales / POS
  sales: async () => unwrap(await apiClient.get("/e3/inventory/sales")),
  createSale: async (payload) => unwrap(await apiClient.post("/e3/inventory/sales", payload)),
  getSaleDetails: async (id) => unwrap(await apiClient.get(`/e3/inventory/sales/${id}`)),
  downloadSaleBill: async (id) => download(`/e3/inventory/sales/${id}/bill`),

  // Pharmacy helpers
  patients: async () => unwrap(await apiClient.get("/e3/inventory/patients")),
  prescriptions: async () => unwrap(await apiClient.get("/e3/inventory/prescriptions"))
};
