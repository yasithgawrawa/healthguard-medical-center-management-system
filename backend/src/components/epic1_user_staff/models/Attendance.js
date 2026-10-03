import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    workDate: { type: String, required: true, index: true },
    checkInAt: { type: Date, required: true },
    checkOutAt: { type: Date },
    status: { type: String, enum: ["checked_in", "checked_out"], default: "checked_in" },
    notes: { type: String, trim: true, maxlength: 250 }
  },
  { timestamps: true }
);

attendanceSchema.index({ staffId: 1, workDate: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
