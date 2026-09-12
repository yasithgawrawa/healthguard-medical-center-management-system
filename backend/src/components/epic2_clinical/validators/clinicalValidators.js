import { z } from "zod";
import { bloodPressurePattern } from "../../../shared/validators/fieldSchemas.js";
import { idParamSchema, objectIdSchema } from "../../../shared/validators/commonSchemas.js";

export const slotQuerySchema = z.object({
  query: z.object({
    doctorId: objectIdSchema,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  })
});

export const appointmentSchema = z.object({
  body: z.object({
    patientId: objectIdSchema.optional(),
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
    patientId: objectIdSchema.optional(),
    temperature: z.coerce.number().min(25).max(45).optional(),
    bloodPressure: z.string().trim().regex(bloodPressurePattern, "Use format like 120/80").optional().or(z.literal("")),
    heartRate: z.coerce.number().min(20).max(250).optional(),
    weight: z.coerce.number().min(0).optional(),
    height: z.coerce.number().min(0).optional(),
    spo2: z.coerce.number().min(0).max(100).optional()
  })
});

export const consultationSchema = z.object({
  body: z.object({
    appointmentId: objectIdSchema,
    patientId: objectIdSchema.optional(),
    doctorId: objectIdSchema.optional(),
    diagnosis: z.string().trim().min(2, "Diagnosis is required").max(120),
    clinicalNotes: z.string().trim().min(3, "Clinical notes are required").max(1000),
    chiefComplaints: z.string().trim().max(300).optional().or(z.literal("")),
    examinationFindings: z.string().trim().max(500).optional().or(z.literal("")),
    secondaryDiagnosis: z.string().trim().max(150).optional().or(z.literal("")),
    severity: z.enum(["mild", "moderate", "severe", "chronic", "routine"]).optional(),
    patientAdvice: z.string().trim().max(500).optional().or(z.literal("")),
    followUpPlan: z.string().trim().max(100).optional().or(z.literal("")),
    handwrittenPrescriptionIssued: z.boolean().optional(),
    finalized: z.boolean().optional().default(false)
  })
});

export const prescriptionSchema = z.object({
  body: z.object({
    appointmentId: objectIdSchema,
    patientId: objectIdSchema.optional(),
    doctorId: objectIdSchema.optional(),
    items: z.array(z.object({
      medicineName: z.string().trim().min(2, "Medicine is required").max(120),
      dosage: z.string().trim().min(1, "Dosage is required").max(40),
      frequency: z.string().trim().min(1, "Frequency is required").max(60),
      duration: z.string().trim().min(1, "Duration is required").max(40),
      instructions: z.string().trim().max(250).optional().default("")
    })).min(1)
  })
});

export const labRequestSchema = z.object({
  body: z.object({
    appointmentId: objectIdSchema,
    patientId: objectIdSchema.optional(),
    doctorId: objectIdSchema.optional(),
    testName: z.string().trim().min(2, "Test name is required").max(120),
    priority: z.enum(["routine", "urgent"]).optional().default("routine")
  })
});

export const labUpdateSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({
    status: z.enum(["verified", "in_progress", "completed", "cancelled"]),
    resultSummary: z.string().trim().max(500).optional(),
    resultUrl: z.string().trim().url("Enter a valid report URL").optional().or(z.literal(""))
  }).refine((data) => {
    if (data.status === "completed" && (!data.resultSummary || data.resultSummary.trim().length < 3)) {
      return false;
    }
    return true;
  }, {
    path: ["resultSummary"],
    message: "Result summary is required when marking lab test as completed"
  })
});
