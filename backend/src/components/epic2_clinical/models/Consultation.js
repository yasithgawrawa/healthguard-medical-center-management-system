import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    diagnosis: { type: String, required: true, trim: true },
    clinicalNotes: { type: String, required: true, trim: true },
    chiefComplaints: { type: String, trim: true, default: "" },
    examinationFindings: { type: String, trim: true, default: "" },
    secondaryDiagnosis: { type: String, trim: true, default: "" },
    severity: { type: String, enum: ["mild", "moderate", "severe", "chronic", "routine"], default: "moderate" },
    patientAdvice: { type: String, trim: true, default: "" },
    followUpPlan: { type: String, trim: true, default: "" },
    handwrittenPrescriptionIssued: { type: Boolean, default: true },
    finalized: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Consultation = mongoose.model("Consultation", consultationSchema);
