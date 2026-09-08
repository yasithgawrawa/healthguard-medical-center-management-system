import { Router } from "express";
import { login, me, registerPatient } from "../controllers/authController.js";
import { authenticate } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { loginSchema, registerPatientSchema } from "../validators/authValidators.js";

const router = Router();

router.post("/register/patient", validateRequest(registerPatientSchema), registerPatient);
router.post("/login", validateRequest(loginSchema), login);
router.get("/me", authenticate, me);

export default router;
