// Shared Application Support | Route | Register auth endpoints with authentication, role checks, validation, and controllers.
import { Router } from "express";
import { login, me, registerPatient } from "../controllers/authController.js";
import { authenticate } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { loginSchema, registerPatientSchema } from "../validators/authValidators.js";

const router = Router();

// Shared Application Support | Route | POST /register/patient: handle this endpoint after role and request validation.
router.post("/register/patient", validateRequest(registerPatientSchema), registerPatient);
// Shared Application Support | Route | POST /login: handle this endpoint after role and request validation.
router.post("/login", validateRequest(loginSchema), login);
// Shared Application Support | Route | GET /me: handle this endpoint.
router.get("/me", authenticate, me);

export default router;
