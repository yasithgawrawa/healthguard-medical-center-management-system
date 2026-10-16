// Staff Management | Route | Register staff endpoints with authentication, role checks, validation, and controllers.
import { Router } from "express";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import { createQuickPatient, createStaff, listStaff, updateStaff } from "../controllers/staffController.js";
import { createStaffSchema, quickPatientSchema, updateStaffSchema } from "../validators/epic1Validators.js";

const router = Router();
// Authenticate requests before they reach the following routes.
router.use(authenticate);

// Add Walk-in Patient | Route | POST /patients: run create quick patient after role and request validation.
router.post("/patients", authorizeRoles(ROLES.ADMIN, ROLES.NURSE), validateRequest(quickPatientSchema), asyncHandler(createQuickPatient));

// Apply the shared middleware to the routes registered below.
router.use(authorizeRoles(ROLES.ADMIN));
// Add Staff | Route | POST /: run create staff after role and request validation.
router.post("/", validateRequest(createStaffSchema), asyncHandler(createStaff));
// View Staff | Route | GET /: run list staff.
router.get("/", asyncHandler(listStaff));
// Update Staff | Route | PATCH /:id: run update staff after role and request validation.
router.patch("/:id", validateRequest(updateStaffSchema), asyncHandler(updateStaff));
// Deactivate Staff | Route | DELETE /:id: handle this endpoint after role and request validation.
router.delete("/:id", validateRequest(idParamSchema), asyncHandler((req, res) => updateStaff({ ...req, body: { status: "inactive" } }, res)));
export default router;
