import { Expense } from "../models/Expense.js";
import { AppError } from "../../../shared/utils/AppError.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";

const expensePopulate = [
  { path: "createdBy", select: "firstName lastName email role" },
  { path: "updatedBy", select: "firstName lastName email role" }
];

const amountToCents = (value) => {
  const [whole, fraction = ""] = String(value).split(".");
  return Number(whole) * 100 + Number(`${fraction}00`.slice(0, 2));
};

const generateExpenseId = (expense) => `EXP-${String(expense._id).toUpperCase()}`;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const loadExpense = async (id) => {
  const expense = await Expense.findById(id).populate(expensePopulate);
  if (!expense) throw new AppError("Expense not found", 404);
  return expense;
};

export const createExpense = async (req, res) => {
  const expense = new Expense({
    title: req.body.title,
    category: req.body.category,
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

export const getExpenseDetails = async (req, res) => {
  const expense = await loadExpense(req.params.id);
  return successResponse(res, "Expense details loaded", expense);
};

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

export const deleteExpense = async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw new AppError("Expense not found", 404);

  await expense.deleteOne();
  return successResponse(res, "Expense deleted successfully", {
    id: expense._id,
    expenseId: expense.expenseId
  });
};
