// Validate and normalize inventory request fields before business logic runs.
import { z } from "zod";
import { batchNumberPattern, moneySchema, phoneSchema, quantitySchema, textNoNumbersSchema } from "../../../shared/validators/fieldSchemas.js";
import { idParamSchema, objectIdSchema } from "../../../shared/validators/commonSchemas.js";
import { MEDICINE_CATEGORIES } from "../constants/medicineCategories.js";

// Validate medicine values including name, category, unit, price, reorder level.
const medicineBodySchema = z.object({
  name: z.string().trim().min(2, "Medicine name is required").max(120),
  category: z.string().min(1, "Select medicine category").refine((value) => MEDICINE_CATEGORIES.includes(value), "Select a valid medicine category"),
  unit: z.string().trim().min(1, "Unit is required").max(30),
  price: z.coerce.number({ invalid_type_error: "Price is required" }).min(0.01, "Price must be greater than 0").max(10000000),
  reorderLevel: z.coerce.number().int("Reorder level must be a whole number").min(0).max(100000),
  status: z.enum(["active", "inactive"]).optional()
});

// Allow dates up to the end of today in the server local timezone.
const isPastOrToday = (date) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return date <= end;
};

// Require a timestamp after the start of today in the server local timezone.
const isFutureDate = (date) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return date > start;
};

// Allow dates from the start of today onward in the server local timezone.
const isTodayOrFuture = (date) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return date >= start;
};

// Validate batch values including medicine id, batch number, quantity, purchase price, manufacture date.
const batchBodySchema = z.object({
  medicineId: objectIdSchema,
  batchNumber: z.string().trim().min(2, "Batch number is required").max(40).regex(batchNumberPattern, "Batch number can only contain letters, numbers and hyphens"),
  quantity: quantitySchema(),
  purchasePrice: moneySchema("Purchase price"),
  manufactureDate: z.coerce.date().refine(isPastOrToday, "Manufacture date cannot be in the future"),
  expiryDate: z.coerce.date().refine(isFutureDate, "Expiry date must be in the future for newly received stock")
});

// Require the batch expiry date to be later than its manufacture date.
const batchDateOrder = (data) => data.expiryDate > data.manufactureDate;

// Validate medicine values.
export const medicineSchema = z.object({
  body: medicineBodySchema
});

// Validate update medicine values while allowing omitted fields for updates.
export const updateMedicineSchema = z.object({
  params: idParamSchema.shape.params,
  // Partial updates validate supplied medicine fields while allowing other fields to remain unchanged.
  body: medicineBodySchema.partial()
});

// Validate supplier values including name, email, phone, address, status.
const supplierBodySchema = z.object({
  name: textNoNumbersSchema("Supplier name", 120),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: phoneSchema,
  address: z.string().trim().min(5, "Address is required").max(250),
  status: z.enum(["active", "inactive"]).optional()
});

// Validate supplier values.
export const supplierSchema = z.object({
  body: supplierBodySchema
});

// Validate update supplier values while allowing omitted fields for updates.
export const updateSupplierSchema = z.object({
  params: idParamSchema.shape.params,
  body: supplierBodySchema.partial()
});

// Validate batch values.
export const batchSchema = z.object({
  body: batchBodySchema.refine(batchDateOrder, {
    path: ["expiryDate"],
    message: "Expiry date must be after manufacture date"
  })
});

// Validate update batch values including quantity while allowing omitted fields for updates.
export const updateBatchSchema = z.object({
  params: idParamSchema.shape.params,
  body: batchBodySchema.partial().extend({
    quantity: z.coerce.number().int("Quantity must be a whole number").min(0, "Quantity cannot be negative").max(100000).optional()
  }).refine((data) => {
    // Compare dates here only when both dates are included in this partial update.
    if (!data.manufactureDate || !data.expiryDate) return true;
    return data.expiryDate > data.manufactureDate;
  }, {
    path: ["expiryDate"],
    message: "Expiry date must be after manufacture date"
  })
});

// Validate purchase values including supplier id, medicine id, batch id, batch number, manufacture date.
export const purchaseSchema = z.object({
  body: z.object({
    supplierId: objectIdSchema,
    medicineId: objectIdSchema,
    batchId: objectIdSchema.optional(),
    batchNumber: z.string().trim().regex(batchNumberPattern, "Invalid batch number format").optional(),
    manufactureDate: z.coerce.date().refine(isPastOrToday, "Manufacture date cannot be in the future").optional(),
    expiryDate: z.coerce.date().refine(isFutureDate, "Expiry date must be in the future for newly received stock").optional(),
    quantity: quantitySchema(),
    purchasePrice: moneySchema("Purchase price")
  }).refine((data) => {
    // A purchase without an existing batch ID must include a number and correctly ordered batch dates.
    if (!data.batchId) {
      return Boolean(data.batchNumber && data.manufactureDate && data.expiryDate && data.expiryDate > data.manufactureDate);
    }
    return true;
  }, {
    message: "Select an existing batch or provide valid new batch details with expiry after manufacture date",
    path: ["batchId"]
  })
});

// Validate medicine return values including medicine id, batch id, quantity, return reason, return date.
const medicineReturnBodySchema = z.object({
  medicineId: objectIdSchema,
  batchId: objectIdSchema,
  quantity: quantitySchema(),
  returnReason: z.enum(["damaged", "expired", "incorrect"], {
    required_error: "Select return reason",
    invalid_type_error: "Select return reason"
  }),
  // Convert the submitted date and reject return dates before today.
  returnDate: z.coerce.date().refine(isTodayOrFuture, "Return date cannot be in the past")
});

// Validate medicine return values.
export const medicineReturnSchema = z.object({
  body: medicineReturnBodySchema
});

// Validate update medicine return values while allowing omitted fields for updates.
export const updateMedicineReturnSchema = z.object({
  params: idParamSchema.shape.params,
  body: medicineReturnBodySchema.partial()
});

// Validate sale values including prescription id, patient id, customer name, customer phone, items.
export const saleSchema = z.object({
  body: z.object({
    prescriptionId: objectIdSchema.optional(),
    patientId: objectIdSchema.optional(),
    customerName: z.string().trim().max(120).optional(),
    customerPhone: phoneSchema.optional(),
    items: z.array(z.object({
      medicineId: objectIdSchema,
      batchId: objectIdSchema,
      quantity: quantitySchema()
    })).min(1, "At least one item is required in the sale")
  // Require either a registered patient ID or both walk-in customer contact fields.
  }).refine((data) => data.patientId || (data.customerName && data.customerPhone), {
    path: ["customerPhone"],
    message: "Walk-in customer name and phone number are required"
  })
});

export { idParamSchema };
