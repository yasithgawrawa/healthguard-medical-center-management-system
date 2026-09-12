import { inventoryService } from "../services/inventoryService.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";

// Medicines
export const listMedicines = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  const medicines = await inventoryService.getMedicinesWithStock(filter);
  return successResponse(res, "Medicine catalog loaded", medicines);
};

export const createMedicine = async (req, res) => {
  const medicine = await inventoryService.createMedicine(req.body);
  return successResponse(res, "Medicine created successfully", medicine, 201);
};

export const updateMedicine = async (req, res) => {
  const medicine = await inventoryService.updateMedicine(req.params.id, req.body);
  return successResponse(res, "Medicine updated successfully", medicine);
};

export const deleteMedicine = async (req, res) => {
  const medicine = await inventoryService.deleteMedicine(req.params.id);
  return successResponse(res, "Medicine marked as inactive", medicine);
};

// Batches
export const listBatches = async (req, res) => {
  const batches = await inventoryService.getBatches();
  return successResponse(res, "Medicine batch list loaded", batches);
};

export const createBatch = async (req, res) => {
  const batch = await inventoryService.createBatch(req.body);
  return successResponse(res, "Medicine batch received and recorded", batch, 201);
};

export const updateBatch = async (req, res) => {
  const batch = await inventoryService.updateBatch(req.params.id, req.body);
  return successResponse(res, "Medicine batch updated successfully", batch);
};

// Suppliers
export const listSuppliers = async (req, res) => {
  const suppliers = await inventoryService.getSuppliers();
  return successResponse(res, "Supplier list loaded", suppliers);
};

export const createSupplier = async (req, res) => {
  const supplier = await inventoryService.createSupplier(req.body);
  return successResponse(res, "Supplier created successfully", supplier, 201);
};

export const updateSupplier = async (req, res) => {
  const supplier = await inventoryService.updateSupplier(req.params.id, req.body);
  return successResponse(res, "Supplier updated successfully", supplier);
};

export const deleteSupplier = async (req, res) => {
  const supplier = await inventoryService.deleteSupplier(req.params.id);
  return successResponse(res, "Supplier marked as inactive", supplier);
};

// Purchases
export const listPurchases = async (req, res) => {
  const purchases = await inventoryService.getPurchases();
  return successResponse(res, "Purchase list loaded", purchases);
};

export const recordPurchase = async (req, res) => {
  const purchase = await inventoryService.recordPurchase(req.body);
  return successResponse(res, "Purchase recorded and stock updated", purchase, 201);
};

// Sales / POS
export const listPharmacySales = async (req, res) => {
  const sales = await inventoryService.getSales();
  return successResponse(res, "Pharmacy sale list loaded", sales);
};

export const createPharmacySale = async (req, res) => {
  const sale = await inventoryService.createSale({
    ...req.body,
    soldById: req.user._id
  });
  return successResponse(res, "Pharmacy sale completed and stock deducted", sale, 201);
};

export const getSaleDetails = async (req, res) => {
  const sale = await inventoryService.getSaleById(req.params.id);
  return successResponse(res, "Pharmacy sale details loaded", sale);
};

export const downloadSaleBill = async (req, res) => {
  const { saleNumber, content } = await inventoryService.getBillFile(req.params.id);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${saleNumber || "pharmacy-bill"}.txt"`);
  return res.send(content);
};

// Alerts & Reports
export const inventoryAlerts = async (req, res) => {
  const alerts = await inventoryService.getAlerts();
  return successResponse(res, "Inventory alerts loaded", alerts);
};

export const pharmacySalesReport = async (req, res) => {
  const report = await inventoryService.getSalesReport(req.query.period || "all");
  return successResponse(res, "Pharmacy sales report loaded", report);
};

// Pharmacy Helpers
export const listPatients = async (req, res) => {
  const patients = await inventoryService.getEligiblePatients();
  return successResponse(res, "Patient list loaded", patients);
};

export const listActivePrescriptions = async (req, res) => {
  const prescriptions = await inventoryService.getActivePrescriptions();
  return successResponse(res, "Active prescription list loaded", prescriptions);
};
