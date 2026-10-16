// Shared MedicineBatch Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Add Medicine Batch | Database Model | Define stored medicine batch data with medicine id, batch number, quantity, purchase price, manufacture date and database validation.
// Update Medicine Batch | Database Model | Define stored medicine batch data with medicine id, batch number, quantity, purchase price, manufacture date and database validation.
// Record Medicine Purchase | Database Model | Define stored medicine batch data with medicine id, batch number, quantity, purchase price, manufacture date and database validation.
// Record Pharmacy Sale | Database Model | Define stored medicine batch data with medicine id, batch number, quantity, purchase price, manufacture date and database validation.
// Complete Medicine Return | Database Model | Define stored medicine batch data with medicine id, batch number, quantity, purchase price, manufacture date and database validation.
// View Medicine Batches | Database Model | Read the stored MedicineBatch record and its linked IDs for this feature.
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
        // Add Medicine Batch | Database Model | Reject manufacture dates later than the end of today.
        // Update Medicine Batch | Database Model | Reject manufacture dates later than the end of today.
        // Record Medicine Purchase | Database Model | Reject manufacture dates later than the end of today.
        // Record Pharmacy Sale | Database Model | Reject manufacture dates later than the end of today.
        // Complete Medicine Return | Database Model | Reject manufacture dates later than the end of today.
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
        // Add Medicine Batch | Database Model | Require expiry to follow the batch manufacture date.
        // Update Medicine Batch | Database Model | Require expiry to follow the batch manufacture date.
        // Record Medicine Purchase | Database Model | Require expiry to follow the batch manufacture date.
        // Record Pharmacy Sale | Database Model | Require expiry to follow the batch manufacture date.
        // Complete Medicine Return | Database Model | Require expiry to follow the batch manufacture date.
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
