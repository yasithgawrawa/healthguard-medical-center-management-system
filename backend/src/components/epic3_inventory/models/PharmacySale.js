// Shared PharmacySale Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

// Record Pharmacy Sale | Database Model | Define stored sale item data with medicine id, batch id, quantity, unit price, line total and database validation.
// View Pharmacy Sales | Database Model | Define stored sale item data with medicine id, batch id, quantity, unit price, line total and database validation.
// Download Pharmacy Bill | Database Model | Define stored sale item data with medicine id, batch id, quantity, unit price, line total and database validation.
const saleItemSchema = new mongoose.Schema(
  {
    // Reference the shared Medicine record by ID and require the relationship.
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    // Reference the shared MedicineBatch record by ID and require the relationship.
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "MedicineBatch", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

// Record Pharmacy Sale | Database Model | Define stored pharmacy sale data with sale number, prescription id, patient id, customer name, customer phone and database validation.
// View Pharmacy Sales | Database Model | Define stored pharmacy sale data with sale number, prescription id, patient id, customer name, customer phone and database validation.
// Download Pharmacy Bill | Database Model | Define stored pharmacy sale data with sale number, prescription id, patient id, customer name, customer phone and database validation.
const pharmacySaleSchema = new mongoose.Schema(
  {
    // Require a unique sale number value through a MongoDB unique index.
    saleNumber: { type: String, unique: true, sparse: true, index: true },
    // Reference the shared Prescription record by ID.
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },
    // Reference the shared User record by ID.
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    // Reference the shared User record by ID and require the relationship.
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [saleItemSchema], validate: [(items) => items.length > 0, "At least one item is required"] },
    total: { type: Number, required: true, min: 0 },
    // Restrict payment status to the supported values defined for this record.
    paymentStatus: { type: String, enum: ["pending_cashier", "paid"], default: "pending_cashier" },
    // Reference the shared Invoice record by ID.
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    billIssuedAt: { type: Date, default: Date.now }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const PharmacySale = mongoose.model("PharmacySale", pharmacySaleSchema);
