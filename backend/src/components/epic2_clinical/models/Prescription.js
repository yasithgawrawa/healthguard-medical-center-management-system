// Define the MongoDB structure, constraints, and relationships for prescription records.
import mongoose from "mongoose";

// Define stored prescription item data with medicine name, dosage, frequency, duration, instructions and database validation.
const prescriptionItemSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true }
  },
  { _id: false }
);

// Define stored prescription data with appointment id, patient id, doctor id, items, status and database validation.
const prescriptionSchema = new mongoose.Schema(
  {
    // Reference the shared Appointment record by ID and require the relationship.
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, index: true },
    // Reference the shared User record by ID and require the relationship.
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Reference the shared User record by ID and require the relationship.
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [prescriptionItemSchema], validate: [(items) => items.length > 0, "At least one item is required"] },
    // Restrict status to the supported values defined for this record.
    status: { type: String, enum: ["active", "dispensed", "cancelled"], default: "active" }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const Prescription = mongoose.model("Prescription", prescriptionSchema);
