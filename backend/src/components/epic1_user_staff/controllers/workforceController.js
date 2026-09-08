import { Attendance } from "../models/Attendance.js";
import { CenterLocation } from "../models/CenterLocation.js";
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

const getCurrentActiveStaff = async (userId) => {
  const staff = await Staff.findOne({ userId });
  if (!staff || staff.status !== "active") throw new AppError("Active staff profile not found for current user", 404);
  return staff;
};

const toRadians = (value) => (value * Math.PI) / 180;

const distanceInMeters = (from, to) => {
  const earthRadiusMeters = 6371000;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(lonDelta / 2) *
      Math.sin(lonDelta / 2);
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const dayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getConfiguredCenterLocation = async () => {
  const center = await CenterLocation.findOne({ key: "primary" });
  if (!center) {
    throw new AppError("Center check-in location is not configured", 403, {
      location: "Ask an admin to set the Health Guard center location first."
    });
  }
  return center;
};

const findEligibleShift = async (staffId, now) => {
  const currentShift = await Shift.findOne({
    staffId,
    status: "scheduled",
    startTime: { $lte: now },
    endTime: { $gte: now }
  }).sort({ startTime: 1 });

  if (currentShift) {
    return currentShift;
  }

  const { start, end } = dayRange(now);
  const todayShift = await Shift.findOne({
    staffId,
    status: "scheduled",
    startTime: { $gte: start, $lte: end }
  }).sort({ startTime: 1 });

  if (!todayShift) {
    throw new AppError("No shift is scheduled for you today", 403, {
      shift: "Ask a manager or admin to create today's shift first."
    });
  }

  return todayShift;
};

export const getCenterLocation = async (req, res) => {
  const center = await CenterLocation.findOne({ key: "primary" });
  return successResponse(res, "Center location loaded", center);
};

export const updateCenterLocation = async (req, res) => {
  const center = await CenterLocation.findOneAndUpdate(
    { key: "primary" },
    { ...req.body, key: "primary", updatedBy: req.user._id },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return successResponse(res, "Center check-in location saved", center);
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

export const listWorkforceStaff = async (req, res) => {
  const staff = await Staff.find({ status: "active" }).populate("userId", "-passwordHash").sort({ employeeId: 1 });
  return successResponse(res, "Workforce staff loaded", staff);
};

export const listShifts = async (req, res) => {
  const shifts = await Shift.find().populate("staffId").sort({ startTime: -1 });
  return successResponse(res, "Shift list loaded", shifts);
};

export const listMyShifts = async (req, res) => {
  const staff = await getCurrentActiveStaff(req.user._id);
  const shifts = await Shift.find({ staffId: staff._id }).populate("staffId").sort({ startTime: -1 });
  return successResponse(res, "My shift schedule loaded", shifts);
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

export const checkInSelf = async (req, res) => {
  const staff = await getCurrentActiveStaff(req.user._id);
  const now = new Date();
  const { latitude, longitude, accuracyMeters } = req.body;

  if (latitude === undefined || longitude === undefined) {
    throw new AppError("Current location is required for staff check-in", 400, {
      location: "Allow browser location access and try again"
    });
  }

  const shift = await findEligibleShift(staff._id, now);
  const center = await getConfiguredCenterLocation();
  const distance = distanceInMeters(
    { latitude, longitude },
    { latitude: center.latitude, longitude: center.longitude }
  );
  const allowedDistance = center.radiusMeters + Math.min(Number(accuracyMeters || 0), 50);

  if (distance > allowedDistance) {
    throw new AppError(`Check-in allowed only at ${center.name}`, 403, {
      location: `You are ${Math.round(distance)}m away. Allowed radius is ${center.radiusMeters}m.`
    });
  }

  const workDate = now.toISOString().slice(0, 10);
  const attendance = await Attendance.create({
    staffId: staff._id,
    workDate,
    checkInAt: now,
    shiftId: shift._id,
    checkInLocation: {
      latitude,
      longitude,
      accuracyMeters,
      distanceFromShiftMeters: Math.round(distance)
    },
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

export const checkOutSelf = async (req, res) => {
  const staff = await getCurrentActiveStaff(req.user._id);
  const attendance = await Attendance.findOne({ staffId: staff._id, status: "checked_in" }).sort({ checkInAt: -1 });
  if (!attendance) throw new AppError("No open attendance record found", 404);
  attendance.checkOutAt = new Date();
  attendance.status = "checked_out";
  await attendance.save();
  return successResponse(res, "Attendance check-out recorded", attendance);
};

export const listAttendance = async (req, res) => {
  const attendance = await Attendance.find().populate("staffId").sort({ workDate: -1 });
  return successResponse(res, "Attendance list loaded", attendance);
};

export const listMyAttendance = async (req, res) => {
  const staff = await getCurrentActiveStaff(req.user._id);
  const attendance = await Attendance.find({ staffId: staff._id }).populate("staffId").sort({ workDate: -1 });
  return successResponse(res, "My attendance history loaded", attendance);
};

export const createLeave = async (req, res) => {
  await assertActiveStaff(req.body.staffId);
  const leave = await LeaveRequest.create(req.body);
  return successResponse(res, "Leave request created successfully", leave, 201);
};

export const createMyLeave = async (req, res) => {
  const staff = await getCurrentActiveStaff(req.user._id);
  const leave = await LeaveRequest.create({ ...req.body, staffId: staff._id });
  return successResponse(res, "Leave request created successfully", leave, 201);
};

export const listLeave = async (req, res) => {
  const leaveRequests = await LeaveRequest.find().populate("staffId").sort({ createdAt: -1 });
  return successResponse(res, "Leave request list loaded", leaveRequests);
};

export const listMyLeave = async (req, res) => {
  const staff = await getCurrentActiveStaff(req.user._id);
  const leaveRequests = await LeaveRequest.find({ staffId: staff._id }).populate("staffId").sort({ createdAt: -1 });
  return successResponse(res, "My leave requests loaded", leaveRequests);
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
