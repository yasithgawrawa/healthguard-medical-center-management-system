import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "MedicineBatch", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const pharmacySaleSchema = new mongoose.Schema(
  {
    saleNumber: { type: String, unique: true, sparse: true, index: true },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [saleItemSchema], validate: [(items) => items.length > 0, "At least one item is required"] },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ["pending_cashier", "paid"], default: "pending_cashier" },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    billIssuedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const PharmacySale = mongoose.model("PharmacySale", pharmacySaleSchema);
