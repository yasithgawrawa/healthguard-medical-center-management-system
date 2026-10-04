import { Attendance } from "../../epic1_user_staff/models/Attendance.js";
import { Staff } from "../../epic1_user_staff/models/Staff.js";
import { User } from "../../epic1_user_staff/models/User.js";
import { Appointment } from "../../epic2_clinical/models/Appointment.js";
import { PharmacySale } from "../../epic3_inventory/models/PharmacySale.js";
import { Invoice } from "../models/Invoice.js";
import { Payment } from "../models/Payment.js";
import { Payroll } from "../models/Payroll.js";
import { SupplierBill } from "../models/SupplierBill.js";
import { ROLES } from "../../../shared/constants/roles.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";
import { AppError } from "../../../shared/utils/AppError.js";

const recalculateInvoice = (invoice) => {
  invoice.paidAmount = Math.min(invoice.paidAmount, invoice.subtotal);
  invoice.outstandingAmount = Math.max(invoice.subtotal - invoice.paidAmount, 0);
  // Partial payments are not permitted — status is strictly issued → paid
  invoice.status = invoice.outstandingAmount === 0 ? "paid" : "issued";
};

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const buildDailyPayroll = async ({ staffId, month, dailyPay, workingDays, allowances = 0, deductions = 0 }) => {
  const staff = await Staff.findById(staffId).populate("userId", "firstName lastName email");
  if (!staff) throw new AppError("Staff profile not found", 404);

  if (staff.role === ROLES.DOCTOR || staff.payBasis === "exempt") {
    throw new AppError("The doctor is the clinic owner, compensated per appointment consultation, and exempt from employee salary payroll.", 400);
  }

  const payableDailyRate = Number(dailyPay);
  const payableDays = Number(workingDays);
  if (!payableDailyRate || payableDailyRate <= 0) {
    throw new AppError("Daily pay is required", 400, { dailyPay: "Daily pay is required" });
  }
  if (!Number.isInteger(payableDays) || payableDays < 1 || payableDays > 31) {
    throw new AppError("Working days must be between 1 and 31", 400, { workingDays: "Working days must be between 1 and 31" });
  }

  const grossSalary = roundMoney(payableDailyRate * payableDays);
  const netSalary = Math.max(roundMoney(grossSalary + Number(allowances || 0) - Number(deductions || 0)), 0);

  return {
    staff,
    month,
    baseSalary: grossSalary,
    dailyPay: roundMoney(payableDailyRate),
    workingDays: payableDays,
    allowances: Number(allowances || 0),
    deductions: Number(deductions || 0),
    netSalary
  };
};

export const createInvoice = async (req, res) => {
  if (req.body.appointmentId) {
    const appointment = await Appointment.findById(req.body.appointmentId);
    if (!appointment) throw new AppError("Appointment not found", 404);
    if (appointment.status !== "completed") throw new AppError("Only completed medical services can be invoiced", 409);
  }
  const items = req.body.items.map((item) => ({
    ...item,
    lineTotal: item.quantity * item.unitPrice
  }));
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const invoice = await Invoice.create({
    patientId: req.body.patientId,
    customerName: req.body.customerName || (req.body.patientId ? undefined : "Walk-in Customer"),
    customerPhone: req.body.customerPhone,
    appointmentId: req.body.appointmentId,
    invoiceType: "manual",
    items,
    subtotal,
    outstandingAmount: subtotal,
    createdBy: req.user._id
  });
  return successResponse(res, "Invoice created successfully", invoice, 201);
};

export const listInvoices = async (req, res) => {
  const filter = req.user.role === "patient" ? { patientId: req.user._id, status: { $ne: "cancelled" } } : { status: { $ne: "cancelled" } };
  const invoices = await Invoice.find(filter)
    .populate("patientId", "firstName lastName email phone")
    .sort({ createdAt: -1 });
  return successResponse(res, "Invoice list loaded", invoices);
};

