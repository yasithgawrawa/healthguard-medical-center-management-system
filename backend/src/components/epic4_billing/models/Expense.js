// Shared Expense Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import mongoose from "mongoose";

export const EXPENSE_CATEGORIES = Object.freeze([
  "electricity",
  "water",
  "internet",
  "repairs",
  "other"
]);

// Create Expense | Database Model | Define stored expense data with expense id, title, category, amount cents and database validation.
// Update Expense | Database Model | Define stored expense data with expense id, title, category, amount cents and database validation.
// Delete Expense | Database Model | Define stored expense data with expense id, title, category, amount cents and database validation.
// View Expenses | Database Model | Define stored expense data with expense id, title, category, amount cents and database validation.
// View Expense Details | Database Model | Read the stored Expense record and its linked IDs for this feature.
const expenseSchema = new mongoose.Schema(
  {
    // Require a unique expense id value through a MongoDB unique index.
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
    // Restrict category to the supported values defined for this record.
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      required: true,
      index: true
    },
    // Store the amount as a positive safe integer in LKR cents.
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
    // Reference the shared User record by ID and require the relationship.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    // Reference the shared User record by ID and require the relationship.
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

// Index this field combination to support the related lookup and sorting operations.
expenseSchema.index({ expenseDate: -1, category: 1 });

export const Expense = mongoose.model("Expense", expenseSchema);
