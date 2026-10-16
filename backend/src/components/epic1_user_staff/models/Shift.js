// Shared Shift Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Create Shift | Database Model | Define stored shift data with staff id, start time, end time, location, geo fence and database validation.
// Create Bulk Shifts | Database Model | Define stored shift data with staff id, start time, end time, location, geo fence and database validation.
// Update Shift Status | Database Model | Define stored shift data with staff id, start time, end time, location, geo fence and database validation.
// View Shifts | Database Model | Read the stored Shift record and its linked IDs for this feature.
// View My Shifts | Database Model | Read the stored Shift record and its linked IDs for this feature.
const shiftSchema = new mongoose.Schema(
  {
    // Reference the shared Staff record by ID and require the relationship.
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    geoFence: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      radiusMeters: { type: Number, min: 10, max: 1000 }
    },
    // Restrict status to the supported values defined for this record.
    status: { type: String, enum: ["scheduled", "cancelled", "completed"], default: "scheduled" },
    notes: { type: String, trim: true, maxlength: 250 }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

// Index this field combination to support the related lookup and sorting operations.
shiftSchema.index({ staffId: 1, startTime: 1, endTime: 1 });
// Index this field combination to support the related lookup and sorting operations.
shiftSchema.index({ "geoFence.latitude": 1, "geoFence.longitude": 1 });

export const Shift = mongoose.model("Shift", shiftSchema);
