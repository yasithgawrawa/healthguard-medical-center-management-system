import { z } from "zod";
import { idParamSchema, objectIdSchema } from "../../../shared/validators/commonSchemas.js";

export const appointmentSchema = z.object({
  body: z.object({
    patientId: objectIdSchema,
    doctorId: objectIdSchema,
    appointmentDate: z.coerce.date().refine((date) => date >= new Date(Date.now() - 86400000), "Appointment date cannot be in the past"),
    slotLabel: z.string().trim().min(2).max(40),
    reason: z.string().trim().min(3).max(300)
  })
});

export const appointmentStatusSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({ status: z.enum(["checked_in", "in_consultation", "completed", "cancelled"]) })
});

export const vitalsSchema = z.object({
  body: z.object({
    appointmentId: objectIdSchema,
    patientId: objectIdSchema,
    temperature: z.coerce.number().min(25).max(45).optional(),
    bloodPressure: z.string().trim().optional(),
    heartRate: z.coerce.number().min(20).max(250).optional(),
    weight: z.coerce.number().min(0).optional(),
    height: z.coerce.number().min(0).optional(),
    spo2: z.coerce.number().min(0).max(100).optional()
  })
});

export const consultationSchema = z.object({
  body: z.object({
    appointmentId: objectIdSchema,
    patientId: objectIdSchema,
    doctorId: objectIdSchema,
    diagnosis: z.string().trim().min(2),
    clinicalNotes: z.string().trim().min(3),
    finalized: z.boolean().optional().default(false)
  })
});

export const prescriptionSchema = z.object({
  body: z.object({
    appointmentId: objectIdSchema,
    patientId: objectIdSchema,
    doctorId: objectIdSchema,
    items: z.array(z.object({
      medicineName: z.string().trim().min(2),
      dosage: z.string().trim().min(1),
      frequency: z.string().trim().min(1),
      duration: z.string().trim().min(1),
      instructions: z.string().trim().optional().default("")
    })).min(1)
  })
});

export const labRequestSchema = z.object({
  body: z.object({
    appointmentId: objectIdSchema,
    patientId: objectIdSchema,
    doctorId: objectIdSchema,
    testName: z.string().trim().min(2),
    priority: z.enum(["routine", "urgent"]).optional().default("routine")
  })
});

export const labUpdateSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({
    status: z.enum(["verified", "in_progress", "completed", "cancelled"]),
    resultSummary: z.string().trim().optional(),
    resultUrl: z.string().trim().optional()
  })
});
