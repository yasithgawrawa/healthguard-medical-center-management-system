// Patient Records | API Request | Provide patient API calls through the shared HTTP client.
import { apiClient } from "./apiClient.js";

// Patient Records | API Request | Extract the payload from the shared API success response.
const unwrap = (response) => response.data.data;
// Patient Records | API Request | Fetch a file as a Blob so the browser can save it.
const download = async (url) => (await apiClient.get(url, { responseType: "blob" })).data;

export const patientApi = {
  // View Doctors | API Request | Send GET /e2/clinical/doctors and return the response payload.
  getDoctors: async () => unwrap(await apiClient.get("/e2/clinical/doctors")),
  // View Appointment Slots | API Request | Send GET /e2/clinical/appointments/slots and return the response payload.
  getAppointmentSlots: async (params) => unwrap(await apiClient.get("/e2/clinical/appointments/slots", { params })),
  // View Appointments | API Request | Send GET /e2/clinical/appointments and return the response payload.
  getAppointments: async () => unwrap(await apiClient.get("/e2/clinical/appointments")),
  // Book Appointment | API Request | Send POST /e2/clinical/appointments and return the response payload.
  bookAppointment: async (payload) => unwrap(await apiClient.post("/e2/clinical/appointments", payload)),
  // Cancel Appointment | API Request | Send PATCH /e2/clinical/appointments/${id}/cancel and return the response payload.
  cancelAppointment: async (id) => unwrap(await apiClient.patch(`/e2/clinical/appointments/${id}/cancel`)),
  // Reschedule Appointment | API Request | Send PATCH /e2/clinical/appointments/${id}/reschedule and return the response payload.
  rescheduleAppointment: async (id, payload) => unwrap(await apiClient.patch(`/e2/clinical/appointments/${id}/reschedule`, payload)),
  // View Lab Requests | API Request | Send GET /e2/clinical/lab-requests and return the response payload.
  getLabRequests: async () => unwrap(await apiClient.get("/e2/clinical/lab-requests")),
  // View Patient Notifications | API Request | Send GET /e2/clinical/notifications and return the response payload.
  getNotifications: async () => unwrap(await apiClient.get("/e2/clinical/notifications")),
  // Mark Notification Read | API Request | Send PATCH /e2/clinical/notifications/${id}/read and return the response payload.
  markNotificationRead: async (id) => unwrap(await apiClient.patch(`/e2/clinical/notifications/${id}/read`)),
  // View Prescriptions | API Request | Send GET /e2/clinical/prescriptions and return the response payload.
  getPrescriptions: async () => unwrap(await apiClient.get("/e2/clinical/prescriptions")),
  // View Invoices | API Request | Send GET /e4/billing/invoices and return the response payload.
  getInvoices: async () => unwrap(await apiClient.get("/e4/billing/invoices")),
  // Download Invoice Receipt | API Request | Download the selected paid invoice's receipt and save it in the browser.
  downloadReceipt: async (id) => download(`/e4/billing/invoices/${id}/receipt`)
};