export const recordPayment = async (req, res) => {
  const invoice = await Invoice.findById(req.body.invoiceId);
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (invoice.status === "cancelled" || invoice.outstandingAmount <= 0) throw new AppError("Invoice is not payable", 409);

  // Partial payments are not permitted — enforce full settlement in a single transaction
  const requestedAmount = roundMoney(req.body.amount);
  const outstanding = roundMoney(invoice.outstandingAmount);
  if (Math.abs(requestedAmount - outstanding) > 0.01) {
    throw new AppError(
      `Full payment required. Outstanding balance is Rs. ${outstanding.toFixed(2)}. Partial payments are not permitted.`,
      400
    );
  }

  const payment = await Payment.create({ ...req.body, amount: outstanding, recordedBy: req.user._id });
  invoice.paidAmount += outstanding;
  recalculateInvoice(invoice);
  await invoice.save();

  // Mark all related pharmacy sales as paid
  await PharmacySale.updateMany({ invoiceId: invoice._id }, { paymentStatus: "paid" });

  await invoice.populate("patientId", "firstName lastName email phone");

  return successResponse(res, "Payment recorded successfully", { payment, invoice }, 201);
};

export const listPayments = async (req, res) => {
  const payments = await Payment.find()
    .populate("invoiceId", "patientId customerName customerPhone subtotal outstandingAmount status")
    .sort({ createdAt: -1 });
  return successResponse(res, "Payment list loaded", payments);
};

export const updatePaymentStatus = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new AppError("Payment not found", 404);
  if (payment.status === "voided") throw new AppError("Voided payments cannot change status", 409);
  payment.status = req.body.status;
  if (req.body.status === "verified") payment.verifiedBy = req.user._id;
  await payment.save();
  return successResponse(res, "Payment status updated", payment);
};

export const listSupplierBills = async (req, res) => {
  const bills = await SupplierBill.find({ status: { $ne: "cancelled" } })
    .populate("supplierId", "name phone email")
    .populate({
      path: "purchaseId",
      populate: [
        { path: "medicineId", select: "name unit category" },
        { path: "batchId", select: "batchNumber" }
      ]
    })
    .sort({ createdAt: -1 });
  return successResponse(res, "Supplier bills loaded", bills);
};

export const paySupplierBill = async (req, res) => {
  const bill = await SupplierBill.findById(req.params.id);
  if (!bill) throw new AppError("Supplier bill not found", 404);
  if (bill.status !== "pending") throw new AppError("Supplier bill is not payable", 409);

  bill.status = "paid";
  bill.method = req.body.method;
  bill.paidAt = new Date();
  bill.paidBy = req.user._id;
  await bill.save();

  await bill.populate([
    { path: "supplierId", select: "name phone email" },
    {
      path: "purchaseId",
      populate: [
        { path: "medicineId", select: "name unit category" },
        { path: "batchId", select: "batchNumber" }
      ]
    }
  ]);

  return successResponse(res, "Supplier bill marked as paid", bill);
};

export const createPayroll = async (req, res) => {
  const existingPayroll = await Payroll.findOne({ staffId: req.body.staffId, month: req.body.month });
  if (existingPayroll) {
    throw new AppError(`Salary has already been processed for this staff member in ${req.body.month}`, 409);
  }

  const calculated = await buildDailyPayroll({
    staffId: req.body.staffId,
    month: req.body.month,
    dailyPay: req.body.dailyPay,
    workingDays: req.body.workingDays,
    allowances: req.body.allowances,
    deductions: req.body.deductions
  });
  if (calculated.workingDays === 0) {
    throw new AppError("Salary cannot be created without at least one working day", 409);
  }
  if (calculated.deductions > calculated.baseSalary + calculated.allowances) {
    throw new AppError("Deductions cannot exceed gross pay plus allowances", 400, { deductions: "Deductions are too high" });
  }
  const payroll = await Payroll.create({
    staffId: req.body.staffId,
    month: req.body.month,
    baseSalary: calculated.baseSalary,
    dailyPay: calculated.dailyPay,
    workingDays: calculated.workingDays,
    allowances: calculated.allowances,
    deductions: calculated.deductions,
    netSalary: calculated.netSalary
  });
  return successResponse(res, "Salary calculated successfully", payroll, 201);
};

