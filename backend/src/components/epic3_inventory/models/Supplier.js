// Shared Supplier Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Add Supplier | Database Model | Define stored supplier data with name, email, phone, address, status and database validation.
// Update Supplier | Database Model | Define stored supplier data with name, email, phone, address, status and database validation.
// Deactivate Supplier | Database Model | Define stored supplier data with name, email, phone, address, status and database validation.
// View Suppliers | Database Model | Define stored supplier data with name, email, phone, address, status and database validation.
const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    // Restrict status to the supported values defined for this record.
    status: { type: String, enum: ["active", "inactive"], default: "active" }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const Supplier = mongoose.model("Supplier", supplierSchema);
