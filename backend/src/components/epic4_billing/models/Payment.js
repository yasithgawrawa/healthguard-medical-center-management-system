// Shared Payment Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Record Payment | Database Model | Define stored payment data with invoice id, amount, method, status, recorded by and database validation.
// Update Payment Status | Database Model | Define stored payment data with invoice id, amount, method, status, recorded by and database validation.
// View Payments | Database Model | Define stored payment data with invoice id, amount, method, status, recorded by and database validation.
const paymentSchema = new mongoose.Schema(
  {
    // Reference the shared Invoice record by ID and require the relationship.
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    // Restrict method to the supported values defined for this record.
    method: { type: String, enum: ["cash", "card", "bank_transfer"], required: true },
    // Restrict status to the supported values defined for this record.
    status: { type: String, enum: ["recorded", "verified", "reconciled", "voided"], default: "recorded" },
    // Reference the shared User record by ID and require the relationship.
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Reference the shared User record by ID.
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
