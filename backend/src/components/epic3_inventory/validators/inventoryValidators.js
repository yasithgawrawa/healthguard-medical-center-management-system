import { z } from "zod";
import { idParamSchema, objectIdSchema } from "../../../shared/validators/commonSchemas.js";

export const medicineSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2),
    category: z.string().trim().min(2),
    unit: z.string().trim().min(1),
    price: z.coerce.number().min(0),
    reorderLevel: z.coerce.number().min(0)
  })
});

export const supplierSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email().optional().or(z.literal("")),
    phone: z.string().trim().min(7),
    address: z.string().trim().optional().default("")
  })
});

export const batchSchema = z.object({
  body: z.object({
    medicineId: objectIdSchema,
    batchNumber: z.string().trim().min(2),
    quantity: z.coerce.number().min(0),
    purchasePrice: z.coerce.number().min(0),
    manufactureDate: z.coerce.date(),
    expiryDate: z.coerce.date()
  }).refine((data) => data.expiryDate > data.manufactureDate, {
    path: ["expiryDate"],
    message: "Expiry date must be after manufacture date"
  })
});

export const purchaseSchema = z.object({
  body: z.object({
    supplierId: objectIdSchema,
    medicineId: objectIdSchema,
    batchId: objectIdSchema,
    quantity: z.coerce.number().min(1),
    purchasePrice: z.coerce.number().min(0)
  })
});

export const saleSchema = z.object({
  body: z.object({
    prescriptionId: objectIdSchema.optional(),
    patientId: objectIdSchema.optional(),
    items: z.array(z.object({
      medicineId: objectIdSchema,
      batchId: objectIdSchema,
      quantity: z.coerce.number().min(1)
    })).min(1)
  })
});

export { idParamSchema };
