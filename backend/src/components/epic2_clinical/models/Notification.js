// Shared Notification Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Create Lab Request | Database Model | Define stored notification data with patient id, type, title, message, related model and database validation.
// Update Lab Report | Database Model | Define stored notification data with patient id, type, title, message, related model and database validation.
// View Patient Notifications | Database Model | Define stored notification data with patient id, type, title, message, related model and database validation.
// Mark Notification Read | Database Model | Define stored notification data with patient id, type, title, message, related model and database validation.
const notificationSchema = new mongoose.Schema(
  {
    // Reference the shared User record by ID and require the relationship.
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Restrict type to the supported values defined for this record.
    type: { type: String, enum: ["lab_request", "lab_result"], required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    // Restrict related model to the supported values defined for this record.
    relatedModel: { type: String, enum: ["LabRequest"], required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // Reference the shared User record by ID and require the relationship.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    readAt: { type: Date }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

// Index this field combination to support the related lookup and sorting operations.
notificationSchema.index({ patientId: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
