import { Medicine } from "../models/Medicine.js";
import { MedicineBatch } from "../models/MedicineBatch.js";
import { Supplier } from "../models/Supplier.js";
import { Purchase } from "../models/Purchase.js";
import { PharmacySale } from "../models/PharmacySale.js";
import { Prescription } from "../../epic2_clinical/models/Prescription.js";
import { Appointment } from "../../epic2_clinical/models/Appointment.js";
import { Invoice } from "../../epic4_billing/models/Invoice.js";
import { User } from "../../epic1_user_staff/models/User.js";
import { AppError } from "../../../shared/utils/AppError.js";
import { ROLES } from "../../../shared/constants/roles.js";

export const inventoryService = {
  // --- MEDICINES ---
  async getMedicinesWithStock(filter = {}) {
    const medicines = await Medicine.find(filter).sort({ name: 1 });
    const batches = await MedicineBatch.find();

    const stockMap = new Map();
    const batchCountMap = new Map();

    for (const batch of batches) {
      const medId = batch.medicineId.toString();
      stockMap.set(medId, (stockMap.get(medId) || 0) + batch.quantity);
      batchCountMap.set(medId, (batchCountMap.get(medId) || 0) + 1);
    }

    return medicines.map((med) => {
      const totalStock = stockMap.get(med._id.toString()) || 0;
      const batchesCount = batchCountMap.get(med._id.toString()) || 0;
      let stockStatus = "in_stock";
      if (totalStock === 0) {
        stockStatus = "out_of_stock";
      } else if (totalStock <= med.reorderLevel) {
        stockStatus = "low_stock";
      }

      return {
        ...med.toObject(),
        totalStock,
        batchesCount,
        stockStatus
      };
    });
  },

  async createMedicine(data) {
    const existing = await Medicine.findOne({ name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") } });
    if (existing) {
      throw new AppError("A medicine with this name already exists", 409, { name: "Medicine already registered" });
    }
    return Medicine.create(data);
  },

  async updateMedicine(id, data) {
    if (data.name) {
      const existing = await Medicine.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") }
      });
      if (existing) {
        throw new AppError("Another medicine with this name already exists", 409, { name: "Medicine name already in use" });
      }
    }
    const medicine = await Medicine.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!medicine) throw new AppError("Medicine not found", 404);
    return medicine;
  },

  async deleteMedicine(id) {
    const medicine = await Medicine.findByIdAndUpdate(id, { status: "inactive" }, { new: true });
    if (!medicine) throw new AppError("Medicine not found", 404);
    return medicine;
  },

  // --- BATCHES ---
  async getBatches() {
    const batches = await MedicineBatch.find()
      .populate("medicineId", "name category unit price status")
      .sort({ expiryDate: 1, createdAt: -1 });

    const now = new Date();
    const thirtyDaysAhead = new Date(Date.now() + 30 * 86400000);

    return batches.map((batch) => {
      const exp = new Date(batch.expiryDate);
      let expiryStatus = "valid";
      if (exp <= now) {
        expiryStatus = "expired";
      } else if (exp <= thirtyDaysAhead) {
        expiryStatus = "expiring_soon";
      }
      return {
        ...batch.toObject(),
        expiryStatus
      };
    });
  },

  async createBatch(data) {
    const existing = await MedicineBatch.findOne({ batchNumber: data.batchNumber.trim().toUpperCase() });
    if (existing) {
      throw new AppError("Batch number already exists", 409, { batchNumber: "Batch number must be unique" });
    }
    const medicine = await Medicine.findById(data.medicineId);
    if (!medicine) throw new AppError("Selected medicine not found", 404);

    return MedicineBatch.create({
      ...data,
      batchNumber: data.batchNumber.trim().toUpperCase()
    });
  },

  async updateBatch(id, data) {
    if (data.batchNumber) {
      const existing = await MedicineBatch.findOne({
        _id: { $ne: id },
        batchNumber: data.batchNumber.trim().toUpperCase()
      });
      if (existing) {
        throw new AppError("Batch number already in use", 409, { batchNumber: "Batch number must be unique" });
      }
      data.batchNumber = data.batchNumber.trim().toUpperCase();
    }
    const batch = await MedicineBatch.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate("medicineId", "name category unit price");
    if (!batch) throw new AppError("Medicine batch not found", 404);
    return batch;
  },

  // --- SUPPLIERS ---
  async getSuppliers() {
    return Supplier.find().sort({ name: 1 });
  },

  async createSupplier(data) {
    return Supplier.create(data);
  },

  async updateSupplier(id, data) {
    const supplier = await Supplier.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!supplier) throw new AppError("Supplier not found", 404);
    return supplier;
  },

  async deleteSupplier(id) {
    const supplier = await Supplier.findByIdAndUpdate(id, { status: "inactive" }, { new: true });
    if (!supplier) throw new AppError("Supplier not found", 404);
    return supplier;
  },

  // --- PURCHASES ---
  async getPurchases() {
    return Purchase.find()
      .populate("supplierId", "name phone email")
      .populate("medicineId", "name category unit")
      .populate("batchId", "batchNumber expiryDate")
      .sort({ purchasedAt: -1 });
  },

  async recordPurchase(data) {
    const supplier = await Supplier.findById(data.supplierId);
    if (!supplier) throw new AppError("Supplier not found", 404);

    const medicine = await Medicine.findById(data.medicineId);
    if (!medicine) throw new AppError("Medicine not found", 404);

    let batch;
    if (data.batchId) {
      batch = await MedicineBatch.findById(data.batchId);
      if (!batch) throw new AppError("Medicine batch not found", 404);
      if (batch.medicineId.toString() !== medicine._id.toString()) {
        throw new AppError("Batch does not belong to selected medicine", 400);
      }
      batch.quantity += data.quantity;
      if (data.purchasePrice) batch.purchasePrice = data.purchasePrice;
      await batch.save();
    } else if (data.batchNumber && data.manufactureDate && data.expiryDate) {
      const cleanBatchNo = data.batchNumber.trim().toUpperCase();
      const existing = await MedicineBatch.findOne({ batchNumber: cleanBatchNo });
      if (existing) {
        throw new AppError("Batch number already exists. Please select it or use a unique batch number.", 409);
      }
      batch = await MedicineBatch.create({
        medicineId: medicine._id,
        batchNumber: cleanBatchNo,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        manufactureDate: new Date(data.manufactureDate),
        expiryDate: new Date(data.expiryDate)
      });
    } else {
      throw new AppError("Either select an existing batch or provide new batch details", 400);
    }

    const purchase = await Purchase.create({
      supplierId: supplier._id,
      medicineId: medicine._id,
      batchId: batch._id,
      quantity: data.quantity,
      purchasePrice: data.purchasePrice,
      purchasedAt: data.purchasedAt || new Date()
    });

    return purchase.populate([
      { path: "supplierId", select: "name phone" },
      { path: "medicineId", select: "name unit" },
      { path: "batchId", select: "batchNumber expiryDate" }
    ]);
  },

  // --- SALES / POS ---
  async createSale({ prescriptionId, patientId, items, soldById, paymentStatus }) {
    if (!items || items.length === 0) {
      throw new AppError("Sale must contain at least one item", 400);
    }

    const now = new Date();
    const processedItems = [];
    let grandTotal = 0;

    // Check all items first before updating database
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine || medicine.status !== "active") {
        throw new AppError(`Active medicine not found for ID: ${item.medicineId}`, 404);
      }

      const batch = await MedicineBatch.findById(item.batchId);
      if (!batch || batch.medicineId.toString() !== medicine._id.toString()) {
        throw new AppError(`Valid batch not found for medicine: ${medicine.name}`, 404);
      }

      if (new Date(batch.expiryDate) <= now) {
        throw new AppError(`Batch ${batch.batchNumber} of ${medicine.name} is expired and cannot be sold`, 400);
      }

      if (batch.quantity < item.quantity) {
        throw new AppError(`Insufficient stock for ${medicine.name} (Batch: ${batch.batchNumber}). Available: ${batch.quantity}, Requested: ${item.quantity}`, 409);
      }

      const unitPrice = medicine.price;
      const lineTotal = unitPrice * item.quantity;
      grandTotal += lineTotal;

      processedItems.push({
        batch,
        itemRecord: {
          medicineId: medicine._id,
          batchId: batch._id,
          quantity: item.quantity,
          unitPrice,
          lineTotal
        }
      });
    }

    // Deduct batch stocks
    for (const { batch, itemRecord } of processedItems) {
      batch.quantity -= itemRecord.quantity;
      await batch.save();
    }

    // Generate unique sale number
    const todayKey = now.toISOString().slice(0, 10).replace(/-/g, "");
    const countToday = await PharmacySale.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const saleNumber = `PH-${todayKey}-${String(countToday + 1).padStart(4, "0")}`;

    let effectivePrescriptionId = prescriptionId;

    // If patient is selected and no prescriptionId was provided, auto-digitize the prescription record
    if (!effectivePrescriptionId && patientId) {
      try {
        const latestAppt = await Appointment.findOne({ patientId }).sort({ appointmentDate: -1 });
        if (latestAppt) {
          const rxItems = processedItems.map(({ itemRecord, batch }) => {
            return {
              medicineName: itemRecord.medicineId?.name || `Medicine (${batch?.batchNumber || "Dispensed"})`,
              dosage: `${itemRecord.quantity} unit(s)`,
              frequency: "As directed on handwritten prescription",
              duration: "Dispensed course",
              instructions: "Dispensed from doctor's handwritten paper prescription"
            };
          });

          const newRx = await Prescription.create({
            appointmentId: latestAppt._id,
            patientId,
            doctorId: latestAppt.doctorId,
            items: rxItems,
            status: "dispensed"
          });
          effectivePrescriptionId = newRx._id;
        }
      } catch (err) {
        // Fallback: do not interrupt POS sale
      }
    }

    let createdInvoiceId = undefined;
    if (patientId) {
      try {
        const latestAppt = await Appointment.findOne({ patientId }).sort({ appointmentDate: -1 });
        const invoiceItems = processedItems.map(({ itemRecord, batch }) => ({
          description: `Dispensed Medicine: ${itemRecord.medicineId?.name || "Medication"} (${batch?.batchNumber || "Dispensed"})`,
          quantity: itemRecord.quantity,
          unitPrice: itemRecord.unitPrice,
          lineTotal: itemRecord.lineTotal
        }));

        const isPaid = paymentStatus === "paid";

        // Check if there is an active open visit invoice for this patient / appointment
        let existingInvoice = null;
        if (latestAppt?._id) {
          existingInvoice = await Invoice.findOne({ appointmentId: latestAppt._id, status: { $in: ["issued", "partially_paid", "draft"] } });
        }
        if (!existingInvoice) {
          existingInvoice = await Invoice.findOne({ patientId, status: { $in: ["issued", "partially_paid", "draft"] } }).sort({ createdAt: -1 });
        }

        if (existingInvoice && !isPaid) {
          // Consolidate medicines into the patient's existing visit bill so they can pay all at once
          existingInvoice.items.push(...invoiceItems);
          existingInvoice.subtotal = existingInvoice.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
          existingInvoice.outstandingAmount = Math.max(0, existingInvoice.subtotal - (existingInvoice.paidAmount || 0));
          if (!existingInvoice.appointmentId && latestAppt?._id) {
            existingInvoice.appointmentId = latestAppt._id;
          }
          await existingInvoice.save();
          createdInvoiceId = existingInvoice._id;
        } else {
          // Otherwise create a new invoice
          const newInvoice = await Invoice.create({
            patientId,
            appointmentId: latestAppt?._id || undefined,
            items: invoiceItems,
            subtotal: grandTotal,
            paidAmount: isPaid ? grandTotal : 0,
            outstandingAmount: isPaid ? 0 : grandTotal,
            status: isPaid ? "paid" : "issued",
            createdBy: soldById
          });
          createdInvoiceId = newInvoice._id;
        }
      } catch (invoiceErr) {
        // Fallback: don't abort dispensing if invoice generation encounters a transient error
      }
    }

    const sale = await PharmacySale.create({
      saleNumber,
      prescriptionId: effectivePrescriptionId || undefined,
      patientId: patientId || undefined,
      soldBy: soldById,
      items: processedItems.map((p) => p.itemRecord),
      total: grandTotal,
      paymentStatus: paymentStatus || "pending_cashier",
      invoiceId: createdInvoiceId,
      billIssuedAt: now
    });

    // If linked to prescription, mark prescription as dispensed
    if (effectivePrescriptionId) {
      await Prescription.findByIdAndUpdate(effectivePrescriptionId, { status: "dispensed" });
    }

    return sale.populate([
      { path: "patientId", select: "firstName lastName email phone" },
      { path: "soldBy", select: "firstName lastName" },
      { path: "items.medicineId", select: "name unit price" },
      { path: "items.batchId", select: "batchNumber" }
    ]);
  },

  async getSales() {
    return PharmacySale.find()
      .populate("patientId", "firstName lastName email phone")
      .populate("soldBy", "firstName lastName")
      .populate("items.medicineId", "name unit price")
      .populate("items.batchId", "batchNumber")
      .sort({ createdAt: -1 });
  },

  async getSaleById(id) {
    const sale = await PharmacySale.findById(id)
      .populate("patientId", "firstName lastName email phone address")
      .populate("soldBy", "firstName lastName")
      .populate("prescriptionId")
      .populate("items.medicineId", "name unit price category")
      .populate("items.batchId", "batchNumber expiryDate");
    if (!sale) throw new AppError("Pharmacy sale not found", 404);
    return sale;
  },

  async getBillFile(id) {
    const sale = await this.getSaleById(id);
    const patientName = [sale.patientId?.firstName, sale.patientId?.lastName].filter(Boolean).join(" ") || "Walk-in Patient";
    const dispenser = [sale.soldBy?.firstName, sale.soldBy?.lastName].filter(Boolean).join(" ") || "Health Guard Pharmacist";

    const lines = [
      "============================================================",
      "             HEALTH GUARD MEDICAL CENTER PHARMACY           ",
      "           No. 128, Galle Road, Colombo 03, Sri Lanka        ",
      "                 Tel: +94 11 2555000 / 2555001              ",
      "============================================================",
      `Bill Number : ${sale.saleNumber || `PH-${sale._id.toString().slice(-8).toUpperCase()}`}`,
      `Date & Time : ${(sale.billIssuedAt || sale.createdAt).toLocaleString("en-LK")}`,
      `Patient     : ${patientName}`,
      `Dispenser   : ${dispenser}`,
      "------------------------------------------------------------",
      "Item Description         Batch      Qty    Unit (Rs)  Total (Rs)",
      "------------------------------------------------------------"
    ];

    for (const item of sale.items) {
      const name = (item.medicineId?.name || "Medicine").padEnd(24).slice(0, 24);
      const batch = (item.batchId?.batchNumber || "-").padEnd(10).slice(0, 10);
      const qty = String(item.quantity).padStart(4);
      const price = item.unitPrice.toFixed(2).padStart(11);
      const total = item.lineTotal.toFixed(2).padStart(11);
      lines.push(`${name} ${batch} ${qty} ${price} ${total}`);
    }

    lines.push("------------------------------------------------------------");
    lines.push(`GRAND TOTAL: Rs. ${sale.total.toFixed(2)}`.padStart(60));
    lines.push(`PAYMENT STATUS: ${sale.paymentStatus === "paid" ? "PAID AT CASHIER" : "PENDING AT CASHIER DESK"}`.padStart(60));
    lines.push("============================================================");
    if (sale.paymentStatus === "paid") {
      lines.push("             Thank you for choosing Health Guard!           ");
    } else {
      lines.push("   Please present this slip at Cashier Desk to pay.         ");
    }
    lines.push("      Keep medicines stored safely away from sunlight.      ");
    lines.push("============================================================");

    return {
      saleNumber: sale.saleNumber,
      content: lines.join("\n")
    };
  },

  // --- ALERTS ---
  async getAlerts() {
    const medicines = await Medicine.find({ status: "active" }).sort({ name: 1 });
    const batches = await MedicineBatch.find()
      .populate("medicineId", "name category unit price reorderLevel")
      .sort({ expiryDate: 1 });

    const now = new Date();
    const stockMap = new Map();

    for (const batch of batches) {
      const medId = (batch.medicineId?._id || batch.medicineId).toString();
      stockMap.set(medId, (stockMap.get(medId) || 0) + batch.quantity);
    }

    const lowStock = medicines
      .map((med) => {
        const currentStock = stockMap.get(med._id.toString()) || 0;
        const deficit = Math.max(0, med.reorderLevel - currentStock);
        return {
          _id: med._id,
          name: med.name,
          category: med.category,
          unit: med.unit,
          price: med.price,
          reorderLevel: med.reorderLevel,
          currentStock,
          deficit,
          isOutOfStock: currentStock === 0
        };
      })
      .filter((med) => med.currentStock <= med.reorderLevel);

    const expiresBefore = new Date(Date.now() + 60 * 86400000); // 60 days view
    const expiring = batches
      .filter((batch) => new Date(batch.expiryDate) <= expiresBefore)
      .map((batch) => {
        const exp = new Date(batch.expiryDate);
        const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
        return {
          _id: batch._id,
          batchNumber: batch.batchNumber,
          medicine: batch.medicineId?.name || "Medicine",
          medicineId: batch.medicineId?._id,
          category: batch.medicineId?.category,
          unit: batch.medicineId?.unit,
          quantity: batch.quantity,
          purchasePrice: batch.purchasePrice,
          valueAtRisk: batch.quantity * (batch.medicineId?.price || batch.purchasePrice || 0),
          expiryDate: batch.expiryDate,
          daysRemaining: diffDays,
          status: diffDays <= 0 ? "expired" : diffDays <= 30 ? "critical" : "warning"
        };
      });

    return { lowStock, expiring };
  },

  // --- SALES REPORT ---
  async getSalesReport(period = "all") {
    let dateFilter = {};
    const now = new Date();

    if (period === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { createdAt: { $gte: startOfDay } };
    } else if (period === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      dateFilter = { createdAt: { $gte: startOfWeek } };
    } else if (period === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
    }

    const sales = await PharmacySale.find(dateFilter)
      .populate("items.medicineId", "name category price")
      .sort({ createdAt: -1 });

    let totalRevenue = 0;
    let totalItemsSold = 0;
    const medicineMap = new Map();
    const categoryMap = new Map();

    for (const sale of sales) {
      totalRevenue += sale.total;
      for (const item of sale.items) {
        totalItemsSold += item.quantity;
        const medName = item.medicineId?.name || "Unknown Medicine";
        const category = item.medicineId?.category || "Other";

        // Aggregate by medicine
        const existingMed = medicineMap.get(medName) || {
          medicine: medName,
          category,
          quantity: 0,
          revenue: 0
        };
        existingMed.quantity += item.quantity;
        existingMed.revenue += item.lineTotal;
        medicineMap.set(medName, existingMed);

        // Aggregate by category
        const existingCat = categoryMap.get(category) || { category, quantity: 0, revenue: 0 };
        existingCat.quantity += item.quantity;
        existingCat.revenue += item.lineTotal;
        categoryMap.set(category, existingCat);
      }
    }

    const topMedicines = [...medicineMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((med) => ({
        ...med,
        sharePercentage: totalRevenue > 0 ? Number(((med.revenue / totalRevenue) * 100).toFixed(1)) : 0
      }));

    const categoryBreakdown = [...categoryMap.values()].sort((a, b) => b.revenue - a.revenue);

    const averageOrderValue = sales.length > 0 ? Number((totalRevenue / sales.length).toFixed(2)) : 0;

    return {
      period,
      totalSales: sales.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalItemsSold,
      averageOrderValue,
      topMedicines,
      categoryBreakdown
    };
  },

  // --- PATIENTS & PRESCRIPTIONS HELPERS FOR PHARMACY ---
  async getEligiblePatients() {
    return User.find({ role: ROLES.PATIENT, status: "active" })
      .select("firstName lastName email phone")
      .sort({ firstName: 1 });
  },

  async getActivePrescriptions() {
    return Prescription.find({ status: "active" })
      .populate("patientId", "firstName lastName email phone")
      .populate("doctorId", "firstName lastName")
      .sort({ createdAt: -1 });
  }
};
