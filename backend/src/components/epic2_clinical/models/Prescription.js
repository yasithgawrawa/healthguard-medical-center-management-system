import mongoose from "mongoose";

const prescriptionItemSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [prescriptionItemSchema], validate: [(items) => items.length > 0, "At least one item is required"] },
    status: { type: String, enum: ["active", "dispensed", "cancelled"], default: "active" }
  },
  { timestamps: true }
);

export const Prescription = mongoose.model("Prescription", prescriptionSchema);
