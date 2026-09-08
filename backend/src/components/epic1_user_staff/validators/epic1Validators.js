import { z } from "zod";
import { ROLE_VALUES, ROLES } from "../../../shared/constants/roles.js";
import { idParamSchema, objectIdSchema } from "../../../shared/validators/commonSchemas.js";

const staffRoleValues = ROLE_VALUES.filter((role) => role !== ROLES.PATIENT);
const passwordSchema = z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/);

export const createStaffSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(2).max(60),
    lastName: z.string().trim().min(2).max(60),
    email: z.string().trim().email().toLowerCase(),
    phone: z.string().trim().min(7).max(20),
    address: z.string().trim().optional().default(""),
    employeeId: z.string().trim().min(2).max(30),
    department: z.string().trim().min(2).max(80),
    role: z.enum(staffRoleValues),
    employmentDate: z.coerce.date(),
    emergencyContact: z.string().trim().optional().default(""),
    password: passwordSchema
  })
});

export const updateStaffSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({
    firstName: z.string().trim().min(2).max(60).optional(),
    lastName: z.string().trim().min(2).max(60).optional(),
    phone: z.string().trim().min(7).max(20).optional(),
    address: z.string().trim().optional(),
    department: z.string().trim().min(2).max(80).optional(),
    role: z.enum(staffRoleValues).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    emergencyContact: z.string().trim().optional()
  })
});

export const shiftSchema = z.object({
  body: z.object({
    staffId: objectIdSchema,
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    location: z.string().trim().min(2),
    notes: z.string().trim().max(250).optional().default("")
  }).refine((data) => data.endTime > data.startTime, {
    path: ["endTime"],
    message: "End time must be after start time"
  })
});

export const attendanceCheckInSchema = z.object({
  body: z.object({
    staffId: objectIdSchema,
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
