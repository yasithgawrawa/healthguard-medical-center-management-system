import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: ["cash", "card", "bank_transfer"], required: true },
    status: { type: String, enum: ["recorded", "verified", "reconciled", "voided"], default: "recorded" },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
