import mongoose from "mongoose";
import { ROLE_VALUES } from "../../../shared/constants/roles.js";

const staffSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    employeeId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    department: { type: String, required: true, trim: true },
    role: { type: String, enum: ROLE_VALUES, required: true, index: true },
    employmentDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    emergencyContact: { type: String, trim: true },
    baseSalary: { type: Number, default: 0, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

export const Staff = mongoose.model("Staff", staffSchema);
