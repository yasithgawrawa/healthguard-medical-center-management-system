import mongoose from "mongoose";

const supplierBillSchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: ["pending", "paid", "cancelled"], default: "pending", index: true },
    method: { type: String, enum: ["cash", "card", "bank_transfer"] },
    paidAt: { type: Date },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const SupplierBill = mongoose.model("SupplierBill", supplierBillSchema);
