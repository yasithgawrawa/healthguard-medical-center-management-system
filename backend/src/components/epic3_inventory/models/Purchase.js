import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "MedicineBatch", required: true },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, min: 0 },
    purchasedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Purchase = mongoose.model("Purchase", purchaseSchema);
