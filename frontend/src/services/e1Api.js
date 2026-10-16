// Provide e1 API calls through the shared HTTP client.
import { apiClient } from "./apiClient.js";

// Extract the payload from the shared API success response.
const unwrap = ({ data }) => data.data;

export const e1Api = {
  // Send GET /e1/staff and return the response payload.
  listStaff: async () => unwrap(await apiClient.get("/e1/staff")),
  // Send POST /e1/staff and return the response payload.
  createStaff: async (payload) => unwrap(await apiClient.post("/e1/staff", payload)),
  // Send PATCH /e1/staff/${id} and return the response payload.
  updateStaff: async (id, payload) => unwrap(await apiClient.patch(`/e1/staff/${id}`, payload)),
  // Send DELETE /e1/staff/${id} and return the response payload.
  deactivateStaff: async (id) => unwrap(await apiClient.delete(`/e1/staff/${id}`)),

  // Send GET /e1/announcements/current and return the response payload.
  listCurrentAnnouncements: async () => unwrap(await apiClient.get("/e1/announcements/current")),
  // Send GET /e1/announcements and return the response payload.
  listAnnouncements: async () => unwrap(await apiClient.get("/e1/announcements")),
  // Send GET /e1/announcements/${id} and return the response payload.
  getAnnouncement: async (id) => unwrap(await apiClient.get(`/e1/announcements/${id}`)),
  // Send POST /e1/announcements and return the response payload.
  createAnnouncement: async (payload) => unwrap(await apiClient.post("/e1/announcements", payload)),
  // Send PATCH /e1/announcements/${id} and return the response payload.
  updateAnnouncement: async (id, payload) => unwrap(await apiClient.patch(`/e1/announcements/${id}`, payload)),
  // Send DELETE /e1/announcements/${id} and return the response payload.
  deleteAnnouncement: async (id) => unwrap(await apiClient.delete(`/e1/announcements/${id}`)),

  // Send POST /e1/staff/patients and return the response payload.
  createQuickPatient: async (payload) => unwrap(await apiClient.post("/e1/staff/patients", payload)),

  // Send GET /e1/workforce/staff and return the response payload.
  listWorkforceStaff: async () => unwrap(await apiClient.get("/e1/workforce/staff")),
  // Send GET /e1/workforce/center-location and return the response payload.
  getCenterLocation: async () => unwrap(await apiClient.get("/e1/workforce/center-location")),
  // Send PATCH /e1/workforce/center-location and return the response payload.
  saveCenterLocation: async (payload) => unwrap(await apiClient.patch("/e1/workforce/center-location", payload)),
  // Send GET /e1/workforce/shifts and return the response payload.
  listShifts: async () => unwrap(await apiClient.get("/e1/workforce/shifts")),
  // Send POST /e1/workforce/shifts and return the response payload.
  createShift: async (payload) => unwrap(await apiClient.post("/e1/workforce/shifts", payload)),
  // Send POST /e1/workforce/shifts/bulk and return the response payload.
  createBulkShifts: async (payload) => unwrap(await apiClient.post("/e1/workforce/shifts/bulk", payload)),
  // Send PATCH /e1/workforce/shifts/${id}/status and return the response payload.
  updateShiftStatus: async (id, status) => unwrap(await apiClient.patch(`/e1/workforce/shifts/${id}/status`, { status })),

  // Send GET /e1/workforce/attendance and return the response payload.
  listAttendance: async () => unwrap(await apiClient.get("/e1/workforce/attendance")),
  // Send PATCH /e1/workforce/attendance/${id}/check-out and return the response payload.
  checkOutAttendance: async (id) => unwrap(await apiClient.patch(`/e1/workforce/attendance/${id}/check-out`)),
  // Send GET /e1/workforce/leave and return the response payload.
  listLeave: async () => unwrap(await apiClient.get("/e1/workforce/leave")),
  // Send PATCH /e1/workforce/leave/${id}/review and return the response payload.
  reviewLeave: async (id, payload) => unwrap(await apiClient.patch(`/e1/workforce/leave/${id}/review`, payload)),

  // Send GET /e1/workforce/shifts/my and return the response payload.
  listMyShifts: async () => unwrap(await apiClient.get("/e1/workforce/shifts/my")),
  // Send GET /e1/workforce/attendance/my and return the response payload.
  listMyAttendance: async () => unwrap(await apiClient.get("/e1/workforce/attendance/my")),
  // Send POST /e1/workforce/attendance/my/check-in and return the response payload.
  checkIn: async (payload) => unwrap(await apiClient.post("/e1/workforce/attendance/my/check-in", payload)),
  // Send PATCH /e1/workforce/attendance/my/check-out and return the response payload.
  checkOut: async () => unwrap(await apiClient.patch("/e1/workforce/attendance/my/check-out")),
  // Send GET /e1/workforce/leave/my and return the response payload.
  listMyLeave: async () => unwrap(await apiClient.get("/e1/workforce/leave/my")),
  // Send POST /e1/workforce/leave/my and return the response payload.
  requestLeave: async (payload) => unwrap(await apiClient.post("/e1/workforce/leave/my", payload))
};
