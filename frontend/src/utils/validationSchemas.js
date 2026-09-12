import { z } from "zod";

export const namePattern = /^[A-Za-z][A-Za-z .'-]*$/;
export const textNoNumbersPattern = /^[A-Za-z][A-Za-z .,&'/-]*$/;
export const phonePattern = /^(?:\+94|0)?[0-9\s-]{9,12}$/;
export const employeeIdPattern = /^[A-Z0-9][A-Z0-9/-]*$/i;
export const batchNumberPattern = /^[A-Z0-9][A-Z0-9-]*$/i;
export const bloodPressurePattern = /^\d{2,3}\/\d{2,3}$/;

export const stripDigits = (value) => String(value || "").replace(/[0-9]/g, "");
export const stripNonPhone = (value) => String(value || "").replace(/[^0-9+\-\s()]/g, "");
export const stripNonId = (value) => String(value || "").replace(/[^A-Za-z0-9/-]/g, "").toUpperCase();
export const stripNonBatch = (value) => String(value || "").replace(/[^A-Za-z0-9-]/g, "").toUpperCase();

export const requiredName = (label = "Name") =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .min(2, `${label} must be at least 2 characters`)
    .max(60, `${label} is too long`)
    .regex(namePattern, `${label} can only contain letters, spaces, apostrophes, periods or hyphens`);

export const requiredTextNoNumbers = (label, max = 120) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .min(2, `${label} must be at least 2 characters`)
    .max(max, `${label} is too long`)
    .regex(textNoNumbersPattern, `${label} cannot contain numbers`);

export const optionalText = (label, max = 500) =>
  z.string().trim().max(max, `${label} is too long`).optional().or(z.literal(""));

export const requiredPhone = z
  .string({ required_error: "Phone number is required", invalid_type_error: "Phone number is required" })
  .trim()
  .min(1, "Phone number is required")
  .refine((val) => {
    const cleaned = String(val || "").replace(/[\s\-().]/g, "");
    return /^(?:\+94|0)?[1-9]\d{8}$/.test(cleaned);
  }, "Enter a valid Sri Lankan phone number (e.g. +94 77 123 4567 or 077 123 4567)");

export const requiredEmployeeId = z
  .string({ required_error: "Employee ID is required", invalid_type_error: "Employee ID is required" })
  .trim()
  .min(1, "Employee ID is required")
  .min(2, "Employee ID must be at least 2 characters")
  .max(30, "Employee ID is too long")
  .regex(employeeIdPattern, "Employee ID can only contain letters, numbers, hyphens or slashes");

export const requiredMoney = (label) =>
  z.coerce.number({ invalid_type_error: `${label} is required` }).min(0, `${label} cannot be negative`).max(10000000, `${label} is too high`);

export const requiredQuantity = (label = "Quantity") =>
  z.coerce.number({ invalid_type_error: `${label} is required` }).int(`${label} must be a whole number`).min(1, `${label} must be at least 1`).max(100000, `${label} is too high`);

export const optionalVitalsNumber = (label, min, max) =>
  z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : Number(value)),
    z.number({ invalid_type_error: `${label} must be a number` }).min(min, `${label} is too low`).max(max, `${label} is too high`).optional()
  );

export const requiredFutureDateTime = (label) =>
  z
    .string({ required_error: `${label} is required` })
    .min(1, `${label} is required`)
    .refine((value) => new Date(value) > new Date(), `${label} must be in the future`);

export const requiredPastDate = (label = "Date of birth") =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .refine((val) => {
      const selected = new Date(val);
      if (isNaN(selected.getTime())) return false;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return selected <= today;
    }, `${label} cannot be in the future`)
    .refine((val) => {
      const selected = new Date(val);
      if (isNaN(selected.getTime())) return false;
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 120);
      return selected >= minDate;
    }, `Please enter a valid ${label.toLowerCase()} (within the last 120 years)`);
