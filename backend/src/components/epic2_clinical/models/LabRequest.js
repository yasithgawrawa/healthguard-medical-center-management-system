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
    parameters: [
      {
        parameter: { type: String, trim: true },
        value: { type: String, trim: true },
        unit: { type: String, trim: true },
        referenceRange: { type: String, trim: true },
        flag: { type: String, trim: true, default: "normal" }
      }
    ],
    specimenType: { type: String, trim: true, default: "Venous Blood" },
    sampleCollectedAt: { type: Date },
    reportedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const LabRequest = mongoose.model("LabRequest", labRequestSchema);
