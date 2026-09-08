import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    diagnosis: { type: String, required: true, trim: true },
    clinicalNotes: { type: String, required: true, trim: true },
    finalized: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Consultation = mongoose.model("Consultation", consultationSchema);
