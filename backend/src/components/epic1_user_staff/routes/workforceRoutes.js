import { Router } from "express";
import { z } from "zod";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import {
  attendanceCheckInSchema,
  leaveSchema,
  reviewLeaveSchema,
  shiftSchema
} from "../validators/epic1Validators.js";
import {
  checkIn,
  checkOut,
  createLeave,
  createShift,
  listAttendance,
  listLeave,
  listShifts,
  reviewLeave,
  updateShiftStatus
} from "../controllers/workforceController.js";

const router = Router();
router.use(authenticate);

router.post("/shifts", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(shiftSchema), asyncHandler(createShift));
router.get("/shifts", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), asyncHandler(listShifts));
router.patch(
  "/shifts/:id/status",
  authorizeRoles(ROLES.ADMIN, ROLES.MANAGER),
  validateRequest(z.object({ params: idParamSchema.shape.params, body: z.object({ status: z.enum(["scheduled", "cancelled", "completed"]) }) })),
  asyncHandler(updateShiftStatus)
);

router.post("/attendance/check-in", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(attendanceCheckInSchema), asyncHandler(checkIn));
router.patch("/attendance/:id/check-out", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(idParamSchema), asyncHandler(checkOut));
router.get("/attendance", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), asyncHandler(listAttendance));

router.post("/leave", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(leaveSchema), asyncHandler(createLeave));
router.get("/leave", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), asyncHandler(listLeave));
router.patch("/leave/:id/review", authorizeRoles(ROLES.MANAGER), validateRequest(reviewLeaveSchema), asyncHandler(reviewLeave));

export default router;