export const previewPayroll = async (req, res) => {
  const existingPayroll = await Payroll.findOne({ staffId: req.body.staffId, month: req.body.month });
  const calculated = await buildDailyPayroll({
    staffId: req.body.staffId,
    month: req.body.month,
    dailyPay: req.body.dailyPay,
    workingDays: req.body.workingDays,
    allowances: req.body.allowances,
    deductions: req.body.deductions
  });
  return successResponse(res, "Salary preview loaded", { ...calculated, existingPayroll });
};

export const getSalaryAttendanceDays = async (req, res) => {
  const { staffId, month } = req.validatedQuery || req.query;
  const staff = await Staff.findById(staffId);
  if (!staff) throw new AppError("Staff profile not found", 404);

  const workingDays = await Attendance.countDocuments({
    staffId,
    workDate: { $regex: `^${month}` },
    status: "checked_out"
  });

  return successResponse(res, "Attendance working days loaded", { staffId, month, workingDays });
};

export const listPayroll = async (req, res) => {
  const filter = {};
  if (![ROLES.MANAGER, ROLES.ADMIN, ROLES.CASHIER].includes(req.user.role)) {
    const staff = await Staff.findOne({ userId: req.user._id });
    if (!staff) throw new AppError("Staff profile not found", 404);
    filter.staffId = staff._id;
  }
  const payroll = await Payroll.find(filter)
    .populate({ path: "staffId", populate: { path: "userId", select: "firstName lastName email" } })
    .sort({ month: -1, createdAt: -1 });
  return successResponse(res, "Salary list loaded", payroll);
};

export const updatePayrollStatus = async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) throw new AppError("Salary record not found", 404);
  const allowed = { draft: "reviewed", reviewed: "approved", approved: "paid" };
  if (allowed[payroll.status] !== req.body.status) throw new AppError("Invalid salary state transition", 409);
  if (["reviewed", "approved"].includes(req.body.status) && ![ROLES.MANAGER, ROLES.ADMIN].includes(req.user.role)) {
    throw new AppError("Only a manager or admin can review and approve salary", 403);
  }
  if (req.body.status === "paid" && ![ROLES.CASHIER, ROLES.ADMIN].includes(req.user.role)) {
    throw new AppError("Only a cashier or admin can mark salary as paid", 403);
  }
  payroll.status = req.body.status;
  if (req.body.status === "reviewed") payroll.reviewedBy = req.user._id;
  if (req.body.status === "approved") payroll.approvedBy = req.user._id;
  if (req.body.status === "paid") payroll.paidAt = new Date();
  await payroll.save();
  return successResponse(res, "Salary status updated", payroll);
};

