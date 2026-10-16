// Shared LabRequest Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Create Lab Request | Database Model | Define stored lab request data with appointment id, patient id, doctor id, test name, priority and database validation.
// Update Lab Report | Database Model | Define stored lab request data with appointment id, patient id, doctor id, test name, priority and database validation.
// Print Lab Report | Database Model | Define stored lab request data with appointment id, patient id, doctor id, test name, priority and database validation.
// View Lab Requests | Database Model | Read the stored LabRequest record and its linked IDs for this feature.
const labRequestSchema = new mongoose.Schema(
  {
    // Reference the shared Appointment record by ID and require the relationship.
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, index: true },
    // Reference the shared User record by ID and require the relationship.
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Reference the shared User record by ID and require the relationship.
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    testName: { type: String, required: true, trim: true },
    // Restrict priority to the supported values defined for this record.
    priority: { type: String, enum: ["routine", "urgent"], default: "routine" },
    // Restrict status to the supported values defined for this record.
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
    // Reference the shared User record by ID.
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const LabRequest = mongoose.model("LabRequest", labRequestSchema);
