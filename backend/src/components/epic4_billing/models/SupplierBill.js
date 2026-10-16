// Define the MongoDB structure, constraints, and relationships for supplier bill records.
import mongoose from "mongoose";

// Define stored supplier bill data with supplier id, purchase id, amount, status, method and database validation.
const supplierBillSchema = new mongoose.Schema(
  {
    // Reference the shared Supplier record by ID and require the relationship.
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    // Reference the shared Purchase record by ID and require the relationship.
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    // Restrict status to the supported values defined for this record.
    status: { type: String, enum: ["pending", "paid", "cancelled"], default: "pending", index: true },
    // Restrict method to the supported values defined for this record.
    method: { type: String, enum: ["cash", "card", "bank_transfer"] },
    paidAt: { type: Date },
    // Reference the shared User record by ID.
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const SupplierBill = mongoose.model("SupplierBill", supplierBillSchema);
