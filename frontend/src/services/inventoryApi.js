import { apiClient } from "./apiClient.js";

const unwrap = ({ data }) => data.data;

export const inventoryApi = {
  alerts: async () => unwrap(await apiClient.get("/e3/inventory/alerts")),
  medicines: async () => unwrap(await apiClient.get("/e3/inventory/medicines")),
  createMedicine: async (payload) => unwrap(await apiClient.post("/e3/inventory/medicines", payload)),
  suppliers: async () => unwrap(await apiClient.get("/e3/inventory/suppliers")),
  createSupplier: async (payload) => unwrap(await apiClient.post("/e3/inventory/suppliers", payload)),
  batches: async () => unwrap(await apiClient.get("/e3/inventory/batches")),
  createBatch: async (payload) => unwrap(await apiClient.post("/e3/inventory/batches", payload)),
  sales: async () => unwrap(await apiClient.get("/e3/inventory/sales")),
  createSale: async (payload) => unwrap(await apiClient.post("/e3/inventory/sales", payload))
};
