import mongoose from "mongoose";
const schema = new mongoose.Schema({
  noticeId: { type: mongoose.Schema.Types.ObjectId, ref: "PatientNotice", required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  readAt: { type: Date, required: true, default: Date.now }
});
schema.index({ noticeId: 1, patientId: 1 }, { unique: true });
export const PatientNoticeRead = mongoose.model("PatientNoticeRead", schema);
