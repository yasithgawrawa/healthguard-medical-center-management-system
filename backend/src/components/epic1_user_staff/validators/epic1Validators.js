import { z } from "zod";
import { ROLE_VALUES, ROLES } from "../../../shared/constants/roles.js";
import { employeeIdSchema, moneySchema, nameSchema, phoneSchema, textNoNumbersSchema } from "../../../shared/validators/fieldSchemas.js";
import { idParamSchema, objectIdSchema } from "../../../shared/validators/commonSchemas.js";

const staffRoleValues = ROLE_VALUES.filter((role) => role !== ROLES.PATIENT);
const passwordSchema = z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/);

export const createStaffSchema = z.object({
  body: z.object({
    firstName: nameSchema("First name"),
    lastName: nameSchema("Last name"),
    email: z.string().trim().email().toLowerCase(),
    phone: phoneSchema,
    address: z.string().trim().optional().default(""),
    employeeId: employeeIdSchema,
    department: textNoNumbersSchema("Department", 80),
    role: z.enum(staffRoleValues),
    employmentDate: z.coerce.date(),
    emergencyContact: z.string().trim().optional().default(""),
    baseSalary: moneySchema("Base salary").optional().default(0),
    allowances: moneySchema("Allowances").optional().default(0),
    deductions: moneySchema("Deductions").optional().default(0),
    password: passwordSchema
  })
});

export const updateStaffSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({
    firstName: nameSchema("First name").optional(),
    lastName: nameSchema("Last name").optional(),
    phone: phoneSchema.optional(),
    address: z.string().trim().optional(),
    department: textNoNumbersSchema("Department", 80).optional(),
    role: z.enum(staffRoleValues).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    emergencyContact: z.string().trim().optional(),
    baseSalary: moneySchema("Base salary").optional(),
    allowances: moneySchema("Allowances").optional(),
    deductions: moneySchema("Deductions").optional()
  })
});

export const shiftSchema = z.object({
  body: z.object({
    staffId: objectIdSchema,
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    location: z.string().trim().min(2, "Location is required").max(120),
    geoFence: z.object({
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180),
      radiusMeters: z.coerce.number().min(10).max(1000).default(100)
    }).optional(),
    notes: z.string().trim().max(250).optional().default("")
  }).refine((data) => data.endTime > data.startTime, {
    path: ["endTime"],
    message: "End time must be after start time"
  })
});

export const attendanceCheckInSchema = z.object({
  body: z.object({
    staffId: objectIdSchema,
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    accuracyMeters: z.coerce.number().min(0).optional(),
    notes: z.string().trim().max(250).optional().default("")
  })
});

export const leaveSchema = z.object({
  body: z.object({
    staffId: objectIdSchema,
    leaveType: z.enum(["annual", "sick", "casual", "unpaid"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().trim().min(3).max(500)
  }).refine((data) => data.endDate >= data.startDate, {
    path: ["endDate"],
    message: "End date must be on or after start date"
  })
});

export const reviewLeaveSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({
    status: z.enum(["approved", "rejected"]),
    reviewNote: z.string().trim().max(250).optional().default("")
  })
});

export const centerLocationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Center name is required").max(120),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    radiusMeters: z.coerce.number().min(10).max(1000)
  })
});
