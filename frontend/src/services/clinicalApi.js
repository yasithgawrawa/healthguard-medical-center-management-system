// Provide clinical API calls through the shared HTTP client.
import { apiClient } from "./apiClient.js";

// Extract the payload from the shared API success response.
const unwrap = ({ data }) => data.data;

export const clinicalApi = {
  // Send GET /e2/clinical/appointments and return the response payload.
  listAppointments: async () => unwrap(await apiClient.get("/e2/clinical/appointments")),
  // Send GET /e2/clinical/appointments/slots and return the response payload.
  getAppointmentSlots: async (params) => unwrap(await apiClient.get("/e2/clinical/appointments/slots", { params })),
  // Send POST /e2/clinical/appointments and return the response payload.
  createAppointment: async (payload) => unwrap(await apiClient.post("/e2/clinical/appointments", payload)),
  // Send PATCH /e2/clinical/appointments/${id}/cancel and return the response payload.
  cancelAppointment: async (id) => unwrap(await apiClient.patch(`/e2/clinical/appointments/${id}/cancel`)),
  // Send PATCH /e2/clinical/appointments/${id}/reschedule and return the response payload.
  rescheduleAppointment: async (id, payload) => unwrap(await apiClient.patch(`/e2/clinical/appointments/${id}/reschedule`, payload)),
  // Send PATCH /e2/clinical/appointments/${id}/status and return the response payload.
  updateAppointmentStatus: async (id, status) => unwrap(await apiClient.patch(`/e2/clinical/appointments/${id}/status`, { status })),
  // Send POST /e2/clinical/vitals and return the response payload.
  recordVitals: async (payload) => unwrap(await apiClient.post("/e2/clinical/vitals", payload)),
  // Send POST /e2/clinical/consultations and return the response payload.
  saveConsultation: async (payload) => unwrap(await apiClient.post("/e2/clinical/consultations", payload)),
  // Send POST /e2/clinical/prescriptions and return the response payload.
  createPrescription: async (payload) => unwrap(await apiClient.post("/e2/clinical/prescriptions", payload)),
  // Send GET /e2/clinical/prescriptions and return the response payload.
  listPrescriptions: async () => unwrap(await apiClient.get("/e2/clinical/prescriptions")),
  // Send POST /e2/clinical/lab-requests and return the response payload.
  createLabRequest: async (payload) => unwrap(await apiClient.post("/e2/clinical/lab-requests", payload)),
  // Send GET /e2/clinical/lab-requests and return the response payload.
  listLabRequests: async () => unwrap(await apiClient.get("/e2/clinical/lab-requests")),
  // Send PATCH /e2/clinical/lab-requests/${id} and return the response payload.
  updateLabRequest: async (id, payload) => unwrap(await apiClient.patch(`/e2/clinical/lab-requests/${id}`, payload)),
  // Send GET /e2/clinical/lab-tests and return the response payload.
  listLabTests: async () => unwrap(await apiClient.get("/e2/clinical/lab-tests")),
  // Send POST /e2/clinical/lab-tests and return the response payload.
  createLabTest: async (payload) => unwrap(await apiClient.post("/e2/clinical/lab-tests", payload)),
  // Send PATCH /e2/clinical/lab-tests/${id} and return the response payload.
  updateLabTestPrice: async (id, payload) => unwrap(await apiClient.patch(`/e2/clinical/lab-tests/${id}`, payload)),
  // Send GET /e2/clinical/doctors and return the response payload.
  listDoctors: async () => unwrap(await apiClient.get("/e2/clinical/doctors")),
  // Send PATCH /e2/clinical/doctors/fee and return the response payload.
  updateDoctorFee: async (payload) => unwrap(await apiClient.patch("/e2/clinical/doctors/fee", payload))
};
