// Define the MongoDB structure, constraints, and relationships for medicine records.
import mongoose from "mongoose";
import { MEDICINE_CATEGORIES } from "../constants/medicineCategories.js";

// Define stored medicine data with name, category, unit, price, reorder level and database validation.
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
