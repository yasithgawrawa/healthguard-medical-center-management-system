import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    month: { type: String, required: true },
    baseSalary: { type: Number, required: true, min: 0 },
    attendanceDays: { type: Number, required: true, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    netSalary: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["draft", "reviewed", "approved", "paid"], default: "draft" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paidAt: { type: Date }
  },
  { timestamps: true }
);

payrollSchema.index({ staffId: 1, month: 1 }, { unique: true });

export const Payroll = mongoose.model("Payroll", payrollSchema);
