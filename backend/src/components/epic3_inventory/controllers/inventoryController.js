import { MedicineBatch } from "../models/MedicineBatch.js";
import { Medicine } from "../models/Medicine.js";
import { PharmacySale } from "../models/PharmacySale.js";
import { Purchase } from "../models/Purchase.js";
import { Supplier } from "../models/Supplier.js";
import { createCrudController } from "../../../shared/utils/crudController.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";
import { AppError } from "../../../shared/utils/AppError.js";

export const medicineCrud = createCrudController(Medicine, "Medicine", { softDelete: { status: "inactive" } });
export const supplierCrud = createCrudController(Supplier, "Supplier", { softDelete: { status: "inactive" } });
export const batchCrud = createCrudController(MedicineBatch, "Medicine batch");

export const listBatches = async (req, res) => {
  const batches = await MedicineBatch.find()
    .populate("medicineId", "name category unit")
    .sort({ expiryDate: 1, createdAt: -1 });
  return successResponse(res, "Medicine batch list loaded", batches);
};

export const recordPurchase = async (req, res) => {
  const batch = await MedicineBatch.findById(req.body.batchId);
  if (!batch) throw new AppError("Medicine batch not found", 404);
  if (batch.medicineId.toString() !== req.body.medicineId) throw new AppError("Batch does not belong to selected medicine", 400);

  batch.quantity += req.body.quantity;
  await batch.save();
  const purchase = await Purchase.create(req.body);
  return successResponse(res, "Purchase recorded and stock updated", purchase, 201);
};

export const listPurchases = async (req, res) => {
  const purchases = await Purchase.find()
    .populate("supplierId", "name")
    .populate("medicineId", "name")
    .populate("batchId", "batchNumber")
    .sort({ purchasedAt: -1 });
  return successResponse(res, "Purchase list loaded", purchases);
};

export const createPharmacySale = async (req, res) => {
  const saleItems = [];
  let total = 0;

  for (const item of req.body.items) {
    const medicine = await Medicine.findById(item.medicineId);
    const batch = await MedicineBatch.findById(item.batchId);
    if (!medicine || medicine.status !== "active") throw new AppError("Active medicine not found", 404);
    if (!batch || batch.medicineId.toString() !== medicine._id.toString()) throw new AppError("Valid medicine batch not found", 404);
    if (batch.expiryDate <= new Date()) throw new AppError("Expired batch cannot be sold", 400);
    if (batch.quantity < item.quantity) throw new AppError("Insufficient batch stock", 409);

    const lineTotal = medicine.price * item.quantity;
    batch.quantity -= item.quantity;
    await batch.save();
    total += lineTotal;
    saleItems.push({ ...item, unitPrice: medicine.price, lineTotal });
  }

  const sale = await PharmacySale.create({
    prescriptionId: req.body.prescriptionId,
    patientId: req.body.patientId,
    soldBy: req.user._id,
    items: saleItems,
    total
  });

  return successResponse(res, "Pharmacy sale completed and stock deducted", sale, 201);
};

export const listPharmacySales = async (req, res) => {
  const sales = await PharmacySale.find()
    .populate("patientId", "firstName lastName email")
    .populate("items.medicineId", "name")
    .sort({ createdAt: -1 });
  return successResponse(res, "Pharmacy sale list loaded", sales);
};

export const inventoryAlerts = async (req, res) => {
  const medicines = await Medicine.find({ status: "active" });
  const batches = await MedicineBatch.find().populate("medicineId", "name category unit");
  const stockByMedicine = batches.reduce((acc, batch) => {
    const key = batch.medicineId.toString();
    acc[key] = (acc[key] || 0) + batch.quantity;
    return acc;
  }, {});
  const lowStock = medicines.filter((medicine) => (stockByMedicine[medicine._id.toString()] || 0) <= medicine.reorderLevel);
  const expiresBefore = new Date(Date.now() + 30 * 86400000);
  const expiring = batches.filter((batch) => batch.expiryDate <= expiresBefore);
  return successResponse(res, "Inventory alerts loaded", { lowStock, expiring });
};

export const pharmacySalesReport = async (req, res) => {
  const sales = await PharmacySale.find().populate("items.medicineId", "name").sort({ createdAt: -1 });
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const itemTotals = new Map();
  for (const sale of sales) {
    for (const item of sale.items) {
      const key = item.medicineId?._id?.toString() || item.medicineId?.toString();
      const current = itemTotals.get(key) || {
        medicine: item.medicineId?.name || "Medicine",
        quantity: 0,
        revenue: 0
      };
      current.quantity += item.quantity;
      current.revenue += item.lineTotal;
      itemTotals.set(key, current);
    }
  }
  const topMedicines = [...itemTotals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  return successResponse(res, "Pharmacy sales report loaded", {
    totalSales: sales.length,
    totalRevenue,
    topMedicines
  });
};
