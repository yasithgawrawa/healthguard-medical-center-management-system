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
  listMyAnnouncements,
  updateAnnouncement
} from "../controllers/announcementController.js";
import { STAFF_NOTICE_ROLES } from "../models/StaffAnnouncement.js";
import { announcementSchema, updateAnnouncementSchema } from "../validators/epic1Validators.js";

const router = Router();
router.use(authenticate);

router.get("/my", authorizeRoles(...STAFF_NOTICE_ROLES), asyncHandler(listMyAnnouncements));

router.use(authorizeRoles(ROLES.ADMIN));
router.get("/", asyncHandler(listAnnouncements));
router.post("/", validateRequest(announcementSchema), asyncHandler(createAnnouncement));
router.get("/:id", validateRequest(idParamSchema), asyncHandler(getAnnouncementDetails));
router.patch("/:id", validateRequest(updateAnnouncementSchema), asyncHandler(updateAnnouncement));
router.delete("/:id", validateRequest(idParamSchema), asyncHandler(deleteAnnouncement));

export default router;
