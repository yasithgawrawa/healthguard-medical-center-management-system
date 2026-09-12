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
router.use(authenticate, authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN));

// Overview & Helper data
router.get("/alerts", asyncHandler(inventoryAlerts));
router.get("/reports/sales", asyncHandler(pharmacySalesReport));
router.get("/patients", asyncHandler(listPatients));
router.get("/prescriptions", asyncHandler(listActivePrescriptions));

// Medicines
router.get("/medicines", asyncHandler(listMedicines));
router.post("/medicines", validateRequest(medicineSchema), asyncHandler(createMedicine));
router.patch("/medicines/:id", validateRequest(updateMedicineSchema), asyncHandler(updateMedicine));
router.delete("/medicines/:id", validateRequest(idParamSchema), asyncHandler(deleteMedicine));

// Batches
router.get("/batches", asyncHandler(listBatches));
router.post("/batches", validateRequest(batchSchema), asyncHandler(createBatch));
router.patch("/batches/:id", validateRequest(updateBatchSchema), asyncHandler(updateBatch));

// Suppliers
router.get("/suppliers", asyncHandler(listSuppliers));
router.post("/suppliers", validateRequest(supplierSchema), asyncHandler(createSupplier));
router.patch("/suppliers/:id", validateRequest(updateSupplierSchema), asyncHandler(updateSupplier));
router.delete("/suppliers/:id", validateRequest(idParamSchema), asyncHandler(deleteSupplier));

// Purchases
router.get("/purchases", asyncHandler(listPurchases));
router.post("/purchases", validateRequest(purchaseSchema), asyncHandler(recordPurchase));

// Sales / POS
router.get("/sales", asyncHandler(listPharmacySales));
router.post("/sales", validateRequest(saleSchema), asyncHandler(createPharmacySale));
router.get("/sales/:id", validateRequest(idParamSchema), asyncHandler(getSaleDetails));
router.get("/sales/:id/bill", validateRequest(idParamSchema), asyncHandler(downloadSaleBill));

export default router;
