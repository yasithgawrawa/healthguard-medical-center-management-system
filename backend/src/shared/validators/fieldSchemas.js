import { z } from "zod";

export const namePattern = /^[A-Za-z][A-Za-z .'-]*$/;
export const textNoNumbersPattern = /^[A-Za-z][A-Za-z .,&'/-]*$/;
export const phonePattern = /^(?:\+94|0)?[0-9\s-]{9,12}$/;
export const employeeIdPattern = /^[A-Z0-9][A-Z0-9/-]*$/i;
export const batchNumberPattern = /^[A-Z0-9][A-Z0-9-]*$/i;
export const bloodPressurePattern = /^\d{2,3}\/\d{2,3}$/;

export const nameSchema = (label = "Name") =>
  z
    .string()
    .trim()
    .min(2, `${label} is required`)
    .max(60, `${label} is too long`)
    .regex(namePattern, `${label} can only contain letters, spaces, apostrophes, periods or hyphens`);

export const textNoNumbersSchema = (label, max = 120) =>
  z
    .string()
    .trim()
    .min(2, `${label} is required`)
    .max(max, `${label} is too long`)
    .regex(textNoNumbersPattern, `${label} cannot contain numbers`);

export const phoneSchema = z
  .string()
  .trim()
  .min(9, "Phone number is required")
  .max(20, "Phone number is too long")
  .regex(phonePattern, "Enter a valid Sri Lankan phone number");

export const employeeIdSchema = z
  .string()
  .trim()
  .min(2, "Employee ID is required")
  .max(30, "Employee ID is too long")
  .regex(employeeIdPattern, "Employee ID can only contain letters, numbers, hyphens or slashes");

export const moneySchema = (label) =>
  z.coerce.number({ invalid_type_error: `${label} is required` }).min(0, `${label} cannot be negative`).max(10000000, `${label} is too high`);

export const quantitySchema = (label = "Quantity") =>
  z.coerce.number({ invalid_type_error: `${label} is required` }).int(`${label} must be a whole number`).min(1, `${label} must be at least 1`).max(100000, `${label} is too high`);
