// Implement inventory business rules and coordinate database operations.
import { Medicine } from "../models/Medicine.js";
import { MedicineBatch } from "../models/MedicineBatch.js";
import { Supplier } from "../models/Supplier.js";
import { Purchase } from "../models/Purchase.js";
import { PharmacySale } from "../models/PharmacySale.js";
import { MedicineReturn } from "../models/MedicineReturn.js";
import { Prescription } from "../../epic2_clinical/models/Prescription.js";
import { Appointment } from "../../epic2_clinical/models/Appointment.js";
import { Invoice } from "../../epic4_billing/models/Invoice.js";
import { SupplierBill } from "../../epic4_billing/models/SupplierBill.js";
import { User } from "../../epic1_user_staff/models/User.js";
import { AppError } from "../../../shared/utils/AppError.js";
import { ROLES } from "../../../shared/constants/roles.js";

// Replace return reference IDs with selected medicine, batch, supplier, and staff details.
const populateMedicineReturn = (query) =>
  query
    .populate("medicineId", "name category unit")
    .populate("batchId", "batchNumber quantity expiryDate")
    .populate("supplierId", "name phone email")
    .populate("createdBy", "firstName lastName")
    .populate("completedBy", "firstName lastName");

// Build a dated return reference and skip references that already exist.
const generateReturnId = async (date = new Date()) => {
  const key = date.toISOString().slice(0, 10).replace(/-/g, "");
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  let next = await MedicineReturn.countDocuments({ createdAt: { $gte: start, $lt: end } }) + 1;
  let returnId = `RT-${key}-${String(next).padStart(4, "0")}`;
  while (await MedicineReturn.exists({ returnId })) {
    next += 1;
    returnId = `RT-${key}-${String(next).padStart(4, "0")}`;
  }
  return returnId;
};

