import mongoose from "mongoose";

export const EXPENSE_CATEGORIES = Object.freeze([
  "electricity",
  "water",
  "internet",
  "repairs",
  "other"
]);

const expenseSchema = new mongoose.Schema(
  {
    expenseId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
      index: true
    },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      required: true,
      index: true
    },
    amountCents: {
      type: Number,
      required: true,
      min: 1,
      max: 1000000000,
      validate: {
        validator: Number.isSafeInteger,
        message: "Expense amount must use valid LKR cents"
      }
    },
    expenseDate: {
      type: Date,
      required: true,
      index: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

expenseSchema.index({ expenseDate: -1, category: 1 });

export const Expense = mongoose.model("Expense", expenseSchema);
