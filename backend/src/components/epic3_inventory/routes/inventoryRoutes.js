import { Router } from "express";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import {
  createBatch,
  createMedicine,
  createPharmacySale,
  createSupplier,
  deleteMedicine,
  deleteSupplier,
  downloadSaleBill,
  getSaleDetails,
  inventoryAlerts,
  listActivePrescriptions,
  listBatches,
  listMedicines,
  listPatients,
  listPharmacySales,
  listPurchases,
  listSuppliers,
  pharmacySalesReport,
  recordPurchase,
  updateBatch,
  updateMedicine,
  updateSupplier
} from "../controllers/inventoryController.js";
import {
  batchSchema,
  medicineSchema,
  purchaseSchema,
  saleSchema,
  supplierSchema,
  updateBatchSchema,
  updateMedicineSchema,
  updateSupplierSchema
} from "../validators/inventoryValidators.js";

const router = Router();
router.use(authenticate);

// Overview & Helper data (Pharmacist, Manager, Admin)
router.get("/alerts", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(inventoryAlerts));
router.get("/reports/sales", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(pharmacySalesReport));
router.get("/patients", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listPatients));
router.get("/prescriptions", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listActivePrescriptions));

// Medicines: Read by Pharmacist, Manager, Admin; Modifiable only by Pharmacist & Admin (E3-US01, E3-US06, E3-US09)
router.get("/medicines", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listMedicines));
router.post("/medicines", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(medicineSchema), asyncHandler(createMedicine));
router.patch("/medicines/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(updateMedicineSchema), asyncHandler(updateMedicine));
router.delete("/medicines/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(deleteMedicine));

// Batches: Read by Pharmacist, Manager, Admin; Managed only by Pharmacist & Admin (E3-US02, E3-US07, E3-US08)
router.get("/batches", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listBatches));
router.post("/batches", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(batchSchema), asyncHandler(createBatch));
router.patch("/batches/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(updateBatchSchema), asyncHandler(updateBatch));

// Suppliers: Read by Pharmacist, Manager, Admin; Managed only by Pharmacist & Admin (E3-US10)
router.get("/suppliers", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listSuppliers));
router.post("/suppliers", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(supplierSchema), asyncHandler(createSupplier));
router.patch("/suppliers/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(updateSupplierSchema), asyncHandler(updateSupplier));
router.delete("/suppliers/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(deleteSupplier));

// Purchases: Procurement recorded only by Pharmacist & Admin (E3-US11)
router.get("/purchases", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listPurchases));
router.post("/purchases", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(purchaseSchema), asyncHandler(recordPurchase));

// Sales / POS: Dispensing & bill generation by Pharmacist & Admin (E3-US16, E3-US17)
router.get("/sales", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), asyncHandler(listPharmacySales));
router.post("/sales", authorizeRoles(ROLES.PHARMACIST, ROLES.ADMIN), validateRequest(saleSchema), asyncHandler(createPharmacySale));
router.get("/sales/:id", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(getSaleDetails));
router.get("/sales/:id/bill", authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN), validateRequest(idParamSchema), asyncHandler(downloadSaleBill));

export default router;
