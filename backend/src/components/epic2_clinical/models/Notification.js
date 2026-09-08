import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["lab_request", "lab_result"], required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    relatedModel: { type: String, enum: ["LabRequest"], required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    readAt: { type: Date }
  },
  { timestamps: true }
);

notificationSchema.index({ patientId: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
