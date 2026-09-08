import mongoose from "mongoose";

const vitalsSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    temperature: { type: Number, min: 25, max: 45 },
    bloodPressure: { type: String, trim: true },
    heartRate: { type: Number, min: 20, max: 250 },
    weight: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    spo2: { type: Number, min: 0, max: 100 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const Vitals = mongoose.model("Vitals", vitalsSchema);
