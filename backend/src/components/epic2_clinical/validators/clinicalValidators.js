// Clinical Workspace | Backend Validation | Validate and normalize clinical request fields before business logic runs.
import { z } from "zod";
import { bloodPressurePattern } from "../../../shared/validators/fieldSchemas.js";
import { idParamSchema, objectIdSchema } from "../../../shared/validators/commonSchemas.js";

// View Appointment Slots | Backend Validation | Validate slot query values including doctor id, date.
export const slotQuerySchema = z.object({
  query: z.object({
    doctorId: objectIdSchema,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  })
});

// Book Appointment | Backend Validation | Validate appointment values including patient id, doctor id, appointment date, slot label, reason.
export const appointmentSchema = z.object({
  body: z.object({
    patientId: objectIdSchema.optional(),
    doctorId: objectIdSchema,
    appointmentDate: z.coerce.date().refine((date) => date >= new Date(Date.now() - 86400000), "Appointment date cannot be in the past"),
    slotLabel: z.string().trim().min(2).max(40),
    reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(300)
  })
});

// Update Appointment Status | Backend Validation | Validate appointment status values.
export const appointmentStatusSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({ status: z.enum(["checked_in", "in_consultation", "completed", "cancelled"]) })
});

// Reschedule Appointment | Backend Validation | Validate appointment reschedule values including appointment date, slot label.
export const appointmentRescheduleSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({
    appointmentDate: z.coerce.date().refine((date) => date > new Date(), "Appointment date must be in the future"),
    slotLabel: z.string().trim().min(2).max(40)
  })
});

// Record Vitals | Backend Validation | Validate vitals values including appointment id, patient id, temperature, blood pressure, heart rate.
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

// Save Consultation | Backend Validation | Validate consultation values including appointment id, patient id, doctor id, diagnosis, clinical notes.
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

// Create Prescription | Backend Validation | Validate prescription values including appointment id, patient id, doctor id, items, medicine name.
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

// Create Lab Request | Backend Validation | Validate lab request values including appointment id, patient id, doctor id, test name, priority.
export const labRequestSchema = z.object({
  body: z.object({
    appointmentId: objectIdSchema,
    patientId: objectIdSchema.optional(),
    doctorId: objectIdSchema.optional(),
    testName: z.string().trim().min(2, "Test name is required").max(120),
    priority: z.enum(["routine", "urgent"]).optional().default("routine")
  })
});

// Update Lab Report | Backend Validation | Validate lab update values including status, result summary, result url, parameters, parameter.
export const labUpdateSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({
    status: z.enum(["verified", "in_progress", "completed", "cancelled"]),
    resultSummary: z.string().trim().max(1000).optional().or(z.literal("")),
    resultUrl: z.string().trim().url("Enter a valid report URL").optional().or(z.literal("")),
    parameters: z.array(z.object({
      parameter: z.string().trim().min(1, "Parameter name is required").max(120),
      value: z.string().trim().min(1, "Observed value is required").max(120),
      unit: z.string().trim().max(60).optional(),
      referenceRange: z.string().trim().max(120).optional(),
      flag: z.string().trim().max(40).optional()
    })).optional(),
    specimenType: z.string().trim().max(80).optional(),
    sampleCollectedAt: z.coerce.date().optional(),
    reportedAt: z.coerce.date().optional()
  }).refine((data) => {
    if (data.status === "completed" && (!data.resultSummary || data.resultSummary.trim().length < 3)) {
      return false;
    }
    return true;
  }, {
    path: ["resultSummary"],
    message: "Result summary is required when marking lab test as completed"
  }).refine((data) => {
    if (data.status === "completed" && (!data.parameters || data.parameters.length === 0)) {
      return false;
    }
    return true;
  }, {
    path: ["parameters"],
    message: "At least one analyte with parameter name and observed value is required for completed results"
  })
});
