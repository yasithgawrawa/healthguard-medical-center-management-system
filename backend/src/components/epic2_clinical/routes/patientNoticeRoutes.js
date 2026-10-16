// Patient Notifications | Route | Register patient notice endpoints with authentication, role checks, validation, and controllers.
import { Router } from "express";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import { ROLES } from "../../../shared/constants/roles.js";
import { createPatientNoticeSchema, updatePatientNoticeSchema, patientSearchSchema } from "../validators/patientNoticeValidators.js";
import * as controller from "../controllers/patientNoticeController.js";
const router = Router();
// Authenticate requests before they reach the following routes.
router.use(authenticate);
// View Patient Notifications | Route | GET /mine: run list patient after role authorization.
router.get("/mine", authorizeRoles(ROLES.PATIENT), asyncHandler(controller.listPatient));
// Mark Notification Read | Route | PATCH /:id/read: run mark read after role and request validation.
router.patch("/:id/read", authorizeRoles(ROLES.PATIENT), validateRequest(idParamSchema), asyncHandler(controller.markRead));
// Apply the shared middleware to the routes registered below.
router.use(authorizeRoles(ROLES.MANAGER));
// Search Patients | Route | GET /patients: run patients after role and request validation.
router.get("/patients", validateRequest(patientSearchSchema), asyncHandler(controller.patients));
// View Managed Notifications | Route | GET /: run list owned.
router.get("/", asyncHandler(controller.listOwned));
// Create Patient Notification | Route | POST /: run create after role and request validation.
router.post("/", validateRequest(createPatientNoticeSchema), asyncHandler(controller.create));
// Update Patient Notification | Route | PATCH /:id: run update after role and request validation.
router.patch("/:id", validateRequest(updatePatientNoticeSchema), asyncHandler(controller.update));
// Delete Patient Notification | Route | DELETE /:id: run remove after role and request validation.
router.delete("/:id", validateRequest(idParamSchema), asyncHandler(controller.remove));
export default router;
