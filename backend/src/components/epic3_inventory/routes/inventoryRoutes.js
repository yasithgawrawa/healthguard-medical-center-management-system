// Inventory Workspace | Route | Register inventory endpoints with authentication, role checks, validation, and controllers.
import { Router } from "express";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import {
  createBatch,
  createMedicine,
  createMedicineReturn,
  createPharmacySale,
  createSupplier,
  deleteMedicine,
  deleteMedicineReturn,
  deleteSupplier,
  downloadSaleBill,
  completeMedicineReturn,
  getMedicineReturnDetails,
  getSaleDetails,
  inventoryAlerts,
  listActivePrescriptions,
  listBatches,
  listMedicines,
  listMedicineReturns,
  listPatients,
  listPharmacySales,
  listPurchases,
  listSuppliers,
  pharmacySalesReport,
  recordPurchase,
  updateBatch,
  updateMedicine,
  updateMedicineReturn,
  updateSupplier
} from "../controllers/inventoryController.js";
import {
  batchSchema,
  medicineReturnSchema,
  medicineSchema,
  purchaseSchema,
  saleSchema,
  supplierSchema,
  updateBatchSchema,
  updateMedicineReturnSchema,
  updateMedicineSchema,
  updateSupplierSchema
} from "../validators/inventoryValidators.js";

const router = Router();
// Authenticate requests before they reach the following routes.
router.use(authenticate);

// Overview & Helper data (Pharmacist, Manager, Admin)
// View Inventory Alerts | Route | GET /alerts: run inventory alerts after role authorization.
router.get("/alerts", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(inventoryAlerts));
// View Pharmacy Sales Report | Route | GET /reports/sales: run pharmacy sales report after role authorization.
router.get("/reports/sales", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(pharmacySalesReport));
// View Pharmacy Patients | Route | GET /patients: run list patients after role authorization.
router.get("/patients", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listPatients));
// View Active Prescriptions | Route | GET /prescriptions: run list active prescriptions after role authorization.
router.get("/prescriptions", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listActivePrescriptions));

// Medicines: Read by Pharmacist, Manager, Admin; Modifiable only by Pharmacist & Admin (E3-US01, E3-US06, E3-US09)
// View Medicines | Route | GET /medicines: run list medicines after role authorization.
router.get("/medicines", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listMedicines));
// Add New Medicine | Route | POST /medicines: run create medicine after role and request validation.
router.post("/medicines", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(medicineSchema), asyncHandler(createMedicine));
// Update Medicine | Route | PATCH /medicines/:id: run update medicine after role and request validation.
router.patch("/medicines/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(updateMedicineSchema), asyncHandler(updateMedicine));
// Delete Medicine | Route | DELETE /medicines/:id: run delete medicine after role and request validation.
router.delete("/medicines/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(deleteMedicine));

// Batches: Read by Pharmacist, Manager, Admin; Managed only by Pharmacist & Admin (E3-US02, E3-US07, E3-US08)
// View Medicine Batches | Route | GET /batches: run list batches after role authorization.
router.get("/batches", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listBatches));
// Add Medicine Batch | Route | POST /batches: run create batch after role and request validation.
router.post("/batches", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(batchSchema), asyncHandler(createBatch));
// Update Medicine Batch | Route | PATCH /batches/:id: run update batch after role and request validation.
router.patch("/batches/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(updateBatchSchema), asyncHandler(updateBatch));

// Suppliers: Read by Pharmacist, Manager, Admin; Managed only by Pharmacist & Admin (E3-US10)
// View Suppliers | Route | GET /suppliers: run list suppliers after role authorization.
router.get("/suppliers", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listSuppliers));
// Add Supplier | Route | POST /suppliers: run create supplier after role and request validation.
router.post("/suppliers", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(supplierSchema), asyncHandler(createSupplier));
// Update Supplier | Route | PATCH /suppliers/:id: run update supplier after role and request validation.
router.patch("/suppliers/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(updateSupplierSchema), asyncHandler(updateSupplier));
// Deactivate Supplier | Route | DELETE /suppliers/:id: run delete supplier after role and request validation.
router.delete("/suppliers/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(deleteSupplier));

// Purchases: Procurement recorded only by Pharmacist & Admin (E3-US11)
// View Medicine Purchases | Route | GET /purchases: run list purchases after role authorization.
router.get("/purchases", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listPurchases));
// Record Medicine Purchase | Route | POST /purchases: run record purchase after role and request validation.
router.post("/purchases", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(purchaseSchema), asyncHandler(recordPurchase));

// Medicine Returns: Drafts do not affect stock; completion deducts stock once
// View Medicine Returns | Route | GET /returns: run list medicine returns after role authorization.
router.get("/returns", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listMedicineReturns));
// Create Medicine Return Draft | Route | POST /returns: run create medicine return after role and request validation.
router.post("/returns", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(medicineReturnSchema), asyncHandler(createMedicineReturn));
// View Medicine Return Details | Route | GET /returns/:id: run get medicine return details after role and request validation.
router.get("/returns/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(getMedicineReturnDetails));
// Update Medicine Return Draft | Route | PATCH /returns/:id: run update medicine return after role and request validation.
router.patch("/returns/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(updateMedicineReturnSchema), asyncHandler(updateMedicineReturn));
// Delete Medicine Return Draft | Route | DELETE /returns/:id: run delete medicine return after role and request validation.
router.delete("/returns/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(deleteMedicineReturn));
// Complete Medicine Return | Route | PATCH /returns/:id/complete: run complete medicine return after role and request validation.
router.patch("/returns/:id/complete", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(completeMedicineReturn));

// Sales / POS: Dispensing & bill generation by Pharmacist & Admin (E3-US16, E3-US17)
// View Pharmacy Sales | Route | GET /sales: run list pharmacy sales after role authorization.
router.get("/sales", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listPharmacySales));
// Record Pharmacy Sale | Route | POST /sales: run create pharmacy sale after role and request validation.
router.post("/sales", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(saleSchema), asyncHandler(createPharmacySale));
// View Pharmacy Sale Details | Route | GET /sales/:id: run get sale details after role and request validation.
router.get("/sales/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(getSaleDetails));
// Download Pharmacy Bill | Route | GET /sales/:id/bill: run download sale bill after role and request validation.
router.get("/sales/:id/bill", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(downloadSaleBill));

export default router;
