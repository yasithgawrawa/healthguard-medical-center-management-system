import { Router } from "express";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import {
  createInvoice,
  createPayroll,
  listInvoices,
  listPayments,
  listPayroll,
  recordPayment,
  revenueSummary,
  updatePaymentStatus,
  updatePayrollStatus
} from "../controllers/billingController.js";
import { invoiceSchema, paymentSchema, paymentStatusSchema, payrollSchema, payrollStatusSchema } from "../validators/billingValidators.js";

const router = Router();
router.use(authenticate);

router.get("/summary", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(revenueSummary));
router.post("/invoices", authorizeRoles(ROLES.CASHIER, ROLES.ADMIN), validateRequest(invoiceSchema), asyncHandler(createInvoice));
router.get("/invoices", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.PATIENT, ROLES.ADMIN), asyncHandler(listInvoices));
router.post("/payments", authorizeRoles(ROLES.CASHIER, ROLES.ADMIN), validateRequest(paymentSchema), asyncHandler(recordPayment));
router.get("/payments", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listPayments));
router.patch("/payments/:id/status", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER), validateRequest(paymentStatusSchema), asyncHandler(updatePaymentStatus));
router.post("/payroll", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN), validateRequest(payrollSchema), asyncHandler(createPayroll));
router.get("/payroll", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listPayroll));
router.patch("/payroll/:id/status", authorizeRoles(ROLES.MANAGER), validateRequest(payrollStatusSchema), asyncHandler(updatePayrollStatus));

export default router;
