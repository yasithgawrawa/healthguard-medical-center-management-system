import { z } from "zod";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import { EXPENSE_CATEGORIES } from "../models/Expense.js";

const MAX_AMOUNT_CENTS = 1000000000;

const expenseDateSchema = z.preprocess(
  (value) => String(value ?? "").trim(),
  z.string()
    .min(1, "Expense date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expense date is invalid")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }, "Expense date is invalid")
    .transform((value) => new Date(`${value}T00:00:00.000Z`))
);

const amountSchema = z.preprocess(
  (value) => String(value ?? "").trim(),
  z.string()
    .min(1, "Amount is required")
    .regex(/^\d+(?:\.\d{1,2})?$/, "Amount must have no more than two decimal places")
    .refine((value) => {
      const [whole, fraction = ""] = value.split(".");
      const cents = Number(whole) * 100 + Number(`${fraction}00`.slice(0, 2));
      return Number.isSafeInteger(cents) && cents > 0;
    }, "Amount must be greater than 0")
    .refine((value) => {
      const [whole, fraction = ""] = value.split(".");
      const cents = Number(whole) * 100 + Number(`${fraction}00`.slice(0, 2));
      return cents <= MAX_AMOUNT_CENTS;
    }, "Amount cannot exceed Rs. 10,000,000.00")
);

const expenseFields = {
  title: z.string({ required_error: "Expense title is required" })
    .trim()
    .min(2, "Expense title must be at least 2 characters")
    .max(120, "Expense title cannot exceed 120 characters"),
  category: z.enum(EXPENSE_CATEGORIES, { required_error: "Category is required" }),
  amount: amountSchema,
  expenseDate: expenseDateSchema,
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional().default("")
};

export const createExpenseSchema = z.object({
  body: z.object(expenseFields)
});

export const updateExpenseSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({
    title: expenseFields.title.optional(),
    category: expenseFields.category.optional(),
    amount: amountSchema.optional(),
    expenseDate: expenseFields.expenseDate.optional(),
    notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional()
  }).refine((data) => Object.keys(data).length > 0, "Provide at least one field to update")
});

const optionalQueryNumber = (min, max, label) => z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : Number(value)),
  z.number({ invalid_type_error: `${label} is invalid` }).int().min(min).max(max).optional()
);

export const expenseListQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().max(120, "Search is too long").optional(),
    category: z.enum(EXPENSE_CATEGORIES).optional(),
    month: optionalQueryNumber(1, 12, "Month"),
    year: optionalQueryNumber(2000, 2100, "Year")
  }).refine((query) => !query.month || query.year, {
    path: ["year"],
    message: "Year is required when filtering by month"
  })
});
