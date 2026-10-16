// Billing Workspace | Route | Register billing endpoints with authentication, role checks, validation, and controllers.
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
  getSalaryAttendanceDays,
  listInvoices,
  listPayments,
  listPayroll,
  listSupplierBills,
  paySupplierBill,
  previewPayroll,
  recordPayment,
  revenueSummary,
  updatePaymentStatus,
  updatePayrollStatus
} from "../controllers/billingController.js";
import { createExpense, deleteExpense, getExpenseDetails, listExpenses, updateExpense } from "../controllers/expenseController.js";
import { consolidateInvoiceSchema, invoiceSchema, paymentSchema, paymentStatusSchema, payrollPreviewSchema, payrollSchema, payrollStatusSchema, salaryAttendanceDaysSchema, supplierBillPaymentSchema } from "../validators/billingValidators.js";
import { createExpenseSchema, expenseListQuerySchema, updateExpenseSchema } from "../validators/expenseValidators.js";

const router = Router();
// Authenticate requests before they reach the following routes.
router.use(authenticate);

// View Revenue Summary | Route | GET /summary: run revenue summary after role authorization.
router.get("/summary", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN, ROLES.DOCTOR), asyncHandler(revenueSummary));
// View Doctor Earnings | Route | GET /doctor-earnings: run get doctor earnings after role authorization.
router.get("/doctor-earnings", authorizeRoles(ROLES.DOCTOR, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(getDoctorEarnings));
// Consolidate Patient Invoices | Route | POST /invoices/consolidate: run consolidate patient invoices after role and request validation.
router.post("/invoices/consolidate", authorizeRoles(ROLES.CASHIER, ROLES.ADMIN), validateRequest(consolidateInvoiceSchema), asyncHandler(consolidatePatientInvoices));
// Create Invoice | Route | POST /invoices: run create invoice after role and request validation.
router.post("/invoices", authorizeRoles(ROLES.CASHIER, ROLES.ADMIN), validateRequest(invoiceSchema), asyncHandler(createInvoice));
// View Invoices | Route | GET /invoices: run list invoices after role authorization.
router.get("/invoices", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.PATIENT, ROLES.ADMIN), asyncHandler(listInvoices));
// Download Invoice Receipt | Route | GET /invoices/:id/receipt: run download invoice receipt after role and request validation.
router.get("/invoices/:id/receipt", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.PATIENT, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(downloadInvoiceReceipt));
// Record Payment | Route | POST /payments: run record payment after role and request validation.
router.post("/payments", authorizeRoles(ROLES.CASHIER, ROLES.ADMIN), validateRequest(paymentSchema), asyncHandler(recordPayment));
// View Payments | Route | GET /payments: run list payments after role authorization.
router.get("/payments", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listPayments));
// Update Payment Status | Route | PATCH /payments/:id/status: run update payment status after role and request validation.
router.patch("/payments/:id/status", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER), validateRequest(paymentStatusSchema), asyncHandler(updatePaymentStatus));
// View Supplier Bills | Route | GET /supplier-bills: run list supplier bills after role authorization.
router.get("/supplier-bills", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listSupplierBills));
// Pay Supplier Bill | Route | PATCH /supplier-bills/:id/pay: run pay supplier bill after role and request validation.
router.patch("/supplier-bills/:id/pay", authorizeRoles(ROLES.CASHIER, ROLES.ADMIN), validateRequest(supplierBillPaymentSchema), asyncHandler(paySupplierBill));
// View Expenses | Route | GET /expenses: run list expenses after role and request validation.
router.get("/expenses", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN), validateRequest(expenseListQuerySchema), asyncHandler(listExpenses));
// Create Expense | Route | POST /expenses: run create expense after role and request validation.
router.post("/expenses", authorizeRoles(ROLES.CASHIER), validateRequest(createExpenseSchema), asyncHandler(createExpense));
// View Expense Details | Route | GET /expenses/:id: run get expense details after role and request validation.
router.get("/expenses/:id", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(getExpenseDetails));
// Update Expense | Route | PATCH /expenses/:id: run update expense after role and request validation.
router.patch("/expenses/:id", authorizeRoles(ROLES.CASHIER), validateRequest(updateExpenseSchema), asyncHandler(updateExpense));
// Delete Expense | Route | DELETE /expenses/:id: run delete expense after role and request validation.
router.delete("/expenses/:id", authorizeRoles(ROLES.CASHIER), validateRequest(idParamSchema), asyncHandler(deleteExpense));
// Preview Salary | Route | POST /payroll/preview: run preview payroll after role and request validation.
router.post("/payroll/preview", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN), validateRequest(payrollPreviewSchema), asyncHandler(previewPayroll));
// Create Salary Draft | Route | POST /payroll: run create payroll after role and request validation.
router.post("/payroll", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN), validateRequest(payrollSchema), asyncHandler(createPayroll));
// View Salary Attendance Days | Route | GET /payroll/attendance-days: run get salary attendance days after role and request validation.
router.get("/payroll/attendance-days", authorizeRoles(ROLES.CASHIER, ROLES.MANAGER, ROLES.ADMIN), validateRequest(salaryAttendanceDaysSchema), asyncHandler(getSalaryAttendanceDays));
// View Salaries | Route | GET /payroll: run list payroll after role authorization.
router.get("/payroll", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), asyncHandler(listPayroll));
// Download Payslip | Route | GET /payroll/:id/payslip: run download payslip after role and request validation.
router.get("/payroll/:id/payslip", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST, ROLES.CASHIER, ROLES.LAB_ASSISTANT), validateRequest(idParamSchema), asyncHandler(downloadPayslip));
// Update Salary Status | Route | PATCH /payroll/:id/status: run update payroll status after role and request validation.
router.patch("/payroll/:id/status", authorizeRoles(ROLES.MANAGER, ROLES.ADMIN, ROLES.CASHIER), validateRequest(payrollStatusSchema), asyncHandler(updatePayrollStatus));

export default router;
