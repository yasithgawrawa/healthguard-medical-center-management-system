// Implement patient notice business rules and coordinate database operations.
import { PatientNotice } from "../models/PatientNotice.js";
import { PatientNoticeRead } from "../models/PatientNoticeRead.js";
import { User } from "../../epic1_user_staff/models/User.js";
import { ROLES } from "../../../shared/constants/roles.js";
import { AppError } from "../../../shared/utils/AppError.js";
import { expiryInstant } from "../validators/patientNoticeValidators.js";

// Match notices addressed to this patient or everyone and exclude expired notices.
export const eligibleNoticeFilter = (patientId, now = new Date()) => ({
  $and: [
    { $or: [{ recipient: "all" }, { recipient: "one", patientId }] },
    { $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }] }
  ]
});
// List only the notices created by the requesting manager.
export const listOwnedNotices = managerId => PatientNotice.find({ createdBy: managerId }).populate("patientId", "firstName lastName").sort({ createdAt: -1, _id: -1 });
// Validate an individual recipient and save a manager-owned patient notice.
export const createNotice = async (body, managerId) => {
  if (body.recipient === "one" && !await User.exists({ _id: body.patientId, role: ROLES.PATIENT, status: "active" })) {
    throw new AppError("Active patient not found", 400, { patientId: "Select an active patient" });
  }
  return PatientNotice.create({ ...body, expiryDate: expiryInstant(body.expiryDate), createdBy: managerId });
};
// Update a notice only when it belongs to the requesting manager.
export const updateNotice = async (id, managerId, body) => {
  const notice = await PatientNotice.findOne({ _id: id, createdBy: managerId });
  if (!notice) throw new AppError("Notification not found", 404);
  Object.assign(notice, body, Object.hasOwn(body, "expiryDate") ? { expiryDate: expiryInstant(body.expiryDate) } : {});
  return notice.save();
};
// Delete a manager-owned notice and remove its patient read receipts.
export const deleteNotice = async (id, managerId) => {
  const notice = await PatientNotice.findOneAndDelete({ _id: id, createdBy: managerId });
  if (!notice) throw new AppError("Notification not found", 404);
  await PatientNoticeRead.deleteMany({ noticeId: id });
  return { id: notice._id };
};
// Load visible patient notices and attach the current patient's read timestamps.
export const listPatientNotices = async patientId => {
  const notices = await PatientNotice.find(eligibleNoticeFilter(patientId)).select("notificationId title message expiryDate createdAt").sort({ createdAt: -1, _id: -1 }).lean();
  const reads = await PatientNoticeRead.find({ patientId, noticeId: { $in: notices.map(item => item._id) } }).lean();
  // Match each eligible notice to this patient's read receipt.
  const readMap = new Map(reads.map(item => [String(item.noticeId), item.readAt]));
  return notices.map(item => ({ ...item, source: "manager", readAt: readMap.get(String(item._id)) || null }));
};
// Save an idempotent read receipt and recheck notice visibility after the write.
export const markNoticeRead = async (id, patientId) => {
  if (!await PatientNotice.exists({ _id: id, ...eligibleNoticeFilter(patientId) })) throw new AppError("Notification not found", 404);
  let read;
  try {
    read = await PatientNoticeRead.findOneAndUpdate(
      { noticeId: id, patientId },
      // Set the read timestamp only when creating a receipt so repeated reads retain the original time.
      { $setOnInsert: { readAt: new Date() } },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (error) {
    // Recover from concurrent receipt creation by loading the row protected by the unique index.
    if (error.code !== 11000) throw error;
    read = await PatientNoticeRead.findOne({ noticeId: id, patientId });
  }
  if (!read) throw new AppError("Notification not found", 404);
  // Recheck visibility after writing, including concurrent deletion or expiry.
  if (!await PatientNotice.exists({ _id: id, ...eligibleNoticeFilter(patientId) })) {
    await PatientNoticeRead.deleteOne({ _id: read._id });
    throw new AppError("Notification not found", 404);
  }
  return { id, readAt: read.readAt };
};
// Search active patients by escaped name text and return at most 50 matches.
export const searchPatients = search => {
  const pattern = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return User.find({ role: ROLES.PATIENT, status: "active", ...(pattern ? { $or: [ { firstName: { $regex: pattern, $options: "i" } }, { lastName: { $regex: pattern, $options: "i" } } ] } : {}) })
    .select("_id firstName lastName").sort({ firstName: 1, lastName: 1 }).limit(50);
};
