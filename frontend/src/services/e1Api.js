// Staff | API Request | Provide e1 API calls through the shared HTTP client.
// Workforce | API Request | Provide e1 API calls through the shared HTTP client.
// Staff Announcements | API Request | Provide e1 API calls through the shared HTTP client.
import { apiClient } from "./apiClient.js";

// Staff | API Request | Extract the payload from the shared API success response.
// Workforce | API Request | Extract the payload from the shared API success response.
// Staff Announcements | API Request | Extract the payload from the shared API success response.
const unwrap = ({ data }) => data.data;

export const e1Api = {
  // View Staff | API Request | Send GET /e1/staff and return the response payload.
  listStaff: async () => unwrap(await apiClient.get("/e1/staff")),
  // Add Staff | API Request | Send POST /e1/staff and return the response payload.
  createStaff: async (payload) => unwrap(await apiClient.post("/e1/staff", payload)),
  // Update Staff | API Request | Send PATCH /e1/staff/${id} and return the response payload.
  updateStaff: async (id, payload) => unwrap(await apiClient.patch(`/e1/staff/${id}`, payload)),
  // Deactivate Staff | API Request | Send DELETE /e1/staff/${id} and return the response payload.
  deactivateStaff: async (id) => unwrap(await apiClient.delete(`/e1/staff/${id}`)),

  // View Current Staff Announcements | API Request | Send GET /e1/announcements/current and return the response payload.
  listCurrentAnnouncements: async () => unwrap(await apiClient.get("/e1/announcements/current")),
  // View Staff Announcements | API Request | Send GET /e1/announcements and return the response payload.
  listAnnouncements: async () => unwrap(await apiClient.get("/e1/announcements")),
  // View Announcement Details | API Request | Send GET /e1/announcements/${id} and return the response payload.
  getAnnouncement: async (id) => unwrap(await apiClient.get(`/e1/announcements/${id}`)),
  // Create Staff Announcement | API Request | Send POST /e1/announcements and return the response payload.
  createAnnouncement: async (payload) => unwrap(await apiClient.post("/e1/announcements", payload)),
  // Update Staff Announcement | API Request | Send PATCH /e1/announcements/${id} and return the response payload.
  updateAnnouncement: async (id, payload) => unwrap(await apiClient.patch(`/e1/announcements/${id}`, payload)),
  // Delete Staff Announcement | API Request | Send DELETE /e1/announcements/${id} and return the response payload.
  deleteAnnouncement: async (id) => unwrap(await apiClient.delete(`/e1/announcements/${id}`)),

  // Add Walk-in Patient | API Request | Send POST /e1/staff/patients and return the response payload.
  createQuickPatient: async (payload) => unwrap(await apiClient.post("/e1/staff/patients", payload)),

  // View Staff | API Request | Send GET /e1/workforce/staff and return the response payload.
  listWorkforceStaff: async () => unwrap(await apiClient.get("/e1/workforce/staff")),
  // View Clinic Location | API Request | Send GET /e1/workforce/center-location and return the response payload.
  getCenterLocation: async () => unwrap(await apiClient.get("/e1/workforce/center-location")),
  // Set Clinic Location | API Request | Send PATCH /e1/workforce/center-location and return the response payload.
  saveCenterLocation: async (payload) => unwrap(await apiClient.patch("/e1/workforce/center-location", payload)),
  // View Shifts | API Request | Send GET /e1/workforce/shifts and return the response payload.
  listShifts: async () => unwrap(await apiClient.get("/e1/workforce/shifts")),
  // Create Shift | API Request | Send POST /e1/workforce/shifts and return the response payload.
  createShift: async (payload) => unwrap(await apiClient.post("/e1/workforce/shifts", payload)),
  // Create Bulk Shifts | API Request | Send POST /e1/workforce/shifts/bulk and return the response payload.
  createBulkShifts: async (payload) => unwrap(await apiClient.post("/e1/workforce/shifts/bulk", payload)),
  // Update Shift Status | API Request | Send PATCH /e1/workforce/shifts/${id}/status and return the response payload.
  updateShiftStatus: async (id, status) => unwrap(await apiClient.patch(`/e1/workforce/shifts/${id}/status`, { status })),

  // View Attendance | API Request | Send GET /e1/workforce/attendance and return the response payload.
  listAttendance: async () => unwrap(await apiClient.get("/e1/workforce/attendance")),
  // Attendance Check Out | API Request | Send PATCH /e1/workforce/attendance/${id}/check-out and return the response payload.
  checkOutAttendance: async (id) => unwrap(await apiClient.patch(`/e1/workforce/attendance/${id}/check-out`)),
  // View Leave Requests | API Request | Send GET /e1/workforce/leave and return the response payload.
  listLeave: async () => unwrap(await apiClient.get("/e1/workforce/leave")),
  // Review Leave | API Request | Send PATCH /e1/workforce/leave/${id}/review and return the response payload.
  reviewLeave: async (id, payload) => unwrap(await apiClient.patch(`/e1/workforce/leave/${id}/review`, payload)),

  // View My Shifts | API Request | Send GET /e1/workforce/shifts/my and return the response payload.
  listMyShifts: async () => unwrap(await apiClient.get("/e1/workforce/shifts/my")),
  // View My Attendance | API Request | Send GET /e1/workforce/attendance/my and return the response payload.
  listMyAttendance: async () => unwrap(await apiClient.get("/e1/workforce/attendance/my")),
  // Attendance Check In | API Request | Send POST /e1/workforce/attendance/my/check-in and return the response payload.
  checkIn: async (payload) => unwrap(await apiClient.post("/e1/workforce/attendance/my/check-in", payload)),
  // Attendance Check Out | API Request | Send PATCH /e1/workforce/attendance/my/check-out and return the response payload.
  checkOut: async () => unwrap(await apiClient.patch("/e1/workforce/attendance/my/check-out")),
  // View My Leave | API Request | Send GET /e1/workforce/leave/my and return the response payload.
  listMyLeave: async () => unwrap(await apiClient.get("/e1/workforce/leave/my")),
  // Request Leave | API Request | Send POST /e1/workforce/leave/my and return the response payload.
  requestLeave: async (payload) => unwrap(await apiClient.post("/e1/workforce/leave/my", payload))
};
