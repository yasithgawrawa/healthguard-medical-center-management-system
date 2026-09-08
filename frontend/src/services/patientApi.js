import { apiClient } from "./apiClient.js";

const unwrap = (response) => response.data.data;
const download = async (url) => (await apiClient.get(url, { responseType: "blob" })).data;

export const patientApi = {
  getDoctors: async () => unwrap(await apiClient.get("/e2/clinical/doctors")),
  getAppointmentSlots: async (params) => unwrap(await apiClient.get("/e2/clinical/appointments/slots", { params })),
  getAppointments: async () => unwrap(await apiClient.get("/e2/clinical/appointments")),
  bookAppointment: async (payload) => unwrap(await apiClient.post("/e2/clinical/appointments", payload)),
  cancelAppointment: async (id) => unwrap(await apiClient.patch(`/e2/clinical/appointments/${id}/cancel`)),
  getLabRequests: async () => unwrap(await apiClient.get("/e2/clinical/lab-requests")),
  getNotifications: async () => unwrap(await apiClient.get("/e2/clinical/notifications")),
  markNotificationRead: async (id) => unwrap(await apiClient.patch(`/e2/clinical/notifications/${id}/read`)),
  getPrescriptions: async () => unwrap(await apiClient.get("/e2/clinical/prescriptions")),
  getInvoices: async () => unwrap(await apiClient.get("/e4/billing/invoices")),
  downloadReceipt: async (id) => download(`/e4/billing/invoices/${id}/receipt`)
};
