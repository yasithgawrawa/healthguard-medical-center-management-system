// Register announcement endpoints with authentication, role checks, validation, and controllers.
import { Router } from "express";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementDetails,
  listAnnouncements,
  listCurrentAnnouncements,
  updateAnnouncement
} from "../controllers/announcementController.js";
import { createAnnouncementSchema, updateAnnouncementSchema } from "../validators/announcementValidators.js";

const staffRoles = [
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.DOCTOR,
  ROLES.NURSE,
  ROLES.PHARMACIST,
  ROLES.CASHIER,
  ROLES.LAB_ASSISTANT
];

const router = Router();
// Authenticate requests before they reach the following routes.
router.use(authenticate);

// GET /current: run list current announcements after role authorization.
router.get("/current", authorizeRoles(...staffRoles), asyncHandler(listCurrentAnnouncements));

// Apply the shared middleware to the routes registered below.
router.use(authorizeRoles(ROLES.MANAGER));
// GET /: run list announcements.
router.get("/", asyncHandler(listAnnouncements));
// POST /: run create announcement after role and request validation.
router.post("/", validateRequest(createAnnouncementSchema), asyncHandler(createAnnouncement));
// GET /:id: run get announcement details after role and request validation.
router.get("/:id", validateRequest(idParamSchema), asyncHandler(getAnnouncementDetails));
// PATCH /:id: run update announcement after role and request validation.
router.patch("/:id", validateRequest(updateAnnouncementSchema), asyncHandler(updateAnnouncement));
// DELETE /:id: run delete announcement after role and request validation.
router.delete("/:id", validateRequest(idParamSchema), asyncHandler(deleteAnnouncement));

export default router;
