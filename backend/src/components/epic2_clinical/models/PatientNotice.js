// Shared PatientNotice Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Create Patient Notification | Database Model | Define stored patient notice data and database validation.
// Update Patient Notification | Database Model | Define stored patient notice data and database validation.
// View Patient Notifications | Database Model | Define stored patient notice data and database validation.
const schema = new mongoose.Schema({
  // Require a unique notification id value through a MongoDB unique index.
  notificationId: { type: String, required: true, unique: true, immutable: true, default() { return `PN-${this._id.toString().toUpperCase()}`; } },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  // Create Patient Notification | Database Model | Keep the legacy individual audience readable while restricting new documents to all patients below.
  recipient: { type: String, enum: ["one", "all"], required: true, immutable: true },
  // Reference the shared User record by ID.
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, immutable: true },
  // Reference the shared User record by ID and require the relationship.
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  expiryDate: { type: Date, default: null }
}, { timestamps: true });
schema.pre("validate", function () {
  // Create Patient Notification | Database Model | New documents must be broadcasts; existing private notices retain their original audience.
  if (this.isNew && this.recipient !== "all") this.invalidate("recipient", "New notifications must be addressed to all patients");
  if ((this.recipient === "one") !== Boolean(this.patientId)) this.invalidate("patientId", "Select a patient only for One Patient");
});
// Index this field combination to support the related lookup and sorting operations.
schema.index({ createdBy: 1, createdAt: -1 });
// Index this field combination to support the related lookup and sorting operations.
schema.index({ recipient: 1, patientId: 1, createdAt: -1 });
export const PatientNotice = mongoose.model("PatientNotice", schema);
