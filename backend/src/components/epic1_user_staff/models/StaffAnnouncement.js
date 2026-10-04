import mongoose from "mongoose";
import { ROLES } from "../../../shared/constants/roles.js";

export const ANNOUNCEMENT_TARGET_ALL = "all";
export const STAFF_NOTICE_ROLES = [
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.DOCTOR,
  ROLES.NURSE,
  ROLES.PHARMACIST,
  ROLES.CASHIER,
  ROLES.LAB_ASSISTANT
];
export const ANNOUNCEMENT_TARGET_ROLES = [ANNOUNCEMENT_TARGET_ALL, ...STAFF_NOTICE_ROLES];

const staffAnnouncementSchema = new mongoose.Schema(
  {
    announcementId: { type: String, required: true, unique: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    message: { type: String, required: true, trim: true, minlength: 5, maxlength: 1000 },
    publishedDate: { type: Date, required: true, index: true },
    expiryDate: {
      type: Date,
      validate: {
        validator(value) {
          return !value || !this.publishedDate || value >= this.publishedDate;
        },
        message: "Expiry date cannot be earlier than published date"
      }
    },
    targetRole: { type: String, enum: ANNOUNCEMENT_TARGET_ROLES, required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const StaffAnnouncement = mongoose.model("StaffAnnouncement", staffAnnouncementSchema);
