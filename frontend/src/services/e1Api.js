import { apiClient } from "./apiClient.js";

const unwrap = ({ data }) => data.data;

export const e1Api = {
  listStaff: async () => unwrap(await apiClient.get("/e1/staff")),
  createStaff: async (payload) => unwrap(await apiClient.post("/e1/staff", payload)),
  updateStaff: async (id, payload) => unwrap(await apiClient.patch(`/e1/staff/${id}`, payload)),
  deactivateStaff: async (id) => unwrap(await apiClient.delete(`/e1/staff/${id}`)),

  listWorkforceStaff: async () => unwrap(await apiClient.get("/e1/workforce/staff")),
  getCenterLocation: async () => unwrap(await apiClient.get("/e1/workforce/center-location")),
  saveCenterLocation: async (payload) => unwrap(await apiClient.patch("/e1/workforce/center-location", payload)),
  listShifts: async () => unwrap(await apiClient.get("/e1/workforce/shifts")),
  createShift: async (payload) => unwrap(await apiClient.post("/e1/workforce/shifts", payload)),
  updateShiftStatus: async (id, status) => unwrap(await apiClient.patch(`/e1/workforce/shifts/${id}/status`, { status })),

  listAttendance: async () => unwrap(await apiClient.get("/e1/workforce/attendance")),
  listLeave: async () => unwrap(await apiClient.get("/e1/workforce/leave")),
  reviewLeave: async (id, payload) => unwrap(await apiClient.patch(`/e1/workforce/leave/${id}/review`, payload)),

  listMyShifts: async () => unwrap(await apiClient.get("/e1/workforce/shifts/my")),
  listMyAttendance: async () => unwrap(await apiClient.get("/e1/workforce/attendance/my")),
  checkIn: async (payload) => unwrap(await apiClient.post("/e1/workforce/attendance/my/check-in", payload)),
  checkOut: async () => unwrap(await apiClient.patch("/e1/workforce/attendance/my/check-out")),
  listMyLeave: async () => unwrap(await apiClient.get("/e1/workforce/leave/my")),
  requestLeave: async (payload) => unwrap(await apiClient.post("/e1/workforce/leave/my", payload))
};
