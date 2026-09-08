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
    .string()
    .trim()
    .min(2, `${label} is required`)
    .max(60, `${label} is too long`)
    .regex(namePattern, `${label} can only contain letters, spaces, apostrophes, periods or hyphens`);

export const requiredTextNoNumbers = (label, max = 120) =>
  z
    .string()
    .trim()
    .min(2, `${label} is required`)
    .max(max, `${label} is too long`)
    .regex(textNoNumbersPattern, `${label} cannot contain numbers`);

export const optionalText = (label, max = 500) =>
  z.string().trim().max(max, `${label} is too long`).optional().or(z.literal(""));

export const requiredPhone = z
  .string()
  .trim()
  .min(9, "Phone number is required")
  .max(20, "Phone number is too long")
  .regex(phonePattern, "Enter a valid Sri Lankan phone number");

export const requiredEmployeeId = z
  .string()
  .trim()
  .min(2, "Employee ID is required")
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
  z.string().min(1, `${label} is required`).refine((value) => new Date(value) > new Date(), `${label} must be in the future`);

export const requiredPastDate = (label) =>
  z.string().min(1, `${label} is required`).refine((value) => new Date(value) <= new Date(), `${label} cannot be in the future`);
