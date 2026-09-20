import { z } from "zod";
import { moneySchema, phoneSchema, quantitySchema } from "../../../shared/validators/fieldSchemas.js";
import { idParamSchema, objectIdSchema } from "../../../shared/validators/commonSchemas.js";

const payrollMonthSchema = z.string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM")
  .refine((month) => month <= new Date().toISOString().slice(0, 7), "Future payroll months are not allowed")
  .refine((month) => Number(month.slice(0, 4)) >= new Date().getFullYear() - 5, "Payroll month is too old");

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

export const paymentSchema = z.object({
  body: z.object({
    invoiceId: objectIdSchema,
    amount: z.coerce.number({ invalid_type_error: "Amount is required" }).min(0.01, "Amount must be greater than 0").max(10000000),
    method: z.enum(["cash", "card", "bank_transfer"])
  })
});

export const paymentStatusSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({ status: z.enum(["verified", "reconciled", "voided"]) })
});

export const payrollSchema = z.object({
  body: z.object({
    staffId: objectIdSchema,
    month: payrollMonthSchema,
    baseSalary: moneySchema("Gross shift pay").optional(),
    shiftRate: moneySchema("Shift rate").optional(),
    allowances: moneySchema("Allowances").optional().default(0),
    deductions: moneySchema("Deductions").optional().default(0)
  })
});

export const payrollPreviewSchema = z.object({
  body: z.object({
    staffId: objectIdSchema,
    month: payrollMonthSchema,
    shiftRate: moneySchema("Shift rate").optional(),
    allowances: moneySchema("Allowances").optional().default(0),
    deductions: moneySchema("Deductions").optional().default(0)
  })
});

export const payrollStatusSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({ status: z.enum(["reviewed", "approved", "paid"]) })
});
