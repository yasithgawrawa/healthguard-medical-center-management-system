// Share MongoDB ID and date validators across request schemas.
import { z } from "zod";

// Validate object id values.
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

// Validate id param values.
export const idParamSchema = z.object({
  params: z.object({ id: objectIdSchema })
});

// Validate optional date values.
export const optionalDateSchema = z.coerce.date().optional();
// Validate required date values.
export const requiredDateSchema = z.coerce.date();
