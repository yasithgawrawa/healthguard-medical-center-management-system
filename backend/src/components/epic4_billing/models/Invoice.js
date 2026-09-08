import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    items: { type: [invoiceItemSchema], validate: [(items) => items.length > 0, "At least one item is required"] },
    subtotal: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    outstandingAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["draft", "issued", "partially_paid", "paid", "cancelled"], default: "issued" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);
