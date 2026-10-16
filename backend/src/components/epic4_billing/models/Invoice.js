// Define the MongoDB structure, constraints, and relationships for invoice records.
import mongoose from "mongoose";

// Define stored invoice item data with description, quantity, unit price, line total and database validation.
const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

// Define stored invoice data with patient id, customer name, customer phone, appointment id, invoice type and database validation.
const invoiceSchema = new mongoose.Schema(
  {
    // Reference the shared User record by ID.
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    // Reference the shared Appointment record by ID.
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    // Restrict invoice type to the supported values defined for this record.
    invoiceType: { type: String, enum: ["visit", "pharmacy", "manual"], default: "visit", index: true },
    items: { type: [invoiceItemSchema], validate: [(items) => items.length > 0, "At least one item is required"] },
    subtotal: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    outstandingAmount: { type: Number, required: true, min: 0 },
    // Restrict status to the supported values defined for this record.
    status: { type: String, enum: ["draft", "issued", "partially_paid", "paid", "cancelled"], default: "issued" },
    // Reference the shared User record by ID and require the relationship.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);
