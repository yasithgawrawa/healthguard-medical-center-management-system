import { apiClient } from "./apiClient.js";

const unwrap = ({ data }) => data.data;

export const clinicalApi = {
  listAppointments: async () => unwrap(await apiClient.get("/e2/clinical/appointments")),
  updateAppointmentStatus: async (id, status) => unwrap(await apiClient.patch(`/e2/clinical/appointments/${id}/status`, { status })),
  recordVitals: async (payload) => unwrap(await apiClient.post("/e2/clinical/vitals", payload)),
  saveConsultation: async (payload) => unwrap(await apiClient.post("/e2/clinical/consultations", payload)),
  createPrescription: async (payload) => unwrap(await apiClient.post("/e2/clinical/prescriptions", payload)),
  listPrescriptions: async () => unwrap(await apiClient.get("/e2/clinical/prescriptions")),
  createLabRequest: async (payload) => unwrap(await apiClient.post("/e2/clinical/lab-requests", payload)),
  listLabRequests: async () => unwrap(await apiClient.get("/e2/clinical/lab-requests")),
  updateLabRequest: async (id, payload) => unwrap(await apiClient.patch(`/e2/clinical/lab-requests/${id}`, payload)),
  listLabTests: async () => unwrap(await apiClient.get("/e2/clinical/lab-tests")),
  createLabTest: async (payload) => unwrap(await apiClient.post("/e2/clinical/lab-tests", payload)),
  updateLabTestPrice: async (id, payload) => unwrap(await apiClient.patch(`/e2/clinical/lab-tests/${id}`, payload)),
  listDoctors: async () => unwrap(await apiClient.get("/e2/clinical/doctors")),
  updateDoctorFee: async (payload) => unwrap(await apiClient.patch("/e2/clinical/doctors/fee", payload))
};
