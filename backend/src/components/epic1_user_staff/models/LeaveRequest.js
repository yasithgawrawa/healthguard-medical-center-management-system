import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    leaveType: { type: String, enum: ["annual", "sick", "casual", "unpaid"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNote: { type: String, trim: true, maxlength: 250 }
  },
  { timestamps: true }
);

export const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
