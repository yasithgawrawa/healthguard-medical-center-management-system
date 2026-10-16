// Shared CenterLocation Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Set Clinic Location | Database Model | Define stored center location data with key, name, latitude, longitude, radius meters and database validation.
// View Clinic Location | Database Model | Define stored center location data with key, name, latitude, longitude, radius meters and database validation.
const centerLocationSchema = new mongoose.Schema(
  {
    // Require a unique key value through a MongoDB unique index.
    key: { type: String, default: "primary", unique: true, immutable: true },
    name: { type: String, required: true, trim: true, default: "Health Guard Medical Center" },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    radiusMeters: { type: Number, required: true, min: 10, max: 1000, default: 100 },
    // Reference the shared User record by ID.
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const CenterLocation = mongoose.model("CenterLocation", centerLocationSchema);
