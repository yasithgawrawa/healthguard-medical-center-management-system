import { z } from "zod";
import { moneySchema, quantitySchema } from "../../../shared/validators/fieldSchemas.js";
import { idParamSchema, objectIdSchema } from "../../../shared/validators/commonSchemas.js";

export const invoiceSchema = z.object({
  body: z.object({
    patientId: objectIdSchema,
    appointmentId: objectIdSchema.optional(),
    items: z.array(z.object({
      description: z.string().trim().min(2, "Description is required").max(120),
      quantity: quantitySchema(),
      unitPrice: moneySchema("Unit price")
    })).min(1)
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
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM"),
    baseSalary: moneySchema("Base salary"),
    allowances: moneySchema("Allowances").optional().default(0),
    deductions: moneySchema("Deductions").optional().default(0)
  })
});

export const payrollStatusSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({ status: z.enum(["reviewed", "approved", "paid"]) })
});
