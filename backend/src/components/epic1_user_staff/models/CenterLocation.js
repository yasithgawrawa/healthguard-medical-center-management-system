import mongoose from "mongoose";

const centerLocationSchema = new mongoose.Schema(
  {
    key: { type: String, default: "primary", unique: true, immutable: true },
    name: { type: String, required: true, trim: true, default: "Health Guard Medical Center" },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    radiusMeters: { type: Number, required: true, min: 10, max: 1000, default: 100 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const CenterLocation = mongoose.model("CenterLocation", centerLocationSchema);
