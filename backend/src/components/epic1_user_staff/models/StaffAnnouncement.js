// Shared StaffAnnouncement Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";
import { ROLE_VALUES, ROLES } from "../../../shared/constants/roles.js";

export const ANNOUNCEMENT_TARGET_ALL = "all";
export const ANNOUNCEMENT_TARGET_ROLES = Object.freeze([
  ANNOUNCEMENT_TARGET_ALL,
  ...ROLE_VALUES.filter((role) => role !== ROLES.PATIENT)
]);

// Create Staff Announcement | Database Model | Define stored staff announcement data with announcement id, title, message, published date, expiry date and database validation.
// Update Staff Announcement | Database Model | Define stored staff announcement data with announcement id, title, message, published date, expiry date and database validation.
// View Current Staff Announcements | Database Model | Define stored staff announcement data with announcement id, title, message, published date, expiry date and database validation.
// View Staff Announcements | Database Model | Read the stored StaffAnnouncement record and its linked IDs for this feature.
// View Announcement Details | Database Model | Read the stored StaffAnnouncement record and its linked IDs for this feature.
// Delete Staff Announcement | Database Model | Read the stored StaffAnnouncement record and its linked IDs for this feature.
const staffAnnouncementSchema = new mongoose.Schema(
  {
    // Require a unique announcement id value through a MongoDB unique index.
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
        // Create Staff Announcement | Database Model | Require expiry to be on or after the announcement publication date.
        // Update Staff Announcement | Database Model | Require expiry to be on or after the announcement publication date.
        // View Current Staff Announcements | Database Model | Require expiry to be on or after the announcement publication date.
        validator(value) {
          return !value || !this.publishedDate || value >= this.publishedDate;
        },
        message: "Expiry date cannot be earlier than published date"
      }
    },
    // Restrict target role to the supported values defined for this record.
    targetRole: {
      type: String,
      enum: ANNOUNCEMENT_TARGET_ROLES,
      required: true,
      index: true
    },
    // Reference the shared User record by ID and require the relationship.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // Reference the shared User record by ID and require the relationship.
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

// Index this field combination to support the related lookup and sorting operations.
staffAnnouncementSchema.index({ targetRole: 1, publishedDate: -1, expiryDate: 1 });

export const StaffAnnouncement = mongoose.model("StaffAnnouncement", staffAnnouncementSchema);
