import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    geoFence: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      radiusMeters: { type: Number, min: 10, max: 1000 }
    },
    status: { type: String, enum: ["scheduled", "cancelled", "completed"], default: "scheduled" },
    notes: { type: String, trim: true, maxlength: 250 }
  },
  { timestamps: true }
);

shiftSchema.index({ staffId: 1, startTime: 1, endTime: 1 });
shiftSchema.index({ "geoFence.latitude": 1, "geoFence.longitude": 1 });

export const Shift = mongoose.model("Shift", shiftSchema);
