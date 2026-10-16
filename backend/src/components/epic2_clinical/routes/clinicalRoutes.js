// Clinical Workspace | Route | Register clinical endpoints with authentication, role checks, validation, and controllers.
import { Router } from "express";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import {
  appointmentSchema,
  appointmentRescheduleSchema,
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
  listLabTestCatalog,
  createLabTestCatalog,
  updateLabTestPrice,
  updateDoctorFee,
  listNotifications,
  listPrescriptions,
  markNotificationRead,
  recordVitals,
  rescheduleAppointment,
  saveConsultation,
  updateAppointmentStatus,
  updateLabRequest
} from "../controllers/clinicalController.js";

const router = Router();
// Authenticate requests before they reach the following routes.
router.use(authenticate);

// Book Appointment | Route | POST /appointments: run create appointment after role and request validation.
router.post("/appointments", authorizeRoles(ROLES.PATIENT, ROLES.ADMIN, ROLES.NURSE), validateRequest(appointmentSchema), asyncHandler(createAppointment));
// View Appointment Slots | Route | GET /appointments/slots: run list appointment slots after role and request validation.
router.get("/appointments/slots", authorizeRoles(ROLES.PATIENT, ROLES.ADMIN, ROLES.NURSE), validateRequest(slotQuerySchema), asyncHandler(listAppointmentSlots));
// View Appointments | Route | GET /appointments: run list appointments.
router.get("/appointments", asyncHandler(listAppointments));
// View Doctors | Route | GET /doctors: run list doctors after role authorization.
router.get("/doctors", authorizeRoles(ROLES.PATIENT, ROLES.ADMIN, ROLES.NURSE, ROLES.DOCTOR, ROLES.MANAGER), asyncHandler(listDoctors));
// Update Doctor Fee | Route | PATCH /doctors/fee: run update doctor fee after role authorization.
router.patch("/doctors/fee", authorizeRoles(ROLES.DOCTOR, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(updateDoctorFee));
// View Patient Notifications | Route | GET /notifications: run list notifications after role authorization.
router.get("/notifications", authorizeRoles(ROLES.PATIENT), asyncHandler(listNotifications));
// Mark Notification Read | Route | PATCH /notifications/:id/read: run mark notification read after role and request validation.
router.patch("/notifications/:id/read", authorizeRoles(ROLES.PATIENT), validateRequest(idParamSchema), asyncHandler(markNotificationRead));
// Cancel Appointment | Route | PATCH /appointments/:id/cancel: run cancel appointment after role and request validation.
router.patch("/appointments/:id/cancel", authorizeRoles(ROLES.PATIENT, ROLES.ADMIN, ROLES.NURSE), validateRequest(idParamSchema), asyncHandler(cancelAppointment));
// Reschedule Appointment | Route | PATCH /appointments/:id/reschedule: run reschedule appointment after role and request validation.
router.patch("/appointments/:id/reschedule", authorizeRoles(ROLES.PATIENT, ROLES.ADMIN, ROLES.NURSE), validateRequest(appointmentRescheduleSchema), asyncHandler(rescheduleAppointment));
// Update Appointment Status | Route | PATCH /appointments/:id/status: run update appointment status after role and request validation.
router.patch("/appointments/:id/status", authorizeRoles(ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN), validateRequest(appointmentStatusSchema), asyncHandler(updateAppointmentStatus));
// Record Vitals | Route | POST /vitals: run record vitals after role and request validation.
router.post("/vitals", authorizeRoles(ROLES.NURSE, ROLES.DOCTOR), validateRequest(vitalsSchema), asyncHandler(recordVitals));
// Save Consultation | Route | POST /consultations: run save consultation after role and request validation.
router.post("/consultations", authorizeRoles(ROLES.DOCTOR), validateRequest(consultationSchema), asyncHandler(saveConsultation));
// Create Prescription | Route | POST /prescriptions: run create prescription after role and request validation.
router.post("/prescriptions", authorizeRoles(ROLES.DOCTOR, ROLES.PHARMACIST), validateRequest(prescriptionSchema), asyncHandler(createPrescription));
// View Prescriptions | Route | GET /prescriptions: run list prescriptions after role authorization.
router.get("/prescriptions", authorizeRoles(ROLES.DOCTOR, ROLES.PHARMACIST, ROLES.PATIENT), asyncHandler(listPrescriptions));
// Create Lab Request | Route | POST /lab-requests: run create lab request after role and request validation.
router.post("/lab-requests", authorizeRoles(ROLES.DOCTOR), validateRequest(labRequestSchema), asyncHandler(createLabRequest));
// View Lab Requests | Route | GET /lab-requests: run list lab requests after role authorization.
router.get("/lab-requests", authorizeRoles(ROLES.DOCTOR, ROLES.LAB_ASSISTANT, ROLES.PATIENT), asyncHandler(listLabRequests));
// Update Lab Report | Route | PATCH /lab-requests/:id: run update lab request after role and request validation.
router.patch("/lab-requests/:id", authorizeRoles(ROLES.LAB_ASSISTANT), validateRequest(labUpdateSchema), asyncHandler(updateLabRequest));
// View Lab Tests | Route | GET /lab-tests: run list lab test catalog.
router.get("/lab-tests", asyncHandler(listLabTestCatalog));
// Add Lab Test | Route | POST /lab-tests: run create lab test catalog after role authorization.
router.post("/lab-tests", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN), asyncHandler(createLabTestCatalog));
// Update Lab Test Price | Route | PATCH /lab-tests/:id: run update lab test price after role authorization.
router.patch("/lab-tests/:id", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN), asyncHandler(updateLabTestPrice));

export default router;
