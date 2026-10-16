// Patient Notifications | Backend Validation | Validate and normalize patient notice request fields before business logic runs.
import { z } from "zod";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";

// Patient Notifications | Backend Validation | Format today's calendar date in the Asia/Colombo timezone.
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
// Create Patient Notification | Backend Validation | Permit only an all-patient audience and reject individual patient IDs.
export const createPatientNoticeSchema = z.object({ body: z.object({
  ...fields, recipient: z.literal("all"), patientId: z.null().optional()
}).strict() });
// Update Patient Notification | Backend Validation | Validate update patient notice values while allowing omitted fields for updates.
export const updatePatientNoticeSchema = z.object({ params: idParamSchema.shape.params,
  body: z.object(fields).partial().strict().refine(data => Object.keys(data).length > 0, "Provide a field to update") });
// Search Patients | Backend Validation | Validate patient search values.
export const patientSearchSchema = z.object({ query: z.object({ search: z.string().trim().max(100).default("") }) });
// Create Patient Notification | Backend Validation | Convert a clinic expiry date to the final millisecond of that day in Sri Lanka.
// Update Patient Notification | Backend Validation | Convert a clinic expiry date to the final millisecond of that day in Sri Lanka.
export const expiryInstant = value => value ? new Date(`${value}T23:59:59.999+05:30`) : null;
