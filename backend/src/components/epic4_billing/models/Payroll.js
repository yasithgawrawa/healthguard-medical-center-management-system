// Define the MongoDB structure, constraints, and relationships for payroll records.
import mongoose from "mongoose";

// Define stored payroll data with staff id, month, base salary, daily pay, working days and database validation.
const payrollSchema = new mongoose.Schema(
  {
    // Reference the shared Staff record by ID and require the relationship.
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    month: { type: String, required: true },
    baseSalary: { type: Number, required: true, min: 0 },
    dailyPay: { type: Number, default: 0, min: 0 },
    workingDays: { type: Number, default: 0, min: 0 },
    shiftRate: { type: Number, default: 0, min: 0 },
    payableShifts: { type: Number, default: 0, min: 0 },
    attendanceDays: { type: Number, default: 0, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    netSalary: { type: Number, required: true, min: 0 },
    // Restrict status to the supported values defined for this record.
    status: { type: String, enum: ["draft", "reviewed", "approved", "paid"], default: "draft" },
    // Reference the shared User record by ID.
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Reference the shared User record by ID.
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paidAt: { type: Date }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

// Enforce uniqueness across this combination of fields at the database level.
payrollSchema.index({ staffId: 1, month: 1 }, { unique: true });

export const Payroll = mongoose.model("Payroll", payrollSchema);
