import { PatientNotice } from "../models/PatientNotice.js";
import { PatientNoticeRead } from "../models/PatientNoticeRead.js";
import { User } from "../../epic1_user_staff/models/User.js";
import { ROLES } from "../../../shared/constants/roles.js";
import { AppError } from "../../../shared/utils/AppError.js";
import { expiryInstant } from "../validators/patientNoticeValidators.js";

export const eligibleNoticeFilter = (patientId, now = new Date()) => ({
  $and: [
    { $or: [{ recipient: "all" }, { recipient: "one", patientId }] },
    { $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }] }
  ]
});
export const listOwnedNotices = managerId => PatientNotice.find({ createdBy: managerId }).populate("patientId", "firstName lastName").sort({ createdAt: -1, _id: -1 });
export const createNotice = async (body, managerId) => {
  if (body.recipient === "one" && !await User.exists({ _id: body.patientId, role: ROLES.PATIENT, status: "active" })) {
    throw new AppError("Active patient not found", 400, { patientId: "Select an active patient" });
  }
  return PatientNotice.create({ ...body, expiryDate: expiryInstant(body.expiryDate), createdBy: managerId });
};
export const updateNotice = async (id, managerId, body) => {
  const notice = await PatientNotice.findOne({ _id: id, createdBy: managerId });
  if (!notice) throw new AppError("Notification not found", 404);
  Object.assign(notice, body, Object.hasOwn(body, "expiryDate") ? { expiryDate: expiryInstant(body.expiryDate) } : {});
  return notice.save();
};
export const deleteNotice = async (id, managerId) => {
  const notice = await PatientNotice.findOneAndDelete({ _id: id, createdBy: managerId });
  if (!notice) throw new AppError("Notification not found", 404);
  await PatientNoticeRead.deleteMany({ noticeId: id });
  return { id: notice._id };
};
export const listPatientNotices = async patientId => {
  const notices = await PatientNotice.find(eligibleNoticeFilter(patientId)).select("notificationId title message expiryDate createdAt").sort({ createdAt: -1, _id: -1 }).lean();
  const reads = await PatientNoticeRead.find({ patientId, noticeId: { $in: notices.map(item => item._id) } }).lean();
  const readMap = new Map(reads.map(item => [String(item.noticeId), item.readAt]));
  return notices.map(item => ({ ...item, source: "manager", readAt: readMap.get(String(item._id)) || null }));
};
export const markNoticeRead = async (id, patientId) => {
  if (!await PatientNotice.exists({ _id: id, ...eligibleNoticeFilter(patientId) })) throw new AppError("Notification not found", 404);
  let read;
  try {
    read = await PatientNoticeRead.findOneAndUpdate(
      { noticeId: id, patientId },
      { $setOnInsert: { readAt: new Date() } },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (error) {
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
export const searchPatients = search => {
  const pattern = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return User.find({ role: ROLES.PATIENT, status: "active", ...(pattern ? { $or: [ { firstName: { $regex: pattern, $options: "i" } }, { lastName: { $regex: pattern, $options: "i" } } ] } : {}) })
    .select("_id firstName lastName").sort({ firstName: 1, lastName: 1 }).limit(50);
};