export const downloadInvoiceReceipt = async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === ROLES.PATIENT) filter.patientId = req.user._id;
  const invoice = await Invoice.findOne(filter).populate("patientId", "firstName lastName email phone");
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (invoice.status !== "paid") throw new AppError("Receipt is available only after the invoice is fully paid", 409);

  const lines = [
    "Health Guard Medical Center",
    "Payment Receipt",
    `Invoice: ${invoice._id}`,
    `Issued: ${invoice.updatedAt.toISOString()}`,
    `Patient: ${invoice.customerName || nameFromUser(invoice.patientId, "Walk-in Customer")}`,
    `Phone: ${invoice.customerPhone || invoice.patientId?.phone || "-"}`,
    "",
    "Items",
    ...invoice.items.map((item) => `${item.description} x ${item.quantity} @ Rs. ${item.unitPrice.toFixed(2)} = Rs. ${item.lineTotal.toFixed(2)}`),
    "",
    `Total: Rs. ${invoice.subtotal.toFixed(2)}`,
    `Paid: Rs. ${invoice.paidAmount.toFixed(2)}`,
    "Status: Paid"
  ];

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="healthguard-receipt-${invoice._id}.txt"`);
  return res.send(lines.join("\n"));
};

export const downloadPayslip = async (req, res) => {
  const payroll = await Payroll.findById(req.params.id)
    .populate({ path: "staffId", populate: { path: "userId", select: "firstName lastName email" } });
  if (!payroll) throw new AppError("Salary record not found", 404);
  if (![ROLES.MANAGER, ROLES.ADMIN, ROLES.CASHIER].includes(req.user.role) && payroll.staffId?.userId?._id?.toString() !== req.user._id.toString()) {
    throw new AppError("You can only download your own payslip", 403);
  }

  const lines = [
    "Health Guard Medical Center",
    "Staff Payslip",
    `Month: ${payroll.month}`,
    `Staff: ${nameFromUser(payroll.staffId?.userId)} (${payroll.staffId?.employeeId || "-"})`,
    `Status: ${payroll.status}`,
    "",
    "Pay Basis: daily",
    `Working Days: ${payroll.workingDays ?? payroll.payableShifts ?? payroll.attendanceDays}`,
    `Daily Pay: Rs. ${Number(payroll.dailyPay ?? payroll.shiftRate ?? 0).toFixed(2)}`,
    `Gross Pay: Rs. ${payroll.baseSalary.toFixed(2)}`,
    `Allowances: Rs. ${payroll.allowances.toFixed(2)}`,
    `Deductions: Rs. ${payroll.deductions.toFixed(2)}`,
    `Net Salary: Rs. ${payroll.netSalary.toFixed(2)}`,
    payroll.paidAt ? `Paid At: ${payroll.paidAt.toISOString()}` : "Paid At: Pending"
  ];

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="healthguard-payslip-${payroll.month}-${payroll._id}.txt"`);
  return res.send(lines.join("\n"));
};

export const consolidatePatientInvoices = async (req, res) => {
  const { patientId } = req.body;
  if (!patientId) throw new AppError("Patient ID is required", 400);

  const unpaidInvoices = await Invoice.find({
    patientId,
    status: { $in: ["issued", "draft"] }
  }).sort({ createdAt: 1 });

  if (unpaidInvoices.length <= 1) {
    if (unpaidInvoices[0]) {
      await unpaidInvoices[0].populate("patientId", "firstName lastName email phone");
    }
    return successResponse(res, "Single bill already unified", unpaidInvoices[0] || null);
  }

  const primaryInvoice = unpaidInvoices[0];
  const otherInvoices = unpaidInvoices.slice(1);

  for (const other of otherInvoices) {
    primaryInvoice.items.push(...other.items);
    primaryInvoice.paidAmount += other.paidAmount || 0;
    other.status = "cancelled";
    await other.save();

    await PharmacySale.updateMany({ invoiceId: other._id }, { invoiceId: primaryInvoice._id });
  }

  primaryInvoice.invoiceType = "visit";
  primaryInvoice.subtotal = primaryInvoice.items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
  recalculateInvoice(primaryInvoice);
  await primaryInvoice.save();
  await primaryInvoice.populate("patientId", "firstName lastName email phone");

  return successResponse(res, "Consolidated into one unified bill for patient", primaryInvoice);
};

