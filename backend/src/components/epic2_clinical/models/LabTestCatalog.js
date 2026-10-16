// Define the MongoDB structure, constraints, and relationships for lab test catalog records.
import mongoose from "mongoose";

// Define stored lab test catalog data with test name, category, price, urgent price, description and database validation.
const labTestCatalogSchema = new mongoose.Schema(
  {
    // Require a unique test name value through a MongoDB unique index.
    testName: { type: String, required: true, unique: true, trim: true },
    category: { type: String, default: "Routine Investigation", trim: true },
    price: { type: Number, required: true, min: 0 },
    urgentPrice: { type: Number, default: 0, min: 0 },
    description: { type: String, trim: true, default: "" },
    // Reference the shared User record by ID.
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const LabTestCatalog = mongoose.model("LabTestCatalog", labTestCatalogSchema);
