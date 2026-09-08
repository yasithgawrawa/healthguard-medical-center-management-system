import { Router } from "express";
import { z } from "zod";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import {
  attendanceCheckInSchema,
  centerLocationSchema,
  leaveSchema,
  reviewLeaveSchema,
  shiftSchema
} from "../validators/epic1Validators.js";
import {
  checkIn,
  checkInSelf,
  checkOut,
  checkOutSelf,
  createLeave,
  createMyLeave,
  createShift,
  getCenterLocation,
  listAttendance,
  listLeave,
  listMyAttendance,
  listMyLeave,
  listMyShifts,
  listShifts,
  listWorkforceStaff,
  reviewLeave,
  updateCenterLocation,
  updateShiftStatus
} from "../controllers/workforceController.js";

const router = Router();
router.use(authenticate);

const myLeaveSchema = z.object({
  body: z.object({
    leaveType: z.enum(["annual", "sick", "casual", "unpaid"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().trim().min(3).max(500)
  }).refine((data) => data.endDate >= data.startDate, {
    path: ["endDate"],
    message: "End date must be on or after start date"
  })
});

router.get("/center-location", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), asyncHandler(getCenterLocation));
router.patch("/center-location", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(centerLocationSchema), asyncHandler(updateCenterLocation));
router.get("/staff", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), asyncHandler(listWorkforceStaff));
router.post("/shifts", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(shiftSchema), asyncHandler(createShift));
router.get("/shifts", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), asyncHandler(listShifts));
router.get("/shifts/my", authorizeRoles(ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), asyncHandler(listMyShifts));
router.patch(
  "/shifts/:id/status",
  authorizeRoles(ROLES.ADMIN, ROLES.MANAGER),
  validateRequest(z.object({ params: idParamSchema.shape.params, body: z.object({ status: z.enum(["scheduled", "cancelled", "completed"]) }) })),
  asyncHandler(updateShiftStatus)
);

router.post("/attendance/my/check-in", authorizeRoles(ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), validateRequest(z.object({ body: z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  accuracyMeters: z.coerce.number().min(0).optional(),
  notes: z.string().trim().max(250).optional().default("")
}) })), asyncHandler(checkInSelf));
router.patch("/attendance/my/check-out", authorizeRoles(ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), asyncHandler(checkOutSelf));
router.get("/attendance/my", authorizeRoles(ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), asyncHandler(listMyAttendance));
router.post("/attendance/check-in", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(attendanceCheckInSchema), asyncHandler(checkIn));
router.patch("/attendance/:id/check-out", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(idParamSchema), asyncHandler(checkOut));
router.get("/attendance", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), asyncHandler(listAttendance));

router.post("/leave", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(leaveSchema), asyncHandler(createLeave));
router.get("/leave", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), asyncHandler(listLeave));
router.post("/leave/my", authorizeRoles(ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), validateRequest(myLeaveSchema), asyncHandler(createMyLeave));
router.get("/leave/my", authorizeRoles(ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), asyncHandler(listMyLeave));
router.patch("/leave/:id/review", authorizeRoles(ROLES.MANAGER), validateRequest(reviewLeaveSchema), asyncHandler(reviewLeave));

export default router;
