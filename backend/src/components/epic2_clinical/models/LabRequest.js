import mongoose from "mongoose";

const labRequestSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    testName: { type: String, required: true, trim: true },
    priority: { type: String, enum: ["routine", "urgent"], default: "routine" },
    status: { type: String, enum: ["requested", "verified", "in_progress", "completed", "cancelled"], default: "requested" },
    resultSummary: { type: String, trim: true },
    resultUrl: { type: String, trim: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const LabRequest = mongoose.model("LabRequest", labRequestSchema);
