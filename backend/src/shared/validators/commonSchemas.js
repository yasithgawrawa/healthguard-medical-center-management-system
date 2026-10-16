// Shared Field Validation | Backend Validation | Share MongoDB ID and date validators across request schemas.
import { z } from "zod";

// Shared Field Validation | Backend Validation | Validate object id values.
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

// Shared Field Validation | Backend Validation | Validate id param values.
export const idParamSchema = z.object({
  params: z.object({ id: objectIdSchema })
});

// Shared Field Validation | Backend Validation | Validate optional date values.
export const optionalDateSchema = z.coerce.date().optional();
// Shared Field Validation | Backend Validation | Validate required date values.
export const requiredDateSchema = z.coerce.date();
