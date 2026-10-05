import mongoose from "mongoose";
import { ROLE_VALUES, ROLES } from "../../../shared/constants/roles.js";

export const ANNOUNCEMENT_TARGET_ALL = "all";
export const ANNOUNCEMENT_TARGET_ROLES = Object.freeze([
  ANNOUNCEMENT_TARGET_ALL,
  ...ROLE_VALUES.filter((role) => role !== ROLES.PATIENT)
]);

const staffAnnouncementSchema = new mongoose.Schema(
  {
    announcementId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000
    },
    publishedDate: {
      type: Date,
      required: true,
      index: true
    },
    expiryDate: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          return !value || !this.publishedDate || value >= this.publishedDate;
        },
        message: "Expiry date cannot be earlier than published date"
      }
    },
    targetRole: {
      type: String,
      enum: ANNOUNCEMENT_TARGET_ROLES,
      required: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

staffAnnouncementSchema.index({ targetRole: 1, publishedDate: -1, expiryDate: 1 });

export const StaffAnnouncement = mongoose.model("StaffAnnouncement", staffAnnouncementSchema);
