import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    appointmentDate: { type: Date, required: true, index: true },
    slotLabel: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true, maxlength: 300 },
    status: {
      type: String,
      enum: ["booked", "checked_in", "in_consultation", "completed", "cancelled"],
      default: "booked",
      index: true
    }
  },
  { timestamps: true }
);

appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, slotLabel: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: "cancelled" } } }
);

export const Appointment = mongoose.model("Appointment", appointmentSchema);
