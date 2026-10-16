// Shared Purchase Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Record Medicine Purchase | Database Model | Define stored purchase data with supplier id, medicine id, batch id, quantity, purchase price and database validation.
// View Medicine Purchases | Database Model | Define stored purchase data with supplier id, medicine id, batch id, quantity, purchase price and database validation.
const purchaseSchema = new mongoose.Schema(
  {
    // Reference the shared Supplier record by ID and require the relationship.
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    // Reference the shared Medicine record by ID and require the relationship.
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    // Reference the shared MedicineBatch record by ID and require the relationship.
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "MedicineBatch", required: true },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, min: 0 },
    purchasedAt: { type: Date, default: Date.now }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const Purchase = mongoose.model("Purchase", purchaseSchema);
