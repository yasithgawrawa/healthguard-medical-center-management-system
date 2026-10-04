import { Router } from "express";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import { createQuickPatient, createStaff, listPatients, listStaff, updateStaff } from "../controllers/staffController.js";
import { createStaffSchema, patientSearchSchema, quickPatientSchema, updateStaffSchema } from "../validators/epic1Validators.js";

const router = Router();
router.use(authenticate);

router.get("/patients", authorizeRoles(ROLES.ADMIN, ROLES.NURSE), validateRequest(patientSearchSchema), asyncHandler(listPatients));
router.post("/patients", authorizeRoles(ROLES.ADMIN, ROLES.NURSE), validateRequest(quickPatientSchema), asyncHandler(createQuickPatient));

router.use(authorizeRoles(ROLES.ADMIN));
router.post("/", validateRequest(createStaffSchema), asyncHandler(createStaff));
router.get("/", asyncHandler(listStaff));
router.patch("/:id", validateRequest(updateStaffSchema), asyncHandler(updateStaff));
router.delete("/:id", validateRequest(idParamSchema), asyncHandler((req, res) => updateStaff({ ...req, body: { status: "inactive" } }, res)));
export default router;
