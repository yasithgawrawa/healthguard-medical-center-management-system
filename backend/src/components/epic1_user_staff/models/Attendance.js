// Define the MongoDB structure, constraints, and relationships for attendance records.
import mongoose from "mongoose";

// Define stored attendance data with staff id, work date, check in at, check out at, status and database validation.
const attendanceSchema = new mongoose.Schema(
  {
    // Reference the shared Staff record by ID and require the relationship.
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    workDate: { type: String, required: true, index: true },
    checkInAt: { type: Date, required: true },
    checkOutAt: { type: Date },
    // Restrict status to the supported values defined for this record.
    status: { type: String, enum: ["checked_in", "checked_out"], default: "checked_in" },
    notes: { type: String, trim: true, maxlength: 250 }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

// Enforce uniqueness across this combination of fields at the database level.
attendanceSchema.index({ staffId: 1, workDate: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
