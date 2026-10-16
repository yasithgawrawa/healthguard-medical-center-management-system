// Provide patient API calls through the shared HTTP client.
import { apiClient } from "./apiClient.js";

// Extract the payload from the shared API success response.
const unwrap = (response) => response.data.data;
// Fetch a file as a Blob so the browser can save it.
const download = async (url) => (await apiClient.get(url, { responseType: "blob" })).data;

export const patientApi = {
  // Send GET /e2/clinical/doctors and return the response payload.
  getDoctors: async () => unwrap(await apiClient.get("/e2/clinical/doctors")),
  // Send GET /e2/clinical/appointments/slots and return the response payload.
  getAppointmentSlots: async (params) => unwrap(await apiClient.get("/e2/clinical/appointments/slots", { params })),
  // Send GET /e2/clinical/appointments and return the response payload.
  getAppointments: async () => unwrap(await apiClient.get("/e2/clinical/appointments")),
  // Send POST /e2/clinical/appointments and return the response payload.
  bookAppointment: async (payload) => unwrap(await apiClient.post("/e2/clinical/appointments", payload)),
  // Send PATCH /e2/clinical/appointments/${id}/cancel and return the response payload.
  cancelAppointment: async (id) => unwrap(await apiClient.patch(`/e2/clinical/appointments/${id}/cancel`)),
  // Send PATCH /e2/clinical/appointments/${id}/reschedule and return the response payload.
  rescheduleAppointment: async (id, payload) => unwrap(await apiClient.patch(`/e2/clinical/appointments/${id}/reschedule`, payload)),
  // Send GET /e2/clinical/lab-requests and return the response payload.
  getLabRequests: async () => unwrap(await apiClient.get("/e2/clinical/lab-requests")),
  // Send GET /e2/clinical/notifications and return the response payload.
  getNotifications: async () => unwrap(await apiClient.get("/e2/clinical/notifications")),
  // Send PATCH /e2/clinical/notifications/${id}/read and return the response payload.
  markNotificationRead: async (id) => unwrap(await apiClient.patch(`/e2/clinical/notifications/${id}/read`)),
  // Send GET /e2/clinical/prescriptions and return the response payload.
  getPrescriptions: async () => unwrap(await apiClient.get("/e2/clinical/prescriptions")),
  // Send GET /e4/billing/invoices and return the response payload.
  getInvoices: async () => unwrap(await apiClient.get("/e4/billing/invoices")),
  // Download the selected paid invoice's receipt and save it in the browser.
  downloadReceipt: async (id) => download(`/e4/billing/invoices/${id}/receipt`)
};
