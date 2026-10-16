// Shared Vitals Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Record Vitals | Database Model | Define stored vitals data with appointment id, patient id, temperature, blood pressure, heart rate and database validation.
const vitalsSchema = new mongoose.Schema(
  {
    // Reference the shared Appointment record by ID and require the relationship.
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    // Reference the shared User record by ID and require the relationship.
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    temperature: { type: Number, min: 25, max: 45 },
    bloodPressure: { type: String, trim: true },
    heartRate: { type: Number, min: 20, max: 250 },
    weight: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    spo2: { type: Number, min: 0, max: 100 },
    // Reference the shared User record by ID and require the relationship.
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const Vitals = mongoose.model("Vitals", vitalsSchema);
