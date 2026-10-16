import { z } from "zod";
import { objectIdSchema, idParamSchema } from "../../../shared/validators/commonSchemas.js";

export const clinicToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const expiryDate = z.union([z.literal(""), z.null(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")])
  .transform(value => value || null)
  .refine(value => !value || (!Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value), "Invalid expiry date")
  .refine(value => !value || value >= clinicToday(), "Expiry date cannot be in the past");
const fields = {
  title: z.string().trim().min(1, "Title is required").max(120),
  message: z.string().trim().min(1, "Message is required").max(1000),
  expiryDate: expiryDate.optional()
};
export const createPatientNoticeSchema = z.object({ body: z.object({
  ...fields, recipient: z.enum(["one", "all"]), patientId: objectIdSchema.nullable().optional()
}).strict().refine(data => data.recipient === "one" ? Boolean(data.patientId) : !data.patientId, { path: ["patientId"], message: "Select a patient only for One Patient" }) });
export const updatePatientNoticeSchema = z.object({ params: idParamSchema.shape.params,
  body: z.object(fields).partial().strict().refine(data => Object.keys(data).length > 0, "Provide a field to update") });
export const patientSearchSchema = z.object({ query: z.object({ search: z.string().trim().max(100).default("") }) });
export const expiryInstant = value => value ? new Date(`${value}T23:59:59.999+05:30`) : null;
