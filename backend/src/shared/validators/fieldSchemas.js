// Share reusable field validators and input patterns across backend request schemas.
import { z } from "zod";

export const namePattern = /^[A-Za-z][A-Za-z .'-]*$/;
export const textNoNumbersPattern = /^[A-Za-z][A-Za-z .,&'/-]*$/;
export const phonePattern = /^(?:\+94|0)?[0-9\s-]{9,12}$/;
export const employeeIdPattern = /^[A-Z0-9][A-Z0-9/-]*$/i;
export const batchNumberPattern = /^[A-Z0-9][A-Z0-9-]*$/i;
export const bloodPressurePattern = /^\d{2,3}\/\d{2,3}$/;

// Build a reusable trimmed-name validator with character and length checks.
export const nameSchema = (label = "Name") =>
  z
    .string()
    .trim()
    .min(2, `${label} is required`)
    .max(60, `${label} is too long`)
    .regex(namePattern, `${label} can only contain letters, spaces, apostrophes, periods or hyphens`);

// Build a required text validator that rejects digits and enforces length limits.
export const textNoNumbersSchema = (label, max = 120) =>
  z
    .string()
    .trim()
    .min(2, `${label} is required`)
    .max(max, `${label} is too long`)
    .regex(textNoNumbersPattern, `${label} cannot contain numbers`);

// Validate phone values.
export const phoneSchema = z
  .string({ required_error: "Phone number is required", invalid_type_error: "Phone number is required" })
  .trim()
  .min(1, "Phone number is required")
  .refine((val) => {
    const cleaned = String(val || "").replace(/[\s\-().]/g, "");
    return /^(?:\+94|0)?[1-9]\d{8}$/.test(cleaned);
  }, "Enter a valid phone number, e.g. 0712175244");

// Validate employee id values.
export const employeeIdSchema = z
  .string()
  .trim()
  .min(2, "Employee ID is required")
  .max(30, "Employee ID is too long")
  .regex(employeeIdPattern, "Employee ID can only contain letters, numbers, hyphens or slashes");

// Coerce a currency amount and require a value from zero to 10,000,000.
export const moneySchema = (label) =>
  z.coerce.number({ invalid_type_error: `${label} is required` }).min(0, `${label} cannot be negative`).max(10000000, `${label} is too high`);

// Build a reusable validator for a positive bounded whole-number quantity.
export const quantitySchema = (label = "Quantity") =>
  z.coerce.number({ invalid_type_error: `${label} is required` }).int(`${label} must be a whole number`).min(1, `${label} must be at least 1`).max(100000, `${label} is too high`);
