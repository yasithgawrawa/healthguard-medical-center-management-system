import { apiClient } from "./apiClient.js";

const unwrap = ({ data }) => data.data;

export const inventoryApi = {
  alerts: async () => unwrap(await apiClient.get("/e3/inventory/alerts")),
  medicines: async () => unwrap(await apiClient.get("/e3/inventory/medicines")),
  createMedicine: async (payload) => unwrap(await apiClient.post("/e3/inventory/medicines", payload)),
  updateMedicine: async (id, payload) => unwrap(await apiClient.patch(`/e3/inventory/medicines/${id}`, payload)),
  suppliers: async () => unwrap(await apiClient.get("/e3/inventory/suppliers")),
  createSupplier: async (payload) => unwrap(await apiClient.post("/e3/inventory/suppliers", payload)),
  batches: async () => unwrap(await apiClient.get("/e3/inventory/batches")),
  createBatch: async (payload) => unwrap(await apiClient.post("/e3/inventory/batches", payload)),
  updateBatch: async (id, payload) => unwrap(await apiClient.patch(`/e3/inventory/batches/${id}`, payload)),
  purchases: async () => unwrap(await apiClient.get("/e3/inventory/purchases")),
  createPurchase: async (payload) => unwrap(await apiClient.post("/e3/inventory/purchases", payload)),
  sales: async () => unwrap(await apiClient.get("/e3/inventory/sales")),
  salesReport: async () => unwrap(await apiClient.get("/e3/inventory/reports/sales")),
  createSale: async (payload) => unwrap(await apiClient.post("/e3/inventory/sales", payload))
};
