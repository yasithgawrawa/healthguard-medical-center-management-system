import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

const phoneSchema = z
  .string()
  .min(7, "Phone number is too short")
  .max(20, "Phone number is too long")
  .regex(/^[0-9+\-\s()]+$/, "Phone number contains invalid characters");

export const registerPatientSchema = z.object({
  body: z
    .object({
      firstName: z.string().trim().min(2).max(60),
      lastName: z.string().trim().min(2).max(60),
      email: z.string().trim().email().toLowerCase(),
      phone: phoneSchema,
      address: z.string().trim().max(250).optional().default(""),
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
