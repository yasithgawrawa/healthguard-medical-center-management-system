import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    reorderLevel: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true }
  },
  { timestamps: true }
);

export const Medicine = mongoose.model("Medicine", medicineSchema);
