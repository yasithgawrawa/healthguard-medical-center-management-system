import { Attendance } from "../models/Attendance.js";
import { CenterLocation } from "../models/CenterLocation.js";
import { LeaveRequest } from "../models/LeaveRequest.js";
import { Shift } from "../models/Shift.js";
import { Staff } from "../models/Staff.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";
import { AppError } from "../../../shared/utils/AppError.js";

const SINGLE_CLINIC_LOCATION = "Health Guard Medical Center";

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

export const getCenterLocation = async (req, res) => {
  const center = await CenterLocation.findOne({ key: "primary" });
  return successResponse(res, "Clinic attendance point loaded", center);
};

export const updateCenterLocation = async (req, res) => {
  const center = await CenterLocation.findOneAndUpdate(
    { key: "primary" },
    { ...req.body, key: "primary", name: SINGLE_CLINIC_LOCATION, updatedBy: req.user._id },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return successResponse(res, "Clinic attendance point saved", center);
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

  const shift = await Shift.create({ ...req.body, location: SINGLE_CLINIC_LOCATION });
  return successResponse(res, "Shift created successfully", shift, 201);
};

const combineDateAndTime = (date, time) => {
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date(date);
  value.setHours(hours, minutes, 0, 0);
  return value;
};

export const createBulkShifts = async (req, res) => {
  const { staffIds, startDate, endDate, startTime, endTime, weekdays, notes } = req.body;
  const activeStaff = await Staff.find({ _id: { $in: staffIds }, status: "active" }).select("_id");
  const activeStaffIds = new Set(activeStaff.map((item) => item._id.toString()));
  const selectedWeekdays = new Set(weekdays.map(Number));
  const created = [];
  const skipped = [];

  for (const staffId of staffIds) {
    if (!activeStaffIds.has(staffId.toString())) {
      skipped.push({ staffId, reason: "Inactive or missing staff profile" });
      continue;
    }

    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const last = new Date(endDate);
    last.setHours(0, 0, 0, 0);

    while (current <= last) {
      if (selectedWeekdays.has(current.getDay())) {
        const shiftStart = combineDateAndTime(current, startTime);
        const shiftEnd = combineDateAndTime(current, endTime);
        const overlap = await Shift.findOne({
          staffId,
          status: "scheduled",
          startTime: { $lt: shiftEnd },
          endTime: { $gt: shiftStart }
        }).select("_id");

        if (overlap) {
          skipped.push({ staffId, date: current.toISOString().slice(0, 10), reason: "Overlapping scheduled shift" });
        } else {
          created.push({ staffId, startTime: shiftStart, endTime: shiftEnd, location: SINGLE_CLINIC_LOCATION, notes });
        }
      }
      current.setDate(current.getDate() + 1);
    }
  }

  const inserted = created.length ? await Shift.insertMany(created, { ordered: false }) : [];
  return successResponse(res, `Created ${inserted.length} shift(s)`, { createdCount: inserted.length, skipped }, 201);
};

export const listWorkforceStaff = async (req, res) => {
  const staff = await Staff.find({ status: "active" }).populate("userId", "-passwordHash").sort({ employeeId: 1 });
  return successResponse(res, "Workforce staff loaded", staff);
};

export const listShifts = async (req, res) => {
  const shifts = await Shift.find().populate({ path: "staffId", populate: { path: "userId", select: "-passwordHash" } }).sort({ startTime: -1 });
  return successResponse(res, "Shift list loaded", shifts);
};

export const listMyShifts = async (req, res) => {
  const staff = await getCurrentActiveStaff(req.user._id);
  const shifts = await Shift.find({ staffId: staff._id }).populate({ path: "staffId", populate: { path: "userId", select: "-passwordHash" } }).sort({ startTime: -1 });
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
  const existing = await Attendance.findOne({ staffId: req.body.staffId, workDate });
  if (existing) throw new AppError("Attendance has already been recorded for this staff member today", 409);
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
  const workDate = now.toISOString().slice(0, 10);
  const existing = await Attendance.findOne({ staffId: staff._id, workDate });
  if (existing) throw new AppError("You have already checked in today", 409);
  const attendance = await Attendance.create({
    staffId: staff._id,
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
  const attendance = await Attendance.find()
    .populate({ path: "staffId", populate: { path: "userId", select: "-passwordHash" } })
    .sort({ workDate: -1 });
  return successResponse(res, "Attendance list loaded", attendance);
};

export const listMyAttendance = async (req, res) => {
  const staff = await getCurrentActiveStaff(req.user._id);
  const attendance = await Attendance.find({ staffId: staff._id })
    .populate({ path: "staffId", populate: { path: "userId", select: "-passwordHash" } })
    .sort({ workDate: -1 });
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
  const leaveRequests = await LeaveRequest.find().populate({ path: "staffId", populate: { path: "userId", select: "-passwordHash" } }).sort({ createdAt: -1 });
  return successResponse(res, "Leave request list loaded", leaveRequests);
};

export const listMyLeave = async (req, res) => {
  const staff = await getCurrentActiveStaff(req.user._id);
  const leaveRequests = await LeaveRequest.find({ staffId: staff._id }).populate({ path: "staffId", populate: { path: "userId", select: "-passwordHash" } }).sort({ createdAt: -1 });
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
