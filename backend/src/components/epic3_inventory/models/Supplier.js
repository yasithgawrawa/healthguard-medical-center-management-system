// Define the MongoDB structure, constraints, and relationships for supplier records.
import mongoose from "mongoose";

// Define stored supplier data with name, email, phone, address, status and database validation.
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
