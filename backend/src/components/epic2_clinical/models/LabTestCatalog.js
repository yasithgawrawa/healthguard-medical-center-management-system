import mongoose from "mongoose";

const labTestCatalogSchema = new mongoose.Schema(
  {
    testName: { type: String, required: true, unique: true, trim: true },
    category: { type: String, default: "Routine Investigation", trim: true },
    price: { type: Number, required: true, min: 0 },
    urgentPrice: { type: Number, default: 0, min: 0 },
    description: { type: String, trim: true, default: "" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const LabTestCatalog = mongoose.model("LabTestCatalog", labTestCatalogSchema);
