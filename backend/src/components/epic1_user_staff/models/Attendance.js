// Shared Attendance Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Attendance Check In | Database Model | Define stored attendance data with staff id, work date, check in at, check out at, status and database validation.
// Attendance Check Out | Database Model | Define stored attendance data with staff id, work date, check in at, check out at, status and database validation.
// View Salary Attendance Days | Database Model | Define stored attendance data with staff id, work date, check in at, check out at, status and database validation.
// View Attendance | Database Model | Read the stored Attendance record and its linked IDs for this feature.
// View My Attendance | Database Model | Read the stored Attendance record and its linked IDs for this feature.
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