export const revenueSummary = async (req, res) => {
  const invoices = await Invoice.find({ status: { $ne: "cancelled" } });
  const payments = await Payment.find({ status: { $ne: "voided" } });
  const supplierBills = await SupplierBill.find({ status: { $ne: "cancelled" } });
  const invoiced = invoices.reduce((sum, invoice) => sum + invoice.subtotal, 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
  const collected = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const payroll = await Payroll.find();
  const payrollExpense = payroll.reduce((sum, item) => sum + item.netSalary, 0);
  const supplierPayables = supplierBills.reduce((sum, item) => sum + (item.status === "pending" ? item.amount : 0), 0);
  const supplierPaid = supplierBills.reduce((sum, item) => sum + (item.status === "paid" ? item.amount : 0), 0);

  let doctorConsultationInvoiced = 0;
  invoices.forEach((inv) => {
    inv.items?.forEach((item) => {
      const desc = (item.description || "").toLowerCase();
      if (desc.includes("consultation") || desc.includes("channelling")) {
        doctorConsultationInvoiced += Number(item.lineTotal || 0);
      }
    });
  });

  return successResponse(res, "Revenue summary loaded", {
    invoiced,
    collected,
    outstanding,
    payrollExpense,
    supplierPayables,
    supplierPaid,
    doctorConsultationInvoiced,
    netClinicProfit: collected - payrollExpense - supplierPaid
  });
};

export const getDoctorEarnings = async (req, res) => {
  let doctorUserId = req.user.role === ROLES.DOCTOR ? req.user._id : req.query.doctorId;
  if (!doctorUserId) {
    const defaultDoc = await User.findOne({ role: ROLES.DOCTOR, status: "active" });
    if (defaultDoc) doctorUserId = defaultDoc._id;
  }

  if (!doctorUserId) {
    return successResponse(res, "Doctor earnings loaded", {
      totalAppointments: 0,
      completedConsultations: 0,
      consultationFeesBilled: 0,
      consultationFeesCollected: 0,
      outstandingFees: 0,
      consultations: []
    });
  }

  const appointments = await Appointment.find({ doctorId: doctorUserId })
    .populate("patientId", "firstName lastName email phone")
    .sort({ appointmentDate: -1 });

  const apptIds = appointments.map((a) => a._id);
  const invoices = await Invoice.find({ appointmentId: { $in: apptIds }, invoiceType: { $in: ["visit", null] } });

  const invoiceByApptId = new Map();
  invoices.forEach((inv) => {
    invoiceByApptId.set(inv.appointmentId.toString(), inv);
  });

  let totalBilled = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;

  const consultationList = appointments.map((appt) => {
    const inv = invoiceByApptId.get(appt._id.toString());
    const consultItem = inv?.items?.find((item) => {
      const d = (item.description || "").toLowerCase();
      return d.includes("consultation") || d.includes("channelling");
    });
    const fee = consultItem ? Number(consultItem.lineTotal || 0) : Number(inv?.subtotal || 0);
    const isPaid = inv?.status === "paid";
    const paid = isPaid ? fee : 0;
    const due = Math.max(fee - paid, 0);

    if (fee > 0) {
      totalBilled += fee;
      totalCollected += paid;
      totalOutstanding += due;
    }

    return {
      appointmentId: appt._id,
      patientName: nameFromUser(appt.patientId, "Registered Patient"),
      patientPhone: appt.patientId?.phone || "-",
      appointmentDate: appt.appointmentDate,
      slotLabel: appt.slotLabel,
      reason: appt.reason,
      status: appt.status,
      consultationFee: fee,
      paidAmount: paid,
      outstandingAmount: due,
      paymentStatus: inv ? inv.status : "unbilled",
      invoiceId: inv?._id
    };
  });

  const completed = appointments.filter((a) => a.status === "completed").length;

  return successResponse(res, "Doctor earnings loaded", {
    totalAppointments: appointments.length,
    completedConsultations: completed,
    consultationFeesBilled: totalBilled,
    consultationFeesCollected: totalCollected,
    outstandingFees: totalOutstanding,
    consultations: consultationList.slice(0, 20)
  });
};

const nameFromUser = (user, fallback = "Health Guard user") => [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || fallback;
