import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const idParamSchema = z.object({
  params: z.object({ id: objectIdSchema })
});

export const optionalDateSchema = z.coerce.date().optional();
export const requiredDateSchema = z.coerce.date();
