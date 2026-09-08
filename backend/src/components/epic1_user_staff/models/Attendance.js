import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    workDate: { type: String, required: true, index: true },
    checkInAt: { type: Date, required: true },
    checkOutAt: { type: Date },
    status: { type: String, enum: ["checked_in", "checked_out"], default: "checked_in" },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift" },
    checkInLocation: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      accuracyMeters: { type: Number, min: 0 },
      distanceFromShiftMeters: { type: Number, min: 0 }
    },
    notes: { type: String, trim: true, maxlength: 250 }
  },
  { timestamps: true }
);

attendanceSchema.index({ staffId: 1, workDate: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
