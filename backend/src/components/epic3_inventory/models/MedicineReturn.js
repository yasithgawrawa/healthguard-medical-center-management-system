import mongoose from "mongoose";

const medicineReturnSchema = new mongoose.Schema(
  {
    returnId: { type: String, required: true, unique: true, trim: true, index: true },
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true, index: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "MedicineBatch", required: true, index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    returnReason: { type: String, enum: ["damaged", "expired", "incorrect"], required: true },
    returnDate: { type: Date, required: true },
    status: { type: String, enum: ["draft", "completed"], default: "draft", index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export const MedicineReturn = mongoose.model("MedicineReturn", medicineReturnSchema);
