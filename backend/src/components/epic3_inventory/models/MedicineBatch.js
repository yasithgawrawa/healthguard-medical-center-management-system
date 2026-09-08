import mongoose from "mongoose";

const medicineBatchSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true, index: true },
    batchNumber: { type: String, required: true, unique: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    manufactureDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true }
  },
  { timestamps: true }
);

export const MedicineBatch = mongoose.model("MedicineBatch", medicineBatchSchema);
