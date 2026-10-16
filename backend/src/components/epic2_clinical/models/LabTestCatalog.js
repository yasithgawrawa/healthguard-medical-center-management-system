// Shared LabTestCatalog Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Add Lab Test | Database Model | Define stored lab test catalog data with test name, category, price, urgent price, description and database validation.
// Update Lab Test Price | Database Model | Define stored lab test catalog data with test name, category, price, urgent price, description and database validation.
// Create Lab Request | Database Model | Define stored lab test catalog data with test name, category, price, urgent price, description and database validation.
// View Lab Tests | Database Model | Read the stored LabTestCatalog record and its linked IDs for this feature.
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
