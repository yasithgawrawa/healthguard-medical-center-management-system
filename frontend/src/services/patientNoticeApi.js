// Provide patient notice API calls through the shared HTTP client.
import { apiClient } from "./apiClient.js";
const base = "/e2/patient-notices";
// Extract the payload from the shared API success response.
const unwrap = response => response.data.data;
export const patientNoticeApi = {
  // Fetch the signed-in manager's notices from the patient notice endpoint.
  list: async () => unwrap(await apiClient.get(base)),
  // Send GET /e2/patient-notices/patients and return the response payload.
  patients: async search => unwrap(await apiClient.get(`${base}/patients`, { params: { search } })),
  // Create a patient notice using the validated form payload.
  create: async body => unwrap(await apiClient.post(base, body)),
  // Send PATCH /e2/patient-notices/${id} and return the response payload.
  update: async (id, body) => unwrap(await apiClient.patch(`${base}/${id}`, body)),
  // Send DELETE /e2/patient-notices/${id} and return the response payload.
  remove: async id => unwrap(await apiClient.delete(`${base}/${id}`)),
  // Send GET /e2/patient-notices/mine and return the response payload.
  mine: async () => unwrap(await apiClient.get(`${base}/mine`)),
  // Send PATCH /e2/patient-notices/${id}/read and return the response payload.
  markRead: async id => unwrap(await apiClient.patch(`${base}/${id}/read`))
};
