import { z } from "zod";
import { nameSchema, phoneSchema } from "../../../shared/validators/fieldSchemas.js";

const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

export const registerPatientSchema = z.object({
  body: z
    .object({
      firstName: nameSchema("First name"),
      lastName: nameSchema("Last name"),
      email: z
        .string({ required_error: "Email is required" })
        .trim()
        .min(1, "Email is required")
        .email("Enter a valid email address")
        .toLowerCase(),
      phone: phoneSchema,
      address: z
        .string({ required_error: "Address is required" })
        .trim()
        .min(5, "Address must be at least 5 characters")
        .max(250, "Address is too long"),
      dateOfBirth: z.preprocess((val) => {
        if (typeof val === "string" || val instanceof Date) return new Date(val);
        return val;
      }, z.date({ invalid_type_error: "Please enter a valid date of birth", required_error: "Date of birth is required" }).refine((date) => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date <= today;
      }, {
        message: "Date of birth cannot be in the future"
      })),
      gender: z.enum(["female", "male", "other", "prefer_not_to_say"], {
        errorMap: () => ({ message: "Please select a valid gender" })
      }),
      password: passwordSchema,
      confirmPassword: z.string({ required_error: "Confirm password is required" })
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: "Passwords do not match"
    })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1, "Password is required")
  })
});
