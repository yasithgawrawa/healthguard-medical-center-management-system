import { z } from "zod";
import { idParamSchema, objectIdSchema } from "../../../shared/validators/commonSchemas.js";

export const invoiceSchema = z.object({
  body: z.object({
    patientId: objectIdSchema,
    appointmentId: objectIdSchema.optional(),
    items: z.array(z.object({
      description: z.string().trim().min(2),
      quantity: z.coerce.number().min(1),
      unitPrice: z.coerce.number().min(0)
    })).min(1)
  })
});

export const paymentSchema = z.object({
  body: z.object({
    invoiceId: objectIdSchema,
    amount: z.coerce.number().min(0.01),
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
    baseSalary: z.coerce.number().min(0),
    allowances: z.coerce.number().min(0).optional().default(0),
    deductions: z.coerce.number().min(0).optional().default(0)
  })
});

export const payrollStatusSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({ status: z.enum(["reviewed", "approved", "paid"]) })
});
