// Expense Management | Controller | Handle expense HTTP requests and return consistent API responses.
import { Expense } from "../models/Expense.js";
import { AppError } from "../../../shared/utils/AppError.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";

const expensePopulate = [
  { path: "createdBy", select: "firstName lastName email role" },
  { path: "updatedBy", select: "firstName lastName email role" }
];

// Create Expense | Business Logic | Convert a currency amount to rounded integer cents for storage.
// Update Expense | Business Logic | Convert a currency amount to rounded integer cents for storage.
const amountToCents = (value) => {
  const [whole, fraction = ""] = String(value).split(".");
  return Number(whole) * 100 + Number(`${fraction}00`.slice(0, 2));
};

// Create Expense | Business Logic | Build an expense reference from its MongoDB document ID.
const generateExpenseId = (expense) => `EXP-${String(expense._id).toUpperCase()}`;

// View Expenses | Business Logic | Escape regular-expression symbols so search text is treated literally.
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// View Expenses | Business Logic | Build expense search, category, month, and year filters for MongoDB.
const buildExpenseFilter = ({ search, category, month, year }) => {
  const filter = {};
  if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };
  if (category) filter.category = category;

  if (year) {
    const startMonth = month ? month - 1 : 0;
    const endYear = month === 12 || !month ? year + 1 : year;
    const endMonth = month ? month % 12 : 0;
    filter.expenseDate = {
      $gte: new Date(Date.UTC(year, startMonth, 1)),
      $lt: new Date(Date.UTC(endYear, endMonth, 1))
    };
  }

  return filter;
};

// View Expense Details | Business Logic | Load an expense with staff details or return a 404 error.
const loadExpense = async (id) => {
  const expense = await Expense.findById(id).populate(expensePopulate);
  if (!expense) throw new AppError("Expense not found", 404);
  return expense;
};

// Create Expense | Controller | Create expense and send the result using the shared API response format.
export const createExpense = async (req, res) => {
  const expense = new Expense({
    title: req.body.title,
    category: req.body.category,
    // Store the submitted rupee amount as integer cents.
    amountCents: amountToCents(req.body.amount),
    expenseDate: req.body.expenseDate,
    notes: req.body.notes,
    createdBy: req.user._id,
    updatedBy: req.user._id
  });
  expense.expenseId = generateExpenseId(expense);
  await expense.save();
  await expense.populate(expensePopulate);
  return successResponse(res, "Expense created successfully", expense, 201);
};

// View Expenses | Controller | Return expenses and send the result using the shared API response format.
export const listExpenses = async (req, res) => {
  const query = req.validatedQuery || {};
  const filter = buildExpenseFilter(query);
  const [expenses, totals] = await Promise.all([
    Expense.find(filter).populate(expensePopulate).sort({ expenseDate: -1, createdAt: -1 }),
    Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, totalAmountCents: { $sum: "$amountCents" }, count: { $sum: 1 } } }
    ])
  ]);

  return successResponse(res, "Expenses loaded", {
    expenses,
    totalAmountCents: totals[0]?.totalAmountCents || 0,
    count: totals[0]?.count || 0
  });
};

// View Expense Details | Controller | Load expense details and send the result using the shared API response format.
export const getExpenseDetails = async (req, res) => {
  const expense = await loadExpense(req.params.id);
  return successResponse(res, "Expense details loaded", expense);
};

// Update Expense | Controller | Update expense and send the result using the shared API response format.
export const updateExpense = async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw new AppError("Expense not found", 404);

  const updates = { ...req.body };
  if (Object.prototype.hasOwnProperty.call(updates, "amount")) {
    updates.amountCents = amountToCents(updates.amount);
    delete updates.amount;
  }
  Object.assign(expense, updates, { updatedBy: req.user._id });
  await expense.save();
  await expense.populate(expensePopulate);
  return successResponse(res, "Expense updated successfully", expense);
};

// Delete Expense | Controller | Delete expense and send the result using the shared API response format.
export const deleteExpense = async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw new AppError("Expense not found", 404);

  await expense.deleteOne();
  return successResponse(res, "Expense deleted successfully", {
    id: expense._id,
    expenseId: expense.expenseId
  });
};
