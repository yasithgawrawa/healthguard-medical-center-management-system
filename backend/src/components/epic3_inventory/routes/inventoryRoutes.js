import { Router } from "express";
import { ROLES } from "../../../shared/constants/roles.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticate, authorizeRoles } from "../../../shared/middleware/auth.js";
import { validateRequest } from "../../../shared/middleware/validateRequest.js";
import { idParamSchema } from "../../../shared/validators/commonSchemas.js";
import {
  batchCrud,
  createPharmacySale,
  downloadSaleBill,
  inventoryAlerts,
  listBatches,
  pharmacySalesReport,
  listPharmacySales,
  listPurchases,
  medicineCrud,
  recordPurchase,
  supplierCrud
} from "../controllers/inventoryController.js";
import { batchSchema, medicineSchema, purchaseSchema, saleSchema, supplierSchema, updateBatchSchema, updateMedicineSchema } from "../validators/inventoryValidators.js";

const router = Router();
router.use(authenticate, authorizeRoles(ROLES.PHARMACIST, ROLES.MANAGER, ROLES.ADMIN));

router.get("/alerts", asyncHandler(inventoryAlerts));
router.get("/reports/sales", asyncHandler(pharmacySalesReport));
router.post("/medicines", validateRequest(medicineSchema), asyncHandler(medicineCrud.create));
router.get("/medicines", asyncHandler(medicineCrud.list));
router.patch("/medicines/:id", validateRequest(updateMedicineSchema), asyncHandler(medicineCrud.update));
router.delete("/medicines/:id", validateRequest(idParamSchema), asyncHandler(medicineCrud.remove));
router.post("/suppliers", validateRequest(supplierSchema), asyncHandler(supplierCrud.create));
router.get("/suppliers", asyncHandler(supplierCrud.list));
router.patch("/suppliers/:id", validateRequest(idParamSchema), asyncHandler(supplierCrud.update));
router.delete("/suppliers/:id", validateRequest(idParamSchema), asyncHandler(supplierCrud.remove));
router.post("/batches", validateRequest(batchSchema), asyncHandler(batchCrud.create));
router.get("/batches", asyncHandler(listBatches));
router.patch("/batches/:id", validateRequest(updateBatchSchema), asyncHandler(batchCrud.update));
router.post("/purchases", validateRequest(purchaseSchema), asyncHandler(recordPurchase));
router.get("/purchases", asyncHandler(listPurchases));
router.post("/sales", validateRequest(saleSchema), asyncHandler(createPharmacySale));
router.get("/sales", asyncHandler(listPharmacySales));
router.get("/sales/:id/bill", validateRequest(idParamSchema), asyncHandler(downloadSaleBill));

export default router;
