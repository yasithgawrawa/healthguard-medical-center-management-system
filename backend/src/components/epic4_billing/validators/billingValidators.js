// Validate and normalize billing request fields before business logic runs.
import { z } from "zod";
import { moneySchema, phoneSchema, quantitySchema } from "../../../shared/validators/fieldSchemas.js";
import { idParamSchema, objectIdSchema } from "../../../shared/validators/commonSchemas.js";

// Validate payroll month values.
const payrollMonthSchema = z.string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM")
  .refine((month) => month <= new Date().toISOString().slice(0, 7), "Future payroll months are not allowed")
  .refine((month) => Number(month.slice(0, 4)) >= new Date().getFullYear() - 5, "Payroll month is too old");

// Validate invoice values including patient id, customer name, customer phone, appointment id, items.
export const invoiceSchema = z.object({
  body: z.object({
    patientId: objectIdSchema.optional(),
    customerName: z.string().trim().max(120).optional(),
    customerPhone: phoneSchema.optional(),
    appointmentId: objectIdSchema.optional(),
    items: z.array(z.object({
      description: z.string().trim().min(2, "Description is required").max(120),
      quantity: quantitySchema(),
      unitPrice: z.coerce.number({ invalid_type_error: "Unit price is required" }).min(0.01, "Unit price must be greater than 0").max(10000000)
    })).min(1)
  }).refine((data) => data.patientId || data.appointmentId || (data.customerName && data.customerPhone), {
    path: ["customerPhone"],
    message: "Walk-in customer name and phone number are required"
  })
});

// Validate payment values including invoice id, amount, method.
export const paymentSchema = z.object({
  body: z.object({
    invoiceId: objectIdSchema,
    amount: z.coerce.number({ invalid_type_error: "Amount is required" }).min(0.01, "Amount must be greater than 0").max(10000000),
    method: z.enum(["cash", "card", "bank_transfer"])
  })
});

// Validate payment status values.
export const paymentStatusSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({ status: z.enum(["verified", "reconciled", "voided"]) })
});

// Validate supplier bill payment values including method.
export const supplierBillPaymentSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({
    method: z.enum(["cash", "card", "bank_transfer"])
  })
});

// Validate consolidate invoice values including patient id.
export const consolidateInvoiceSchema = z.object({
  body: z.object({
    patientId: objectIdSchema
  })
});

// Validate payroll values including staff id, month, daily pay, working days, allowances.
export const payrollSchema = z.object({
  body: z.object({
    staffId: objectIdSchema,
    month: payrollMonthSchema,
    dailyPay: moneySchema("Daily pay").min(0.01, "Daily pay must be greater than 0"),
    workingDays: z.coerce.number({ invalid_type_error: "Working days are required" }).int("Working days must be a whole number").min(1, "Working days must be at least 1").max(31, "Working days cannot exceed 31"),
    allowances: moneySchema("Allowances").optional().default(0),
    deductions: moneySchema("Deductions").optional().default(0)
  })
});

// Validate payroll preview values including staff id, month, daily pay, working days, allowances.
export const payrollPreviewSchema = z.object({
  body: z.object({
    staffId: objectIdSchema,
    month: payrollMonthSchema,
    dailyPay: moneySchema("Daily pay").min(0.01, "Daily pay must be greater than 0"),
    workingDays: z.coerce.number({ invalid_type_error: "Working days are required" }).int("Working days must be a whole number").min(1, "Working days must be at least 1").max(31, "Working days cannot exceed 31"),
    allowances: moneySchema("Allowances").optional().default(0),
    deductions: moneySchema("Deductions").optional().default(0)
  })
});

// Validate salary attendance days values including staff id, month.
export const salaryAttendanceDaysSchema = z.object({
  query: z.object({
    staffId: objectIdSchema,
    month: payrollMonthSchema
  })
});

// Validate payroll status values.
export const payrollStatusSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({ status: z.enum(["reviewed", "approved", "paid"]) })
});
