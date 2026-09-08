import { Router } from "express";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import { createStaff, listStaff, updateStaff } from "../controllers/staffController.js";
import { createStaffSchema, updateStaffSchema } from "../validators/epic1Validators.js";

const router = Router();
router.use(authenticate, authorizeRoles(ROLES.ADMIN));
router.post("/", validateRequest(createStaffSchema), asyncHandler(createStaff));
router.get("/", asyncHandler(listStaff));
router.patch("/:id", validateRequest(updateStaffSchema), asyncHandler(updateStaff));
router.delete("/:id", validateRequest(idParamSchema), asyncHandler((req, res) => updateStaff({ ...req, body: { status: "inactive" } }, res)));
export default router;
