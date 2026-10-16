// Shared PatientNoticeRead Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";
// Mark Notification Read | Database Model | Define stored patient notice read data and database validation.
// View Patient Notifications | Database Model | Define stored patient notice read data and database validation.
const schema = new mongoose.Schema({
  // Reference the shared PatientNotice record by ID and require the relationship.
  noticeId: { type: mongoose.Schema.Types.ObjectId, ref: "PatientNotice", required: true },
  // Reference the shared User record by ID and require the relationship.
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  readAt: { type: Date, required: true, default: Date.now }
});
// Enforce uniqueness across this combination of fields at the database level.
schema.index({ noticeId: 1, patientId: 1 }, { unique: true });
export const PatientNoticeRead = mongoose.model("PatientNoticeRead", schema);
