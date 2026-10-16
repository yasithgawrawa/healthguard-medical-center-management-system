// Shared Appointment Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Book Appointment | Database Model | Define stored appointment data with patient id, doctor id, appointment date, slot label, reason and database validation.
// Cancel Appointment | Database Model | Define stored appointment data with patient id, doctor id, appointment date, slot label, reason and database validation.
// Reschedule Appointment | Database Model | Define stored appointment data with patient id, doctor id, appointment date, slot label, reason and database validation.
// Update Appointment Status | Database Model | Define stored appointment data with patient id, doctor id, appointment date, slot label, reason and database validation.
const appointmentSchema = new mongoose.Schema(
  {
    // Reference the shared User record by ID and require the relationship.
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Reference the shared User record by ID and require the relationship.
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    appointmentDate: { type: Date, required: true, index: true },
    slotLabel: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true, maxlength: 300 },
    // Restrict status to the supported values defined for this record.
    status: {
      type: String,
      enum: ["booked", "checked_in", "in_consultation", "completed", "cancelled"],
      default: "booked",
      index: true
    }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

// Enforce uniqueness across this combination of fields at the database level.
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, slotLabel: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: "cancelled" } } }
);

export const Appointment = mongoose.model("Appointment", appointmentSchema);
