// Define the MongoDB structure, constraints, and relationships for medicine return records.
import mongoose from "mongoose";

// Define stored medicine return data with return id, medicine id, batch id, supplier id, quantity and database validation.
const medicineReturnSchema = new mongoose.Schema(
  {
    // Require a unique return id value through a MongoDB unique index.
    returnId: { type: String, required: true, unique: true, trim: true, index: true },
    // Reference the shared Medicine record by ID and require the relationship.
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true, index: true },
    // Reference the shared MedicineBatch record by ID and require the relationship.
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "MedicineBatch", required: true, index: true },
    // Reference the shared Supplier record by ID and require the relationship.
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    // Restrict return reason to the supported values defined for this record.
    returnReason: { type: String, enum: ["damaged", "expired", "incorrect"], required: true },
    returnDate: { type: Date, required: true },
    // Restrict status to the supported values defined for this record.
    status: { type: String, enum: ["draft", "completed"], default: "draft", index: true },
    // Reference the shared User record by ID and require the relationship.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Reference the shared User record by ID.
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const MedicineReturn = mongoose.model("MedicineReturn", medicineReturnSchema);
