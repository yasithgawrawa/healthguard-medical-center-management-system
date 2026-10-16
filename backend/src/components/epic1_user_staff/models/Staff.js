// Define the MongoDB structure, constraints, and relationships for staff records.
import mongoose from "mongoose";
import { ROLE_VALUES } from "../../../shared/constants/roles.js";

// Define stored staff data with user id, employee id, department, role, employment date and database validation.
const staffSchema = new mongoose.Schema(
  {
    // Reference the shared User record by ID and require the relationship.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    // Require a unique employee id value through a MongoDB unique index.
    employeeId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    department: { type: String, trim: true, default: "General" },
    // Restrict role to the supported values defined for this record.
    role: { type: String, enum: ROLE_VALUES, required: true, index: true },
    employmentDate: {
      type: Date,
      required: true,
      validate: {
        // Reject employment dates later than the end of today.
        validator: (val) => {
          const endOfToday = new Date();
          endOfToday.setHours(23, 59, 59, 999);
          return val <= endOfToday;
        },
        message: "Employment date must be in the past"
      }
    },
    // Restrict status to the supported values defined for this record.
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    emergencyContact: { type: String, trim: true },
    // Restrict pay basis to the supported values defined for this record.
    payBasis: { type: String, enum: ["shift", "exempt"], default: "shift" },
    baseSalary: { type: Number, default: 0, min: 0 },
    shiftRate: { type: Number, default: 0, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const Staff = mongoose.model("Staff", staffSchema);
