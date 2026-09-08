import { z } from "zod";
import { batchNumberPattern, moneySchema, phoneSchema, quantitySchema, textNoNumbersSchema } from "../../../shared/validators/fieldSchemas.js";
import { idParamSchema, objectIdSchema } from "../../../shared/validators/commonSchemas.js";
import { MEDICINE_CATEGORIES } from "../constants/medicineCategories.js";

const medicineBodySchema = z.object({
  name: z.string().trim().min(2, "Medicine name is required").max(120),
  category: z.string().min(1, "Select medicine category").refine((value) => MEDICINE_CATEGORIES.includes(value), "Select a valid medicine category"),
  unit: z.string().trim().min(1, "Unit is required").max(30),
  price: moneySchema("Price"),
  reorderLevel: z.coerce.number().int("Reorder level must be a whole number").min(0).max(100000)
});

const batchBodySchema = z.object({
  medicineId: objectIdSchema,
  batchNumber: z.string().trim().min(2, "Batch number is required").max(40).regex(batchNumberPattern, "Batch number can only contain letters, numbers and hyphens"),
  quantity: quantitySchema(),
  purchasePrice: moneySchema("Purchase price"),
  manufactureDate: z.coerce.date(),
  expiryDate: z.coerce.date()
});

const batchDateOrder = (data) => data.expiryDate > data.manufactureDate;

export const medicineSchema = z.object({
  body: medicineBodySchema
});

export const updateMedicineSchema = z.object({
  params: idParamSchema.shape.params,
  body: medicineBodySchema.partial()
});

export const supplierSchema = z.object({
  body: z.object({
    name: textNoNumbersSchema("Supplier name", 120),
    email: z.string().trim().email().optional().or(z.literal("")),
    phone: phoneSchema,
    address: z.string().trim().min(5, "Address is required").max(250)
  })
});

export const batchSchema = z.object({
  body: batchBodySchema.refine(batchDateOrder, {
    path: ["expiryDate"],
    message: "Expiry date must be after manufacture date"
  })
});

export const updateBatchSchema = z.object({
  params: idParamSchema.shape.params,
  body: batchBodySchema.partial().extend({
    quantity: z.coerce.number().int("Quantity must be a whole number").min(0, "Quantity cannot be negative").max(100000).optional()
  }).refine((data) => {
    if (!data.manufactureDate || !data.expiryDate) return true;
    return data.expiryDate > data.manufactureDate;
  }, {
    path: ["expiryDate"],
    message: "Expiry date must be after manufacture date"
  })
});

export const purchaseSchema = z.object({
  body: z.object({
    supplierId: objectIdSchema,
    medicineId: objectIdSchema,
    batchId: objectIdSchema,
    quantity: quantitySchema(),
    purchasePrice: moneySchema("Purchase price")
  })
});

export const saleSchema = z.object({
  body: z.object({
    prescriptionId: objectIdSchema.optional(),
    patientId: objectIdSchema.optional(),
    items: z.array(z.object({
      medicineId: objectIdSchema,
      batchId: objectIdSchema,
      quantity: quantitySchema()
    })).min(1)
  })
});

export { idParamSchema };
