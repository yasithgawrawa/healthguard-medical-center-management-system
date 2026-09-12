import { Router } from "express";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import {
  appointmentSchema,
  appointmentStatusSchema,
  consultationSchema,
  labRequestSchema,
  labUpdateSchema,
  slotQuerySchema,
  prescriptionSchema,
  vitalsSchema
} from "../validators/clinicalValidators.js";
import {
  createAppointment,
  cancelAppointment,
  createLabRequest,
  createPrescription,
  listAppointmentSlots,
  listAppointments,
  listDoctors,
  listLabRequests,
  listNotifications,
  listPrescriptions,
  markNotificationRead,
  recordVitals,
  saveConsultation,
  updateAppointmentStatus,
  updateLabRequest
} from "../controllers/clinicalController.js";

const router = Router();
router.use(authenticate);

router.post("/appointments", authorizeRoles(ROLES.PATIENT, ROLES.ADMIN, ROLES.NURSE), validateRequest(appointmentSchema), asyncHandler(createAppointment));
router.get("/appointments/slots", authorizeRoles(ROLES.PATIENT, ROLES.ADMIN, ROLES.NURSE), validateRequest(slotQuerySchema), asyncHandler(listAppointmentSlots));
router.get("/appointments", asyncHandler(listAppointments));
router.get("/doctors", authorizeRoles(ROLES.PATIENT, ROLES.ADMIN, ROLES.NURSE), asyncHandler(listDoctors));
router.get("/notifications", authorizeRoles(ROLES.PATIENT), asyncHandler(listNotifications));
router.patch("/notifications/:id/read", authorizeRoles(ROLES.PATIENT), validateRequest(idParamSchema), asyncHandler(markNotificationRead));
router.patch("/appointments/:id/cancel", authorizeRoles(ROLES.PATIENT, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(cancelAppointment));
router.patch("/appointments/:id/status", authorizeRoles(ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN), validateRequest(appointmentStatusSchema), asyncHandler(updateAppointmentStatus));
router.post("/vitals", authorizeRoles(ROLES.NURSE, ROLES.DOCTOR), validateRequest(vitalsSchema), asyncHandler(recordVitals));
router.post("/consultations", authorizeRoles(ROLES.DOCTOR), validateRequest(consultationSchema), asyncHandler(saveConsultation));
router.post("/prescriptions", authorizeRoles(ROLES.DOCTOR, ROLES.PHARMACIST), validateRequest(prescriptionSchema), asyncHandler(createPrescription));
router.get("/prescriptions", authorizeRoles(ROLES.DOCTOR, ROLES.PHARMACIST, ROLES.PATIENT), asyncHandler(listPrescriptions));
router.post("/lab-requests", authorizeRoles(ROLES.DOCTOR), validateRequest(labRequestSchema), asyncHandler(createLabRequest));
router.get("/lab-requests", authorizeRoles(ROLES.DOCTOR, ROLES.LAB_ASSISTANT, ROLES.PATIENT), asyncHandler(listLabRequests));
router.patch("/lab-requests/:id", authorizeRoles(ROLES.LAB_ASSISTANT), validateRequest(labUpdateSchema), asyncHandler(updateLabRequest));

export default router;
