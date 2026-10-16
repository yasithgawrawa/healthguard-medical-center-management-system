// Define the MongoDB structure, constraints, and relationships for medicine batch records.
import mongoose from "mongoose";

// Define stored medicine batch data with medicine id, batch number, quantity, purchase price, manufacture date and database validation.
const medicineBatchSchema = new mongoose.Schema(
  {
    // Reference the shared Medicine record by ID and require the relationship.
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true, index: true },
    // Require a unique batch number value through a MongoDB unique index.
    batchNumber: { type: String, required: true, unique: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    manufactureDate: {
      type: Date,
      required: true,
      validate: {
        // Reject manufacture dates later than the end of today.
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
        // Require expiry to follow the batch manufacture date.
        validator: function (val) {
          return !this.manufactureDate || val > this.manufactureDate;
        },
        message: "Expiry date must be after manufacture date"
      }
    }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const MedicineBatch = mongoose.model("MedicineBatch", medicineBatchSchema);
