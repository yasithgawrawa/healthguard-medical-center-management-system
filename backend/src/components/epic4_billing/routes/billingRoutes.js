import { Router } from "express";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import {
  createInvoice,
  createPayroll,
  downloadInvoiceReceipt,
  downloadPayslip,
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
router.get("/invoices/:id/receipt", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.PATIENT, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(downloadInvoiceReceipt));
router.post("/payments", authorizeRoles(ROLES.CASHIER, ROLES.ADMIN), validateRequest(paymentSchema), asyncHandler(recordPayment));
router.get("/payments", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listPayments));
router.patch("/payments/:id/status", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER), validateRequest(paymentStatusSchema), asyncHandler(updatePaymentStatus));
router.post("/payroll", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN), validateRequest(payrollSchema), asyncHandler(createPayroll));
router.get("/payroll", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), asyncHandler(listPayroll));
router.get("/payroll/:id/payslip", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), validateRequest(idParamSchema), asyncHandler(downloadPayslip));
router.patch("/payroll/:id/status", authorizeRoles(ROLES.MANAGER), validateRequest(payrollStatusSchema), asyncHandler(updatePayrollStatus));

export default router;
