// Staff Announcements | Backend Validation | Validate and normalize announcement request fields before business logic runs.
import { z } from "zod";
import { ROLE_VALUES, ROLES } from "../../../shared/constants/roles.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";

const targetRoleValues = ["all", ...ROLE_VALUES.filter((role) => role !== ROLES.PATIENT)];

// Staff Announcements | Backend Validation | Validate optional date values.
const optionalDateSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional()
);

const announcementFields = {
  title: z.string({ required_error: "Title is required" })
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(120, "Title cannot exceed 120 characters"),
  message: z.string({ required_error: "Message is required" })
    .trim()
    .min(5, "Message must be at least 5 characters")
    .max(1000, "Message cannot exceed 1000 characters"),
  publishedDate: z.coerce.date({ required_error: "Published date is required" }),
  expiryDate: optionalDateSchema,
  targetRole: z.enum(targetRoleValues, { required_error: "Target role is required" })
};

// Staff Announcements | Backend Validation | Allow no expiry date or require expiry to be on or after publication.
const validDateRange = (data) => !data.expiryDate || !data.publishedDate || data.expiryDate >= data.publishedDate;

// Staff Announcements | Backend Validation | Represent the current Colombo calendar date as UTC midnight for date-only comparisons.
const clinicTodayStart = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
};

// Create Staff Announcement | Backend Validation | Validate create announcement values.
export const createAnnouncementSchema = z.object({
  body: z.object(announcementFields)
    .refine((data) => data.publishedDate >= clinicTodayStart(), {
      path: ["publishedDate"],
      message: "Published date cannot be in the past"
    })
    .refine((data) => !data.expiryDate || data.expiryDate >= clinicTodayStart(), {
      path: ["expiryDate"],
      message: "Expiry date cannot be in the past"
    })
    .refine(validDateRange, {
      path: ["expiryDate"],
      message: "Expiry date cannot be earlier than published date"
    })
});

// Update Staff Announcement | Backend Validation | Validate update announcement values including title, published date, expiry date, target role.
export const updateAnnouncementSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({
    title: announcementFields.title.optional(),
    message: announcementFields.message.optional(),
    publishedDate: announcementFields.publishedDate.optional(),
    expiryDate: optionalDateSchema.nullable().optional(),
    targetRole: announcementFields.targetRole.optional()
  })
    .refine((data) => Object.keys(data).length > 0, "Provide at least one field to update")
    .refine(validDateRange, {
      path: ["expiryDate"],
      message: "Expiry date cannot be earlier than published date"
    })
});