export const inventoryService = {
  // --- MEDICINES ---
  // Sum batch quantities per medicine and derive stock levels against each reorder threshold.
  async getMedicinesWithStock(filter = {}) {
    const medicines = await Medicine.find(filter).sort({ name: 1 });
    const batches = await MedicineBatch.find();

    // Group batch quantities by medicine ID so each medicine can be matched to its total stock.
    const stockMap = new Map();
    // Count batches separately from their combined quantities.
    const batchCountMap = new Map();

    for (const batch of batches) {
      const medId = batch.medicineId.toString();
      stockMap.set(medId, (stockMap.get(medId) || 0) + batch.quantity);
      batchCountMap.set(medId, (batchCountMap.get(medId) || 0) + 1);
    }

    // Attach computed stock values to plain medicine objects for the API response.
    return medicines.map((med) => {
      const totalStock = stockMap.get(med._id.toString()) || 0;
      const batchesCount = batchCountMap.get(med._id.toString()) || 0;
      let stockStatus = "in_stock";
      // A zero quantity is out of stock; otherwise compare stock with the configured reorder level.
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

  // Reject an existing case-insensitive medicine name before creating the catalog record.
  async createMedicine(data) {
    const existing = await Medicine.findOne({ name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") } });
    if (existing) {
      throw new AppError("A medicine with this name already exists", 409, { name: "Medicine already registered" });
    }
    return Medicine.create(data);
  },

  // Check name conflicts and update the medicine with Mongoose validation enabled.
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

  // Delete the medicine and all of its batches and report the number of removed batches.
  async deleteMedicine(id) {
    const medicine = await Medicine.findById(id);
    if (!medicine) throw new AppError("Medicine not found", 404);

    // Remove dependent batches before deleting their medicine catalog entry.
    const deletedBatches = await MedicineBatch.deleteMany({ medicineId: medicine._id });
    await Medicine.findByIdAndDelete(medicine._id);

    return {
      ...medicine.toObject(),
      deletedBatchesCount: deletedBatches.deletedCount || 0
    };
  },

  // --- BATCHES ---
  // Load batches with medicine details and classify expiry within the next 30 days.
  async getBatches() {
    const batches = await MedicineBatch.find()
      .populate("medicineId", "name category unit price status")
      .sort({ expiryDate: 1, createdAt: -1 });

    const now = new Date();
    // Use a 30-day window to identify batches that are approaching expiry.
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

  // Check batch uniqueness, linked medicine, and date order before creating received stock.
  async createBatch(data) {
    const existing = await MedicineBatch.findOne({ batchNumber: data.batchNumber.trim().toUpperCase() });
    if (existing) {
      throw new AppError("Batch number already exists", 409, { batchNumber: "Batch number must be unique" });
    }
    const medicine = await Medicine.findById(data.medicineId);
    if (!medicine) throw new AppError("Selected medicine not found", 404);

    const mfg = new Date(data.manufactureDate);
    const exp = new Date(data.expiryDate);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    if (mfg > endOfToday) {
      throw new AppError("Manufacture date cannot be in the future", 400);
    }
    if (exp <= mfg) {
      throw new AppError("Expiry date must be after manufacture date", 400);
    }

    return MedicineBatch.create({
      ...data,
      batchNumber: data.batchNumber.trim().toUpperCase()
    });
  },

  // Check batch-number conflicts and update the batch with Mongoose validation enabled.
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
  // Return suppliers in alphabetical order.
  async getSuppliers() {
    return Supplier.find().sort({ name: 1 });
  },

  // Store a new supplier using the validated request data.
  async createSupplier(data) {
    return Supplier.create(data);
  },

  // Update a supplier with model validation or return a 404 error.
  async updateSupplier(id, data) {
    const supplier = await Supplier.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!supplier) throw new AppError("Supplier not found", 404);
    return supplier;
  },

  // Mark a supplier inactive while preserving its purchase history.
  async deleteSupplier(id) {
    const supplier = await Supplier.findByIdAndUpdate(id, { status: "inactive" }, { new: true });
    if (!supplier) throw new AppError("Supplier not found", 404);
    return supplier;
  },

  // --- PURCHASES ---
  // Load purchase history with linked supplier, medicine, and batch details.
  async getPurchases() {
    return Purchase.find()
      .populate("supplierId", "name phone email")
      .populate("medicineId", "name category unit")
      .populate("batchId", "batchNumber expiryDate")
      .sort({ purchasedAt: -1 });
  },

  // Receive stock into an existing or new batch, record the purchase, and create a supplier bill.
  async recordPurchase(data) {
    const supplier = await Supplier.findById(data.supplierId);
    if (!supplier) throw new AppError("Supplier not found", 404);

    const medicine = await Medicine.findById(data.medicineId);
    if (!medicine) throw new AppError("Medicine not found", 404);

    let batch;
    // An existing batch receives additional stock after its medicine relationship is checked.
    if (data.batchId) {
      batch = await MedicineBatch.findById(data.batchId);
      if (!batch) throw new AppError("Medicine batch not found", 404);
      if (batch.medicineId.toString() !== medicine._id.toString()) {
        throw new AppError("Batch does not belong to selected medicine", 400);
      }
      // Increase the stored batch quantity by the received purchase quantity.
      batch.quantity += data.quantity;
      if (data.purchasePrice) batch.purchasePrice = data.purchasePrice;
      await batch.save();
    // Create a separate stock batch when the purchase supplies complete new-batch details.
    } else if (data.batchNumber && data.manufactureDate && data.expiryDate) {
      // Normalize the batch number before checking uniqueness and storing the new batch.
      const cleanBatchNo = data.batchNumber.trim().toUpperCase();
      const existing = await MedicineBatch.findOne({ batchNumber: cleanBatchNo });
      if (existing) {
        throw new AppError("Batch number already exists. Please select it or use a unique batch number.", 409);
      }
      const mfg = new Date(data.manufactureDate);
      const exp = new Date(data.expiryDate);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      if (mfg > endOfToday) {
        throw new AppError("Manufacture date cannot be in the future", 400);
      }
      // Reject a new purchase batch whose expiry is at or before the start of today.
      if (exp <= startOfToday) {
        throw new AppError("Expiry date must be in the future for newly received stock", 400);
      }
      if (exp <= mfg) {
        throw new AppError("Expiry date must be after manufacture date", 400);
      }
      batch = await MedicineBatch.create({
        medicineId: medicine._id,
        batchNumber: cleanBatchNo,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        manufactureDate: mfg,
        expiryDate: exp
      });
    } else {
      throw new AppError("Either select an existing batch or provide new batch details", 400);
    }

    // Keep references to the supplier, medicine, and received batch in the purchase history.
    const purchase = await Purchase.create({
      supplierId: supplier._id,
      medicineId: medicine._id,
      batchId: batch._id,
      quantity: data.quantity,
      purchasePrice: data.purchasePrice,
      purchasedAt: data.purchasedAt || new Date()
    });

    // Link procurement to billing and calculate the payable amount from quantity and unit purchase price.
    await SupplierBill.create({
      supplierId: supplier._id,
      purchaseId: purchase._id,
      amount: Number(data.quantity) * Number(data.purchasePrice)
    });

    return purchase.populate([
      { path: "supplierId", select: "name phone" },
      { path: "medicineId", select: "name unit" },
      { path: "batchId", select: "batchNumber expiryDate" }
    ]);
  },

  // --- MEDICINE RETURNS ---
  // Verify the medicine and batch, infer the supplier from purchase history, and check available stock.
  async validateMedicineReturnPayload(data) {
    const medicine = await Medicine.findById(data.medicineId);
    if (!medicine) throw new AppError("Medicine not found", 404);

    const batch = await MedicineBatch.findById(data.batchId);
    if (!batch) throw new AppError("Medicine batch not found", 404);
    if (batch.medicineId.toString() !== medicine._id.toString()) {
      throw new AppError("Batch does not belong to selected medicine", 400, { batchId: "Select a matching batch" });
    }

    // Use the latest purchase of this batch to identify its supplier.
    const purchase = await Purchase.findOne({ batchId: batch._id })
      .populate("supplierId", "name phone email status")
      .sort({ purchasedAt: -1, createdAt: -1 });
    const supplier = purchase?.supplierId;
    if (!supplier) {
      throw new AppError("Supplier could not be found for this batch. Please check purchase history.", 409, { batchId: "No supplier found for selected batch" });
    }

    // Reject a draft return quantity greater than the batch stock currently available.
    if (Number(data.quantity) > Number(batch.quantity || 0)) {
      throw new AppError(`Return quantity cannot exceed available batch stock (${batch.quantity})`, 400, { quantity: "Quantity exceeds available stock" });
    }

    return { medicine, batch, supplier };
  },

  // Create a validated supplier return draft without deducting stock.
  async createMedicineReturnDraft(data, userId) {
    const { supplier } = await this.validateMedicineReturnPayload(data);
    const returnId = await generateReturnId();
    const medicineReturn = await MedicineReturn.create({
      ...data,
      supplierId: supplier._id,
      returnId,
      status: "draft",
      createdBy: userId
    });
    return populateMedicineReturn(MedicineReturn.findById(medicineReturn._id));
  },

  // List supplier returns with related records, newest first.
  async getMedicineReturns() {
    return populateMedicineReturn(MedicineReturn.find().sort({ createdAt: -1 }));
  },

  // Load a populated supplier return or return a 404 error.
  async getMedicineReturnById(id) {
    const medicineReturn = await populateMedicineReturn(MedicineReturn.findById(id));
    if (!medicineReturn) throw new AppError("Medicine return not found", 404);
    return medicineReturn;
  },

  // Validate merged return details and allow edits only while the return is a draft.
  async updateMedicineReturnDraft(id, data) {
    const medicineReturn = await MedicineReturn.findById(id);
    if (!medicineReturn) throw new AppError("Medicine return not found", 404);
    if (medicineReturn.status !== "draft") throw new AppError("Completed returns cannot be edited", 409);

    // Merge partial edits with stored values before validating the complete return payload.
    const nextData = {
      medicineId: data.medicineId ?? medicineReturn.medicineId,
      batchId: data.batchId ?? medicineReturn.batchId,
      quantity: data.quantity ?? medicineReturn.quantity,
      returnReason: data.returnReason ?? medicineReturn.returnReason,
      returnDate: data.returnDate ?? medicineReturn.returnDate
    };
    const { supplier } = await this.validateMedicineReturnPayload(nextData);

    Object.assign(medicineReturn, data);
    medicineReturn.supplierId = supplier._id;
    await medicineReturn.save();
    return populateMedicineReturn(MedicineReturn.findById(medicineReturn._id));
  },

  // Delete a return only while its status is draft.
  async deleteMedicineReturnDraft(id) {
    const medicineReturn = await MedicineReturn.findById(id);
    if (!medicineReturn) throw new AppError("Medicine return not found", 404);
    if (medicineReturn.status !== "draft") throw new AppError("Completed returns cannot be deleted", 409);
    await medicineReturn.deleteOne();
    return medicineReturn;
  },

  // Deduct available batch stock, complete a draft return, and restore stock if completion loses a race.
  async completeMedicineReturn(id, userId) {
    const medicineReturn = await MedicineReturn.findById(id);
    if (!medicineReturn) throw new AppError("Medicine return not found", 404);
    if (medicineReturn.status !== "draft") throw new AppError("Return has already been completed", 409);

    // Check available quantity and deduct return stock in the same database update.
    const batch = await MedicineBatch.findOneAndUpdate(
      { _id: medicineReturn.batchId, quantity: { $gte: medicineReturn.quantity } },
      { $inc: { quantity: -medicineReturn.quantity } },
      { new: true }
    );
    if (!batch) {
      throw new AppError("Not enough stock remains in this batch to complete the return", 409, { quantity: "Quantity exceeds available stock" });
    }

    // Complete only a document that is still a draft and record the responsible staff member.
    const completed = await MedicineReturn.findOneAndUpdate(
      { _id: medicineReturn._id, status: "draft" },
      { status: "completed", completedAt: new Date(), completedBy: userId },
      { new: true, runValidators: true }
    );

    // Restore the deducted stock if another request completed the draft first.
    if (!completed) {
      await MedicineBatch.findByIdAndUpdate(medicineReturn.batchId, { $inc: { quantity: medicineReturn.quantity } });
      throw new AppError("Return has already been completed", 409);
    }

    return populateMedicineReturn(MedicineReturn.findById(completed._id));
  },

  // --- SALES / POS ---
  // Validate sale items, calculate prices on the server, deduct stock, and link prescription and billing records.
  async createSale({ prescriptionId, patientId, customerName, customerPhone, items, soldById, paymentStatus }) {
    if (!items || items.length === 0) {
      throw new AppError("Sale must contain at least one item", 400);
    }
    if (patientId) {
      const patient = await User.findOne({ _id: patientId, role: ROLES.PATIENT, status: "active" }).select("_id");
      if (!patient) throw new AppError("Active patient not found for medicine sale", 404);
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

      // Read the selling price from the medicine record instead of accepting a client-supplied total.
      const unitPrice = medicine.price;
      // Calculate each sale line from the stored selling price and requested quantity.
      const lineTotal = unitPrice * item.quantity;
      grandTotal += lineTotal;

      processedItems.push({
        batch,
        medicineName: medicine.name,
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

    // Preserve a supplied prescription link or replace it with a generated dispensing record when available.
    let effectivePrescriptionId = prescriptionId;

    // If patient is selected and no prescriptionId was provided, auto-digitize the prescription record
    if (!effectivePrescriptionId && patientId) {
      try {
        // Find the patient's latest appointment to link the dispensing or invoice record.
        const latestAppt = await Appointment.findOne({ patientId }).sort({ appointmentDate: -1 });
        if (latestAppt) {
          const rxItems = processedItems.map(({ itemRecord, batch, medicineName }) => {
            return {
              medicineName: medicineName || `Medicine (${batch?.batchNumber || "Dispensed"})`,
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
    try {
      const invoiceItems = processedItems.map(({ itemRecord, batch, medicineName }) => ({
        description: `Dispensed Medicine: ${medicineName || "Medication"} (${batch?.batchNumber || "Dispensed"})`,
        quantity: itemRecord.quantity,
        unitPrice: itemRecord.unitPrice,
        lineTotal: itemRecord.lineTotal
      }));

      const isPaid = paymentStatus === "paid";

      if (patientId) {
        // Find the patient's latest appointment to link the dispensing or invoice record.
        const latestAppt = await Appointment.findOne({ patientId }).sort({ appointmentDate: -1 });
        // Reuse the latest draft or issued patient invoice when one is available.
        let patientInvoice = await Invoice.findOne({
          patientId,
          status: { $in: ["issued", "draft"] }
        }).sort({ createdAt: -1 });

        if (patientInvoice) {
          patientInvoice.items.push(...invoiceItems);
          patientInvoice.invoiceType = "visit";
          // Recalculate the combined invoice subtotal from its stored charge lines.
          patientInvoice.subtotal = patientInvoice.items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
          if (isPaid) {
            patientInvoice.paidAmount = Math.min(patientInvoice.subtotal, Number(patientInvoice.paidAmount || 0) + grandTotal);
          }
          // Derive the remaining balance from the invoice subtotal and recorded payments.
          patientInvoice.outstandingAmount = Math.max(0, patientInvoice.subtotal - Number(patientInvoice.paidAmount || 0));
          patientInvoice.status = patientInvoice.outstandingAmount === 0 ? "paid" : "issued";
          await patientInvoice.save();
        } else {
          patientInvoice = await Invoice.create({
            patientId,
            appointmentId: latestAppt?._id || undefined,
            invoiceType: "visit",
            items: invoiceItems,
            subtotal: grandTotal,
            paidAmount: isPaid ? grandTotal : 0,
            outstandingAmount: isPaid ? 0 : grandTotal,
            status: isPaid ? "paid" : "issued",
            createdBy: soldById
          });
        }
        createdInvoiceId = patientInvoice._id;
      } else {
        // UNREGISTERED / WALK-IN CUSTOMER:
        // Automatically create an invoice for the Cashier desk to collect payment
        const walkInDisplayName = customerName ? `${customerName} (${saleNumber})` : `Walk-in Customer (${saleNumber})`;
        const newInvoice = await Invoice.create({
          customerName: walkInDisplayName,
          customerPhone,
          invoiceType: "pharmacy",
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
      console.error("Error creating billing invoice for pharmacy sale:", invoiceErr);
    }

    // Save the sale with its calculated amounts and shared prescription, patient, dispenser, and invoice IDs.
    const sale = await PharmacySale.create({
      saleNumber,
      prescriptionId: effectivePrescriptionId || undefined,
      patientId: patientId || undefined,
      customerName: customerName || (patientId ? undefined : "Walk-in Customer"),
      customerPhone: patientId ? undefined : customerPhone,
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
      { path: "patientId", select: "firstName lastName email phone registrationSource portalAccessEnabled" },
      { path: "soldBy", select: "firstName lastName" },
      { path: "items.medicineId", select: "name unit price" },
      { path: "items.batchId", select: "batchNumber" }
    ]);
  },

  // List pharmacy sales with patient, dispenser, medicine, and batch details.
  async getSales() {
    return PharmacySale.find()
      .populate("patientId", "firstName lastName email phone registrationSource portalAccessEnabled")
      .populate("soldBy", "firstName lastName")
      .populate("items.medicineId", "name unit price")
      .populate("items.batchId", "batchNumber")
      .sort({ createdAt: -1 });
  },

  // Load one pharmacy sale with the details needed for its bill.
  async getSaleById(id) {
    const sale = await PharmacySale.findById(id)
      .populate("patientId", "firstName lastName email phone address registrationSource portalAccessEnabled")
      .populate("soldBy", "firstName lastName")
      .populate("prescriptionId")
      .populate("items.medicineId", "name unit price category")
      .populate("items.batchId", "batchNumber expiryDate");
    if (!sale) throw new AppError("Pharmacy sale not found", 404);
    return sale;
  },

  // Build a downloadable text bill showing dispensed items, totals, and cashier payment status.
  async getBillFile(id) {
    const sale = await this.getSaleById(id);
    const patientName = sale.customerName || [sale.patientId?.firstName, sale.patientId?.lastName].filter(Boolean).join(" ") || "Walk-in Patient";
    const patientPhone = sale.customerPhone || sale.patientId?.phone || "-";
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
      `Phone       : ${patientPhone}`,
      `Dispenser   : ${dispenser}`,
      "------------------------------------------------------------",
      "Item Description         Batch      Qty    Unit (Rs)  Total (Rs)",
      "------------------------------------------------------------"
    ];

    for (const item of sale.items) {
      // Pad or trim bill columns so the downloaded plain-text receipt stays aligned.
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
  // Report medicines at or below reorder level and batches expiring within 60 days, including expired batches.
  async getAlerts() {
    const medicines = await Medicine.find({ status: "active" }).sort({ name: 1 });
    const batches = await MedicineBatch.find()
      .populate("medicineId", "name category unit price reorderLevel")
      .sort({ expiryDate: 1 });

    const now = new Date();
    // Group batch quantities by medicine ID so each medicine can be matched to its total stock.
    const stockMap = new Map();

    for (const batch of batches) {
      const medId = (batch.medicineId?._id || batch.medicineId).toString();
      stockMap.set(medId, (stockMap.get(medId) || 0) + batch.quantity);
    }

    const lowStock = medicines
      .map((med) => {
        const currentStock = stockMap.get(med._id.toString()) || 0;
        // Calculate how many units are needed to reach the medicine's reorder threshold.
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
        // Convert the remaining expiry time into days for expired, critical, and warning labels.
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
  // Aggregate sale revenue and quantities by period, medicine, and category.
  async getSalesReport(period = "all") {
    let dateFilter = {};
    const now = new Date();

    // Choose the report's lower date boundary; all leaves the query unrestricted.
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

    // Rank the top ten medicines by revenue and calculate each medicine's revenue share.
    const topMedicines = [...medicineMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((med) => ({
        ...med,
        sharePercentage: totalRevenue > 0 ? Number(((med.revenue / totalRevenue) * 100).toFixed(1)) : 0
      }));

    const categoryBreakdown = [...categoryMap.values()].sort((a, b) => b.revenue - a.revenue);

    // Avoid dividing by zero when calculating the average sale value.
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
  // List active patient records available for pharmacy sales.
  async getEligiblePatients() {
    return User.find({ role: ROLES.PATIENT, status: "active" })
      .select("firstName lastName email phone registrationSource portalAccessEnabled")
      .sort({ firstName: 1 });
  },

  // Load active prescriptions with patient and doctor details for dispensing.
  async getActivePrescriptions() {
    return Prescription.find({ status: "active" })
      .populate("patientId", "firstName lastName email phone registrationSource portalAccessEnabled")
      .populate("doctorId", "firstName lastName")
      .sort({ createdAt: -1 });
  }
};
