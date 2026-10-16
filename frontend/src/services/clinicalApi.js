// Clinical Workspace | API Request | Provide clinical API calls through the shared HTTP client.
import { apiClient } from "./apiClient.js";

// Clinical Workspace | API Request | Extract the payload from the shared API success response.
const unwrap = ({ data }) => data.data;

export const clinicalApi = {
  // View Appointments | API Request | Send GET /e2/clinical/appointments and return the response payload.
  listAppointments: async () => unwrap(await apiClient.get("/e2/clinical/appointments")),
  // View Appointment Slots | API Request | Send GET /e2/clinical/appointments/slots and return the response payload.
  getAppointmentSlots: async (params) => unwrap(await apiClient.get("/e2/clinical/appointments/slots", { params })),
  // Book Appointment | API Request | Send POST /e2/clinical/appointments and return the response payload.
  createAppointment: async (payload) => unwrap(await apiClient.post("/e2/clinical/appointments", payload)),
  // Cancel Appointment | API Request | Send PATCH /e2/clinical/appointments/${id}/cancel and return the response payload.
  cancelAppointment: async (id) => unwrap(await apiClient.patch(`/e2/clinical/appointments/${id}/cancel`)),
  // Reschedule Appointment | API Request | Send PATCH /e2/clinical/appointments/${id}/reschedule and return the response payload.
  rescheduleAppointment: async (id, payload) => unwrap(await apiClient.patch(`/e2/clinical/appointments/${id}/reschedule`, payload)),
  // Update Appointment Status | API Request | Send PATCH /e2/clinical/appointments/${id}/status and return the response payload.
  updateAppointmentStatus: async (id, status) => unwrap(await apiClient.patch(`/e2/clinical/appointments/${id}/status`, { status })),
  // Record Vitals | API Request | Send POST /e2/clinical/vitals and return the response payload.
  recordVitals: async (payload) => unwrap(await apiClient.post("/e2/clinical/vitals", payload)),
  // Save Consultation | API Request | Send POST /e2/clinical/consultations and return the response payload.
  saveConsultation: async (payload) => unwrap(await apiClient.post("/e2/clinical/consultations", payload)),
  // Create Prescription | API Request | Send POST /e2/clinical/prescriptions and return the response payload.
  createPrescription: async (payload) => unwrap(await apiClient.post("/e2/clinical/prescriptions", payload)),
  // View Prescriptions | API Request | Send GET /e2/clinical/prescriptions and return the response payload.
  listPrescriptions: async () => unwrap(await apiClient.get("/e2/clinical/prescriptions")),
  // Create Lab Request | API Request | Send POST /e2/clinical/lab-requests and return the response payload.
  createLabRequest: async (payload) => unwrap(await apiClient.post("/e2/clinical/lab-requests", payload)),
  // View Lab Requests | API Request | Send GET /e2/clinical/lab-requests and return the response payload.
  listLabRequests: async () => unwrap(await apiClient.get("/e2/clinical/lab-requests")),
  // Update Lab Report | API Request | Send PATCH /e2/clinical/lab-requests/${id} and return the response payload.
  updateLabRequest: async (id, payload) => unwrap(await apiClient.patch(`/e2/clinical/lab-requests/${id}`, payload)),
  // View Lab Tests | API Request | Send GET /e2/clinical/lab-tests and return the response payload.
  listLabTests: async () => unwrap(await apiClient.get("/e2/clinical/lab-tests")),
  // Add Lab Test | API Request | Send POST /e2/clinical/lab-tests and return the response payload.
  createLabTest: async (payload) => unwrap(await apiClient.post("/e2/clinical/lab-tests", payload)),
  // Update Lab Test Price | API Request | Send PATCH /e2/clinical/lab-tests/${id} and return the response payload.
  updateLabTestPrice: async (id, payload) => unwrap(await apiClient.patch(`/e2/clinical/lab-tests/${id}`, payload)),
  // View Doctors | API Request | Send GET /e2/clinical/doctors and return the response payload.
  listDoctors: async () => unwrap(await apiClient.get("/e2/clinical/doctors")),
  // Update Doctor Fee | API Request | Send PATCH /e2/clinical/doctors/fee and return the response payload.
  updateDoctorFee: async (payload) => unwrap(await apiClient.patch("/e2/clinical/doctors/fee", payload))
};
