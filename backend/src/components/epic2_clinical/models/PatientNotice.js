import mongoose from "mongoose";

const schema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true, immutable: true, default() { return `PN-${this._id.toString().toUpperCase()}`; } },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  recipient: { type: String, enum: ["one", "all"], required: true, immutable: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, immutable: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  expiryDate: { type: Date, default: null }
}, { timestamps: true });
schema.pre("validate", function () {
  if ((this.recipient === "one") !== Boolean(this.patientId)) this.invalidate("patientId", "Select a patient only for One Patient");
});
schema.index({ createdBy: 1, createdAt: -1 });
schema.index({ recipient: 1, patientId: 1, createdAt: -1 });
export const PatientNotice = mongoose.model("PatientNotice", schema);
