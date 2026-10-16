import { apiClient } from "./apiClient.js";
const base = "/e2/patient-notices";
const unwrap = response => response.data.data;
export const patientNoticeApi = {
  list: async () => unwrap(await apiClient.get(base)),
  patients: async search => unwrap(await apiClient.get(`${base}/patients`, { params: { search } })),
  create: async body => unwrap(await apiClient.post(base, body)),
  update: async (id, body) => unwrap(await apiClient.patch(`${base}/${id}`, body)),
  remove: async id => unwrap(await apiClient.delete(`${base}/${id}`)),
  mine: async () => unwrap(await apiClient.get(`${base}/mine`)),
  markRead: async id => unwrap(await apiClient.patch(`${base}/${id}/read`))
};
