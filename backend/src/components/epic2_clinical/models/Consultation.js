// Shared Consultation Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Save Consultation | Database Model | Define stored consultation data with appointment id, patient id, doctor id, diagnosis, clinical notes and database validation.
const consultationSchema = new mongoose.Schema(
  {
    // Reference the shared Appointment record by ID and require the relationship.
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    // Reference the shared User record by ID and require the relationship.
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Reference the shared User record by ID and require the relationship.
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    diagnosis: { type: String, required: true, trim: true },
    clinicalNotes: { type: String, required: true, trim: true },
    chiefComplaints: { type: String, trim: true, default: "" },
    examinationFindings: { type: String, trim: true, default: "" },
    secondaryDiagnosis: { type: String, trim: true, default: "" },
    // Restrict severity to the supported values defined for this record.
    severity: { type: String, enum: ["mild", "moderate", "severe", "chronic", "routine"], default: "moderate" },
    patientAdvice: { type: String, trim: true, default: "" },
    followUpPlan: { type: String, trim: true, default: "" },
    handwrittenPrescriptionIssued: { type: Boolean, default: true },
    finalized: { type: Boolean, default: false }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const Consultation = mongoose.model("Consultation", consultationSchema);
