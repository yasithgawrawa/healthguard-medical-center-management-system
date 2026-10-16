// Inventory Workspace | API Request | Provide inventory API calls through the shared HTTP client.
import { apiClient } from "./apiClient.js";

// Inventory Workspace | API Request | Extract the payload from the shared API success response.
const unwrap = ({ data }) => data.data;
// Inventory Workspace | API Request | Fetch a file as a Blob so the browser can save it.
const download = async (url) => (await apiClient.get(url, { responseType: "blob" })).data;

export const inventoryApi = {
  // Alerts & Reports
  // View Inventory Alerts | API Request | Send GET /e3/inventory/alerts and return the response payload.
  alerts: async () => unwrap(await apiClient.get("/e3/inventory/alerts")),
  // View Pharmacy Sales Report | API Request | Send GET /e3/inventory/reports/sales and return the response payload.
  salesReport: async (period = "all") => unwrap(await apiClient.get("/e3/inventory/reports/sales", { params: { period } })),

  // Medicines
  // View Medicines | API Request | Send GET /e3/inventory/medicines and return the response payload.
  medicines: async (params) => unwrap(await apiClient.get("/e3/inventory/medicines", { params })),
  // Add New Medicine | API Request | Send POST /e3/inventory/medicines and return the response payload.
  createMedicine: async (payload) => unwrap(await apiClient.post("/e3/inventory/medicines", payload)),
  // Update Medicine | API Request | Send PATCH /e3/inventory/medicines/${id} and return the response payload.
  updateMedicine: async (id, payload) => unwrap(await apiClient.patch(`/e3/inventory/medicines/${id}`, payload)),
  // Delete Medicine | API Request | Send DELETE /e3/inventory/medicines/${id} and return the response payload.
  deleteMedicine: async (id) => unwrap(await apiClient.delete(`/e3/inventory/medicines/${id}`)),

  // Batches
  // View Medicine Batches | API Request | Send GET /e3/inventory/batches and return the response payload.
  batches: async () => unwrap(await apiClient.get("/e3/inventory/batches")),
  // Add Medicine Batch | API Request | Send POST /e3/inventory/batches and return the response payload.
  createBatch: async (payload) => unwrap(await apiClient.post("/e3/inventory/batches", payload)),
  // Update Medicine Batch | API Request | Send PATCH /e3/inventory/batches/${id} and return the response payload.
  updateBatch: async (id, payload) => unwrap(await apiClient.patch(`/e3/inventory/batches/${id}`, payload)),

  // Suppliers
  // View Suppliers | API Request | Send GET /e3/inventory/suppliers and return the response payload.
  suppliers: async () => unwrap(await apiClient.get("/e3/inventory/suppliers")),
  // Add Supplier | API Request | Send POST /e3/inventory/suppliers and return the response payload.
  createSupplier: async (payload) => unwrap(await apiClient.post("/e3/inventory/suppliers", payload)),
  // Update Supplier | API Request | Send PATCH /e3/inventory/suppliers/${id} and return the response payload.
  updateSupplier: async (id, payload) => unwrap(await apiClient.patch(`/e3/inventory/suppliers/${id}`, payload)),
  // Deactivate Supplier | API Request | Send DELETE /e3/inventory/suppliers/${id} and return the response payload.
  deleteSupplier: async (id) => unwrap(await apiClient.delete(`/e3/inventory/suppliers/${id}`)),

  // Purchases
  // View Medicine Purchases | API Request | Send GET /e3/inventory/purchases and return the response payload.
  purchases: async () => unwrap(await apiClient.get("/e3/inventory/purchases")),
  // Record Medicine Purchase | API Request | Send POST /e3/inventory/purchases and return the response payload.
  createPurchase: async (payload) => unwrap(await apiClient.post("/e3/inventory/purchases", payload)),

  // Medicine Returns
  // View Medicine Returns | API Request | Send GET /e3/inventory/returns and return the response payload.
  returns: async () => unwrap(await apiClient.get("/e3/inventory/returns")),
  // View Medicine Return Details | API Request | Send GET /e3/inventory/returns/${id} and return the response payload.
  getReturnDetails: async (id) => unwrap(await apiClient.get(`/e3/inventory/returns/${id}`)),
  // Create Medicine Return Draft | API Request | Send POST /e3/inventory/returns and return the response payload.
  createReturn: async (payload) => unwrap(await apiClient.post("/e3/inventory/returns", payload)),
  // Update Medicine Return Draft | API Request | Send PATCH /e3/inventory/returns/${id} and return the response payload.
  updateReturn: async (id, payload) => unwrap(await apiClient.patch(`/e3/inventory/returns/${id}`, payload)),
  // Delete Medicine Return Draft | API Request | Send DELETE /e3/inventory/returns/${id} and return the response payload.
  deleteReturn: async (id) => unwrap(await apiClient.delete(`/e3/inventory/returns/${id}`)),
  // Complete Medicine Return | API Request | Send PATCH /e3/inventory/returns/${id}/complete and return the response payload.
  completeReturn: async (id) => unwrap(await apiClient.patch(`/e3/inventory/returns/${id}/complete`)),

  // Sales / POS
  // View Pharmacy Sales | API Request | Send GET /e3/inventory/sales and return the response payload.
  sales: async () => unwrap(await apiClient.get("/e3/inventory/sales")),
  // Record Pharmacy Sale | API Request | Send POST /e3/inventory/sales and return the response payload.
  createSale: async (payload) => unwrap(await apiClient.post("/e3/inventory/sales", payload)),
  // View Pharmacy Sale Details | API Request | Send GET /e3/inventory/sales/${id} and return the response payload.
  getSaleDetails: async (id) => unwrap(await apiClient.get(`/e3/inventory/sales/${id}`)),
  // Download Pharmacy Bill | API Request | Fetch the selected sale's text bill as a downloadable Blob.
  downloadSaleBill: async (id) => download(`/e3/inventory/sales/${id}/bill`),

  // Pharmacy helpers
  // View Pharmacy Patients | API Request | Send GET /e3/inventory/patients and return the response payload.
  patients: async () => unwrap(await apiClient.get("/e3/inventory/patients")),
  // View Active Prescriptions | API Request | Send GET /e3/inventory/prescriptions and return the response payload.
  prescriptions: async () => unwrap(await apiClient.get("/e3/inventory/prescriptions"))
};
