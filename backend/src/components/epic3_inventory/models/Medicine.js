// Shared Medicine Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";
import { MEDICINE_CATEGORIES } from "../constants/medicineCategories.js";

// Add New Medicine | Database Model | Define stored medicine data with name, category, unit, price, reorder level and database validation.
// Update Medicine | Database Model | Define stored medicine data with name, category, unit, price, reorder level and database validation.
// Delete Medicine | Database Model | Define stored medicine data with name, category, unit, price, reorder level and database validation.
// View Medicines | Database Model | Define stored medicine data with name, category, unit, price, reorder level and database validation.
const medicineSchema = new mongoose.Schema(
  {
    // Require a unique name value through a MongoDB unique index.
    name: { type: String, required: true, trim: true, unique: true },
    // Restrict category to the supported values defined for this record.
    category: { type: String, enum: MEDICINE_CATEGORIES, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    reorderLevel: { type: Number, required: true, min: 0 },
    // Restrict status to the supported values defined for this record.
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const Medicine = mongoose.model("Medicine", medicineSchema);
