// Handle inventory HTTP requests and return consistent API responses.
import { inventoryService } from "../services/inventoryService.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";

// Medicines
// Return medicines and send the result using the shared API response format.
export const listMedicines = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  const medicines = await inventoryService.getMedicinesWithStock(filter);
  return successResponse(res, "Medicine catalog loaded", medicines);
};

// Create medicine and send the result using the shared API response format.
export const createMedicine = async (req, res) => {
  const medicine = await inventoryService.createMedicine(req.body);
  return successResponse(res, "Medicine created successfully", medicine, 201);
};

// Update medicine and send the result using the shared API response format.
export const updateMedicine = async (req, res) => {
  const medicine = await inventoryService.updateMedicine(req.params.id, req.body);
  return successResponse(res, "Medicine updated successfully", medicine);
};

// Delete medicine and send the result using the shared API response format.
export const deleteMedicine = async (req, res) => {
  const medicine = await inventoryService.deleteMedicine(req.params.id);
  return successResponse(res, "Medicine deleted successfully", medicine);
};

// Batches
// Return batches and send the result using the shared API response format.
export const listBatches = async (req, res) => {
  const batches = await inventoryService.getBatches();
  return successResponse(res, "Medicine batch list loaded", batches);
};

// Create batch and send the result using the shared API response format.
export const createBatch = async (req, res) => {
  const batch = await inventoryService.createBatch(req.body);
  return successResponse(res, "Medicine batch received and recorded", batch, 201);
};

// Update batch and send the result using the shared API response format.
export const updateBatch = async (req, res) => {
  const batch = await inventoryService.updateBatch(req.params.id, req.body);
  return successResponse(res, "Medicine batch updated successfully", batch);
};

// Suppliers
// Return suppliers and send the result using the shared API response format.
export const listSuppliers = async (req, res) => {
  const suppliers = await inventoryService.getSuppliers();
  return successResponse(res, "Supplier list loaded", suppliers);
};

// Create supplier and send the result using the shared API response format.
export const createSupplier = async (req, res) => {
  const supplier = await inventoryService.createSupplier(req.body);
  return successResponse(res, "Supplier created successfully", supplier, 201);
};

// Update supplier and send the result using the shared API response format.
export const updateSupplier = async (req, res) => {
  const supplier = await inventoryService.updateSupplier(req.params.id, req.body);
  return successResponse(res, "Supplier updated successfully", supplier);
};

// Deactivate the supplier through the service and return the retained supplier record.
export const deleteSupplier = async (req, res) => {
  const supplier = await inventoryService.deleteSupplier(req.params.id);
  return successResponse(res, "Supplier marked as inactive", supplier);
};

// Purchases
// Return purchases and send the result using the shared API response format.
export const listPurchases = async (req, res) => {
  const purchases = await inventoryService.getPurchases();
  return successResponse(res, "Purchase list loaded", purchases);
};

// Receive stock into an existing or new batch, record the purchase, and create a supplier bill.
export const recordPurchase = async (req, res) => {
  const purchase = await inventoryService.recordPurchase(req.body);
  return successResponse(res, "Purchase recorded and stock updated", purchase, 201);
};

// Medicine Returns
// Return medicine returns and send the result using the shared API response format.
export const listMedicineReturns = async (req, res) => {
  const returns = await inventoryService.getMedicineReturns();
  return successResponse(res, "Medicine return list loaded", returns);
};

// Load medicine return details and send the result using the shared API response format.
export const getMedicineReturnDetails = async (req, res) => {
  const medicineReturn = await inventoryService.getMedicineReturnById(req.params.id);
  return successResponse(res, "Medicine return details loaded", medicineReturn);
};

// Create a return draft with the authenticated creator; stock changes only on completion.
export const createMedicineReturn = async (req, res) => {
  const medicineReturn = await inventoryService.createMedicineReturnDraft(req.body, req.user._id);
  return successResponse(res, "Medicine return draft created", medicineReturn, 201);
};

// Update a draft medicine return using the validated route ID and form values.
export const updateMedicineReturn = async (req, res) => {
  const medicineReturn = await inventoryService.updateMedicineReturnDraft(req.params.id, req.body);
  return successResponse(res, "Medicine return draft updated", medicineReturn);
};

// Delete the selected draft medicine return without changing batch stock.
export const deleteMedicineReturn = async (req, res) => {
  const medicineReturn = await inventoryService.deleteMedicineReturnDraft(req.params.id);
  return successResponse(res, "Medicine return draft deleted", medicineReturn);
};

// Deduct available batch stock, complete a draft return, and restore stock if completion loses a race.
export const completeMedicineReturn = async (req, res) => {
  const medicineReturn = await inventoryService.completeMedicineReturn(req.params.id, req.user._id);
  return successResponse(res, "Medicine return completed and stock deducted", medicineReturn);
};

// Sales / POS
// Return pharmacy sales and send the result using the shared API response format.
export const listPharmacySales = async (req, res) => {
  const sales = await inventoryService.getSales();
  return successResponse(res, "Pharmacy sale list loaded", sales);
};

// Pass sale quantities and the authenticated dispenser ID to the stock and billing service.
export const createPharmacySale = async (req, res) => {
  const sale = await inventoryService.createSale({
    ...req.body,
    soldById: req.user._id
  });
  return successResponse(res, "Pharmacy sale completed and stock deducted", sale, 201);
};

// Load sale details and send the result using the shared API response format.
export const getSaleDetails = async (req, res) => {
  const sale = await inventoryService.getSaleById(req.params.id);
  return successResponse(res, "Pharmacy sale details loaded", sale);
};

// Send the selected pharmacy sale's text bill with attachment headers.
export const downloadSaleBill = async (req, res) => {
  const { saleNumber, content } = await inventoryService.getBillFile(req.params.id);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${saleNumber || "pharmacy-bill"}.txt"`);
  return res.send(content);
};

// Alerts & Reports
// Return calculated low-stock and expiry alerts from the inventory service.
export const inventoryAlerts = async (req, res) => {
  const alerts = await inventoryService.getAlerts();
  return successResponse(res, "Inventory alerts loaded", alerts);
};

// Return the pharmacy sales summary for the requested period or all sales.
export const pharmacySalesReport = async (req, res) => {
  const report = await inventoryService.getSalesReport(req.query.period || "all");
  return successResponse(res, "Pharmacy sales report loaded", report);
};

// Pharmacy Helpers
// Return patients and send the result using the shared API response format.
export const listPatients = async (req, res) => {
  const patients = await inventoryService.getEligiblePatients();
  return successResponse(res, "Patient list loaded", patients);
};

// Return active prescriptions and send the result using the shared API response format.
export const listActivePrescriptions = async (req, res) => {
  const prescriptions = await inventoryService.getActivePrescriptions();
  return successResponse(res, "Active prescription list loaded", prescriptions);
};
