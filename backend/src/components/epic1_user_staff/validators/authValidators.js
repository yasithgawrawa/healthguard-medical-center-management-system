import { z } from "zod";
import { nameSchema, phoneSchema } from "../../../shared/validators/fieldSchemas.js";

const passwordSchema = z
  .string()
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
      email: z.string().trim().email().toLowerCase(),
      phone: phoneSchema,
      address: z.string().trim().min(5, "Address is required").max(250),
      dateOfBirth: z.coerce.date().refine((date) => date <= new Date(), {
        message: "Date of birth cannot be in the future"
      }),
      gender: z.enum(["female", "male", "other", "prefer_not_to_say"]),
      password: passwordSchema,
      confirmPassword: z.string()
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
