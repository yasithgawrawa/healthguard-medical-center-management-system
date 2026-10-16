// Shared LeaveRequest Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Request Leave | Database Model | Define stored leave request data with staff id, leave type, start date, end date, reason and database validation.
// Review Leave | Database Model | Define stored leave request data with staff id, leave type, start date, end date, reason and database validation.
// View Leave Requests | Database Model | Read the stored LeaveRequest record and its linked IDs for this feature.
// View My Leave | Database Model | Read the stored LeaveRequest record and its linked IDs for this feature.
const leaveRequestSchema = new mongoose.Schema(
  {
    // Reference the shared Staff record by ID and require the relationship.
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    // Restrict leave type to the supported values defined for this record.
    leaveType: { type: String, enum: ["annual", "sick", "casual", "unpaid"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    // Restrict status to the supported values defined for this record.
    status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
    // Reference the shared User record by ID.
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNote: { type: String, trim: true, maxlength: 250 }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
