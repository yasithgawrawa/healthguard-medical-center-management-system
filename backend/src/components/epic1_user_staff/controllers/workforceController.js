import { Attendance } from "../models/Attendance.js";
import { LeaveRequest } from "../models/LeaveRequest.js";
import { Shift } from "../models/Shift.js";
import { Staff } from "../models/Staff.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";
import { AppError } from "../../../shared/utils/AppError.js";

const assertActiveStaff = async (staffId) => {
  const staff = await Staff.findById(staffId);
  if (!staff || staff.status !== "active") throw new AppError("Active staff member not found", 404);
  return staff;
};

export const createShift = async (req, res) => {
  await assertActiveStaff(req.body.staffId);
  const overlap = await Shift.findOne({
    staffId: req.body.staffId,
    status: "scheduled",
    startTime: { $lt: req.body.endTime },
    endTime: { $gt: req.body.startTime }
  });
  if (overlap) throw new AppError("Shift overlaps an existing scheduled shift", 409, { startTime: "Overlapping shift" });

  const shift = await Shift.create(req.body);
  return successResponse(res, "Shift created successfully", shift, 201);
};

export const listShifts = async (req, res) => {
  const shifts = await Shift.find().populate("staffId").sort({ startTime: -1 });
  return successResponse(res, "Shift list loaded", shifts);
};

export const updateShiftStatus = async (req, res) => {
  const shift = await Shift.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!shift) throw new AppError("Shift not found", 404);
  return successResponse(res, "Shift status updated", shift);
};

export const checkIn = async (req, res) => {
  await assertActiveStaff(req.body.staffId);
  const now = new Date();
  const workDate = now.toISOString().slice(0, 10);
  const attendance = await Attendance.create({
    staffId: req.body.staffId,
    workDate,
    checkInAt: now,
    notes: req.body.notes
  });
  return successResponse(res, "Attendance check-in recorded", attendance, 201);
};

export const checkOut = async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) throw new AppError("Attendance record not found", 404);
  if (attendance.checkOutAt) throw new AppError("Attendance already checked out", 409);
  attendance.checkOutAt = new Date();
  attendance.status = "checked_out";
  await attendance.save();
  return successResponse(res, "Attendance check-out recorded", attendance);
};

export const listAttendance = async (req, res) => {
  const attendance = await Attendance.find().populate("staffId").sort({ workDate: -1 });
  return successResponse(res, "Attendance list loaded", attendance);
};

export const createLeave = async (req, res) => {
  await assertActiveStaff(req.body.staffId);
  const leave = await LeaveRequest.create(req.body);
  return successResponse(res, "Leave request created successfully", leave, 201);
};

export const listLeave = async (req, res) => {
  const leaveRequests = await LeaveRequest.find().populate("staffId").sort({ createdAt: -1 });
  return successResponse(res, "Leave request list loaded", leaveRequests);
};

export const reviewLeave = async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) throw new AppError("Leave request not found", 404);
  if (leave.status !== "pending") throw new AppError("Only pending leave requests can be reviewed", 409);
  leave.status = req.body.status;
  leave.reviewNote = req.body.reviewNote;
  leave.reviewedBy = req.user._id;
  await leave.save();
  return successResponse(res, "Leave request reviewed", leave);
};
