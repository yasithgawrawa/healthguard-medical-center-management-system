import { ANNOUNCEMENT_TARGET_ALL, StaffAnnouncement } from "../models/StaffAnnouncement.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";
import { AppError } from "../../../shared/utils/AppError.js";

const announcementPopulate = [
  { path: "createdBy", select: "firstName lastName email role" }
];

const generateAnnouncementId = async () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `ANN-${today}`;
  const existing = await StaffAnnouncement.find({ announcementId: new RegExp(`^${prefix}-`) }).select("announcementId");
  let maxNum = 0;
  const regex = new RegExp(`^${prefix}-([0-9]+)$`);
  for (const item of existing) {
    const match = item.announcementId?.match(regex);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (parsed > maxNum) maxNum = parsed;
    }
  }
  return `${prefix}-${String(maxNum + 1).padStart(4, "0")}`;
};

const loadAnnouncement = async (id) => {
  const announcement = await StaffAnnouncement.findById(id).populate(announcementPopulate);
  if (!announcement) throw new AppError("Announcement not found", 404);
  return announcement;
};

export const createAnnouncement = async (req, res) => {
  const announcement = await StaffAnnouncement.create({
    ...req.body,
    announcementId: await generateAnnouncementId(),
    createdBy: req.user._id
  });
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

  Object.assign(announcement, req.body);
  await announcement.save();
  await announcement.populate(announcementPopulate);
  return successResponse(res, "Staff announcement updated", announcement);
};

export const deleteAnnouncement = async (req, res) => {
  const announcement = await StaffAnnouncement.findById(req.params.id);
  if (!announcement) throw new AppError("Announcement not found", 404);

  await announcement.deleteOne();
  return successResponse(res, "Staff announcement deleted", announcement);
};

export const listMyAnnouncements = async (req, res) => {
  const now = new Date();
  const announcements = await StaffAnnouncement.find({
    publishedDate: { $lte: now },
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gte: now } }
    ],
    targetRole: { $in: [ANNOUNCEMENT_TARGET_ALL, req.user.role] }
  })
    .select("announcementId title message publishedDate expiryDate targetRole createdAt updatedAt")
    .sort({ publishedDate: -1, createdAt: -1 });

  return successResponse(res, "Current staff notices loaded", announcements);
};
