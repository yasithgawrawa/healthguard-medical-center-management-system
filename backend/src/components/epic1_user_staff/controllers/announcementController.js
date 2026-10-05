import { ANNOUNCEMENT_TARGET_ALL, StaffAnnouncement } from "../models/StaffAnnouncement.js";
import { AppError } from "../../../shared/utils/AppError.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";

const announcementPopulate = [
  { path: "createdBy", select: "firstName lastName email role" },
  { path: "updatedBy", select: "firstName lastName email role" }
];

const normalizeExpiryDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

const generateAnnouncementId = (announcement) => {
  return `ANN-${String(announcement._id).toUpperCase()}`;
};

const loadAnnouncement = async (id) => {
  const announcement = await StaffAnnouncement.findById(id).populate(announcementPopulate);
  if (!announcement) throw new AppError("Announcement not found", 404);
  return announcement;
};

export const createAnnouncement = async (req, res) => {
  const announcement = new StaffAnnouncement({
    ...req.body,
    expiryDate: normalizeExpiryDate(req.body.expiryDate),
    createdBy: req.user._id,
    updatedBy: req.user._id
  });
  announcement.announcementId = generateAnnouncementId(announcement);
  await announcement.save();
  await announcement.populate(announcementPopulate);
  return successResponse(res, "Staff announcement created", announcement, 201);
};

export const listAnnouncements = async (req, res) => {
  const announcements = await StaffAnnouncement.find({})
    .populate(announcementPopulate)
    .sort({ publishedDate: -1, createdAt: -1 });
  return successResponse(res, "Staff announcements loaded", announcements);
};

export const getAnnouncementDetails = async (req, res) => {
  const announcement = await loadAnnouncement(req.params.id);
  return successResponse(res, "Staff announcement details loaded", announcement);
};

export const updateAnnouncement = async (req, res) => {
  const announcement = await StaffAnnouncement.findById(req.params.id);
  if (!announcement) throw new AppError("Announcement not found", 404);

  const updates = { ...req.body };
  if (Object.prototype.hasOwnProperty.call(updates, "expiryDate")) {
    updates.expiryDate = normalizeExpiryDate(updates.expiryDate);
  }

  const nextPublishedDate = updates.publishedDate || announcement.publishedDate;
  const nextExpiryDate = Object.prototype.hasOwnProperty.call(updates, "expiryDate")
    ? updates.expiryDate
    : announcement.expiryDate;
  if (nextExpiryDate && nextExpiryDate < nextPublishedDate) {
    throw new AppError("Expiry date cannot be earlier than published date", 400);
  }

  Object.assign(announcement, updates, { updatedBy: req.user._id });
  await announcement.save();
  await announcement.populate(announcementPopulate);
  return successResponse(res, "Staff announcement updated", announcement);
};

export const deleteAnnouncement = async (req, res) => {
  const announcement = await StaffAnnouncement.findById(req.params.id);
  if (!announcement) throw new AppError("Announcement not found", 404);

  await announcement.deleteOne();
  return successResponse(res, "Staff announcement deleted", {
    id: announcement._id,
    announcementId: announcement.announcementId
  });
};

export const listCurrentAnnouncements = async (req, res) => {
  const now = new Date();
  const announcements = await StaffAnnouncement.find({
    publishedDate: { $lte: now },
    $or: [
      { expiryDate: null },
      { expiryDate: { $exists: false } },
      { expiryDate: { $gte: now } }
    ],
    targetRole: { $in: [ANNOUNCEMENT_TARGET_ALL, req.user.role] }
  })
    .select("announcementId title message publishedDate expiryDate targetRole createdAt updatedAt")
    .sort({ publishedDate: -1, createdAt: -1 });

  return successResponse(res, "Current staff notices loaded", announcements);
};
