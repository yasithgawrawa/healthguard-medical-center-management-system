import mongoose from "mongoose";

const medicineBatchSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true, index: true },
    batchNumber: { type: String, required: true, unique: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    manufactureDate: {
      type: Date,
      required: true,
      validate: {
        validator: (val) => {
          const end = new Date();
          end.setHours(23, 59, 59, 999);
          return val <= end;
        },
        message: "Manufacture date cannot be in the future"
      }
    },
    expiryDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (val) {
          return !this.manufactureDate || val > this.manufactureDate;
        },
        message: "Expiry date must be after manufacture date"
      }
    }
  },
  { timestamps: true }
);

export const MedicineBatch = mongoose.model("MedicineBatch", medicineBatchSchema);
