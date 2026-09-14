import { Router } from "express";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import {
  consolidatePatientInvoices,
  createInvoice,
  createPayroll,
  downloadInvoiceReceipt,
  downloadPayslip,
  getDoctorEarnings,
  listInvoices,
  listPayments,
  listPayroll,
  previewPayroll,
  recordPayment,
  revenueSummary,
  updatePaymentStatus,
  updatePayrollStatus
} from "../controllers/billingController.js";
import { invoiceSchema, paymentSchema, paymentStatusSchema, payrollPreviewSchema, payrollSchema, payrollStatusSchema } from "../validators/billingValidators.js";

const router = Router();
router.use(authenticate);

router.get("/summary", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN, ROLES.DOCTOR), asyncHandler(revenueSummary));
router.get("/doctor-earnings", authorizeRoles(ROLES.DOCTOR, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(getDoctorEarnings));
router.post("/invoices/consolidate", authorizeRoles(ROLES.CASHIER, ROLES.ADMIN), asyncHandler(consolidatePatientInvoices));
router.post("/invoices", authorizeRoles(ROLES.CASHIER, ROLES.ADMIN), validateRequest(invoiceSchema), asyncHandler(createInvoice));
router.get("/invoices", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.PATIENT, ROLES.ADMIN), asyncHandler(listInvoices));
router.get("/invoices/:id/receipt", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.PATIENT, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(downloadInvoiceReceipt));
router.post("/payments", authorizeRoles(ROLES.CASHIER, ROLES.ADMIN), validateRequest(paymentSchema), asyncHandler(recordPayment));
router.get("/payments", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listPayments));
router.patch("/payments/:id/status", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER), validateRequest(paymentStatusSchema), asyncHandler(updatePaymentStatus));
router.post("/payroll/preview", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN, ROLES.CASHIER), validateRequest(payrollPreviewSchema), asyncHandler(previewPayroll));
router.post("/payroll", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN, ROLES.CASHIER), validateRequest(payrollSchema), asyncHandler(createPayroll));
router.get("/payroll", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), asyncHandler(listPayroll));
router.get("/payroll/:id/payslip", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), validateRequest(idParamSchema), asyncHandler(downloadPayslip));
router.patch("/payroll/:id/status", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN, ROLES.CASHIER), validateRequest(payrollStatusSchema), asyncHandler(updatePayrollStatus));

export default router;
