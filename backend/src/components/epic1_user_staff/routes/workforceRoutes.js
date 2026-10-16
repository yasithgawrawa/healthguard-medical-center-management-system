// Workforce Management | Route | Register workforce endpoints with authentication, role checks, validation, and controllers.
import { Router } from "express";
import { z } from "zod";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import {
  attendanceCheckInSchema,
  bulkShiftSchema,
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
  createBulkShifts,
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
// Authenticate requests before they reach the following routes.
router.use(authenticate);

// Request Leave | Backend Validation | Validate my leave values including leave type, start date, end date, reason.
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

// View Clinic Location | Route | GET /center-location: run get center location after role authorization.
router.get("/center-location", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), asyncHandler(getCenterLocation));
// Set Clinic Location | Route | PATCH /center-location: run update center location after role and request validation.
router.patch("/center-location", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(centerLocationSchema), asyncHandler(updateCenterLocation));
// View Staff | Route | GET /staff: run list workforce staff after role authorization.
router.get("/staff", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER), asyncHandler(listWorkforceStaff));
// Create Bulk Shifts | Route | POST /shifts/bulk: run create bulk shifts after role and request validation.
router.post("/shifts/bulk", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(bulkShiftSchema), asyncHandler(createBulkShifts));
// Create Shift | Route | POST /shifts: run create shift after role and request validation.
router.post("/shifts", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(shiftSchema), asyncHandler(createShift));
// View Shifts | Route | GET /shifts: run list shifts after role authorization.
router.get("/shifts", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), asyncHandler(listShifts));
// View My Shifts | Route | GET /shifts/my: run list my shifts after role authorization.
router.get("/shifts/my", authorizeRoles(ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), asyncHandler(listMyShifts));
// Update Shift Status | Route | PATCH /shifts/:id/status: run update shift status after role and request validation.
router.patch(
  "/shifts/:id/status",
  authorizeRoles(ROLES.ADMIN, ROLES.MANAGER),
  validateRequest(z.object({ params: idParamSchema.shape.params, body: z.object({ status: z.enum(["scheduled", "cancelled", "completed"]) }) })),
  asyncHandler(updateShiftStatus)
);

// Attendance Check In | Route | POST /attendance/my/check-in: run check in self after role and request validation.
router.post("/attendance/my/check-in", authorizeRoles(ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), validateRequest(z.object({ body: z.object({
  notes: z.string().trim().max(250).optional().default("")
}) })), asyncHandler(checkInSelf));
// Attendance Check Out | Route | PATCH /attendance/my/check-out: run check out self after role authorization.
router.patch("/attendance/my/check-out", authorizeRoles(ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), asyncHandler(checkOutSelf));
// View My Attendance | Route | GET /attendance/my: run list my attendance after role authorization.
router.get("/attendance/my", authorizeRoles(ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), asyncHandler(listMyAttendance));
// Attendance Check In | Route | POST /attendance/check-in: run check in after role and request validation.
router.post("/attendance/check-in", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(attendanceCheckInSchema), asyncHandler(checkIn));
// Attendance Check Out | Route | PATCH /attendance/:id/check-out: run check out after role and request validation.
router.patch("/attendance/:id/check-out", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(idParamSchema), asyncHandler(checkOut));
// View Attendance | Route | GET /attendance: run list attendance after role authorization.
router.get("/attendance", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), asyncHandler(listAttendance));

// Request Leave | Route | POST /leave: run create leave after role and request validation.
router.post("/leave", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateRequest(leaveSchema), asyncHandler(createLeave));
// View Leave Requests | Route | GET /leave: run list leave after role authorization.
router.get("/leave", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), asyncHandler(listLeave));
// Request Leave | Route | POST /leave/my: run create my leave after role and request validation.
router.post("/leave/my", authorizeRoles(ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), validateRequest(myLeaveSchema), asyncHandler(createMyLeave));
// View My Leave | Route | GET /leave/my: run list my leave after role authorization.
router.get("/leave/my", authorizeRoles(ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), asyncHandler(listMyLeave));
// Review Leave | Route | PATCH /leave/:id/review: run review leave after role and request validation.
router.patch("/leave/:id/review", authorizeRoles(ROLES.MANAGER), validateRequest(reviewLeaveSchema), asyncHandler(reviewLeave));

export default router;
