import { Attendance } from "../../epic1_user_staff/models/Attendance.js";
import { Staff } from "../../epic1_user_staff/models/Staff.js";
import { Shift } from "../../epic1_user_staff/models/Shift.js";
import { Appointment } from "../../epic2_clinical/models/Appointment.js";
import { PharmacySale } from "../../epic3_inventory/models/PharmacySale.js";
import { Invoice } from "../models/Invoice.js";
import { Payment } from "../models/Payment.js";
import { Payroll } from "../models/Payroll.js";
import { ROLES } from "../../../shared/constants/roles.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";
import { AppError } from "../../../shared/utils/AppError.js";

const recalculateInvoice = (invoice) => {
  invoice.paidAmount = Math.min(invoice.paidAmount, invoice.subtotal);
  invoice.outstandingAmount = Math.max(invoice.subtotal - invoice.paidAmount, 0);
  invoice.status = invoice.outstandingAmount === 0 ? "paid" : invoice.paidAmount > 0 ? "partially_paid" : "issued";
};

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const shiftLabel = (shift) => {
  if (!shift?.startTime || !shift?.endTime) return "Attendance shift";
  const start = new Date(shift.startTime);
  const end = new Date(shift.endTime);
  return `${start.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" })}`;
};

const hoursBetween = (start, end) => {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return diff > 0 ? Number((diff / 3600000).toFixed(2)) : 0;
};

const buildShiftPayroll = async ({ staffId, month, shiftRate, allowances = 0, deductions = 0 }) => {
  const staff = await Staff.findById(staffId).populate("userId", "firstName lastName email");
  if (!staff) throw new AppError("Staff profile not found", 404);

  const scheduledShifts = await Shift.countDocuments({
    staffId,
    startTime: {
      $gte: new Date(`${month}-01T00:00:00.000Z`),
      $lt: new Date(new Date(`${month}-01T00:00:00.000Z`).setUTCMonth(Number(month.slice(5, 7))))
    },
    status: { $ne: "cancelled" }
  });

  const attendance = await Attendance.find({
    staffId,
    workDate: { $regex: `^${month}` },
    status: "checked_out"
  })
    .populate("shiftId", "startTime endTime location")
    .sort({ workDate: 1, checkInAt: 1 });

  const defaultShiftRate = staff.baseSalary && staff.baseSalary > 0 ? staff.baseSalary / 26 : 0;
  const payableShiftRate = Number(shiftRate ?? defaultShiftRate);
  if (!payableShiftRate || payableShiftRate <= 0) {
    throw new AppError("Shift payment rate is required on the payroll form or staff profile", 400, { shiftRate: "Shift payment rate is required" });
  }

  const payrollLines = attendance.map((item) => {
    const hours = item.shiftId
      ? hoursBetween(item.shiftId.startTime, item.shiftId.endTime)
      : hoursBetween(item.checkInAt, item.checkOutAt);
    return {
      attendanceId: item._id,
      shiftId: item.shiftId?._id,
      workDate: item.workDate,
      shiftLabel: item.shiftId ? `${shiftLabel(item.shiftId)}${item.shiftId.location ? `, ${item.shiftId.location}` : ""}` : shiftLabel(null),
      hours,
      amount: roundMoney(payableShiftRate)
    };
  });

  const payableShifts = payrollLines.length;
  const totalShiftHours = Number(payrollLines.reduce((sum, line) => sum + Number(line.hours || 0), 0).toFixed(2));
  const grossSalary = roundMoney(payableShifts * payableShiftRate);
  const netSalary = Math.max(roundMoney(grossSalary + Number(allowances || 0) - Number(deductions || 0)), 0);

  return {
    staff,
    month,
    payBasis: "shift",
    baseSalary: grossSalary,
    shiftRate: roundMoney(payableShiftRate),
    scheduledShifts,
    payableShifts,
    totalShiftHours,
    attendanceDays: payableShifts,
    payrollLines,
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
    items,
    subtotal,
    outstandingAmount: subtotal,
    createdBy: req.user._id
  });
  return successResponse(res, "Invoice created successfully", invoice, 201);
};

export const listInvoices = async (req, res) => {
  const filter = req.user.role === "patient" ? { patientId: req.user._id } : {};
  const invoices = await Invoice.find(filter)
    .populate("patientId", "firstName lastName email phone")
    .sort({ createdAt: -1 });
  return successResponse(res, "Invoice list loaded", invoices);
};

export const recordPayment = async (req, res) => {
  const invoice = await Invoice.findById(req.body.invoiceId);
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (invoice.status === "cancelled" || invoice.outstandingAmount <= 0) throw new AppError("Invoice is not payable", 409);
  if (req.body.amount > invoice.outstandingAmount) throw new AppError("Payment exceeds outstanding balance", 400);

  const payment = await Payment.create({ ...req.body, recordedBy: req.user._id });
  invoice.paidAmount += req.body.amount;
  recalculateInvoice(invoice);
  await invoice.save();

  if (invoice.status === "paid") {
    await PharmacySale.updateMany({ invoiceId: invoice._id }, { paymentStatus: "paid" });
  }

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

export const createPayroll = async (req, res) => {
  const existingPayroll = await Payroll.findOne({ staffId: req.body.staffId, month: req.body.month });
  if (existingPayroll) {
    throw new AppError(`Payroll has already been processed for this staff member in ${req.body.month}`, 409);
  }

  const calculated = await buildShiftPayroll({
    staffId: req.body.staffId,
    month: req.body.month,
    shiftRate: req.body.shiftRate,
    allowances: req.body.allowances,
    deductions: req.body.deductions
  });
  const payroll = await Payroll.create({
    staffId: req.body.staffId,
    month: req.body.month,
    payBasis: calculated.payBasis,
    baseSalary: calculated.baseSalary,
    shiftRate: calculated.shiftRate,
    scheduledShifts: calculated.scheduledShifts,
    payableShifts: calculated.payableShifts,
    totalShiftHours: calculated.totalShiftHours,
    attendanceDays: calculated.attendanceDays,
    payrollLines: calculated.payrollLines,
    allowances: calculated.allowances,
    deductions: calculated.deductions,
    netSalary: calculated.netSalary
  });
  return successResponse(res, "Payroll calculated successfully", payroll, 201);
};

export const previewPayroll = async (req, res) => {
  const existingPayroll = await Payroll.findOne({ staffId: req.body.staffId, month: req.body.month });
  const calculated = await buildShiftPayroll({
    staffId: req.body.staffId,
    month: req.body.month,
    shiftRate: req.body.shiftRate,
    allowances: req.body.allowances,
    deductions: req.body.deductions
  });
  return successResponse(res, "Shift-based payroll preview loaded", { ...calculated, existingPayroll });
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
  return successResponse(res, "Payroll list loaded", payroll);
};

export const updatePayrollStatus = async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) throw new AppError("Payroll not found", 404);
  const allowed = { draft: "reviewed", reviewed: "approved", approved: "paid" };
  if (allowed[payroll.status] !== req.body.status) throw new AppError("Invalid payroll state transition", 409);
  payroll.status = req.body.status;
  if (req.body.status === "reviewed") payroll.reviewedBy = req.user._id;
  if (req.body.status === "approved") payroll.approvedBy = req.user._id;
  if (req.body.status === "paid") payroll.paidAt = new Date();
  await payroll.save();
  return successResponse(res, "Payroll status updated", payroll);
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
  if (!payroll) throw new AppError("Payroll not found", 404);
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
    `Pay Basis: ${payroll.payBasis || "shift"}`,
    `Payable Shifts: ${payroll.payableShifts ?? payroll.attendanceDays}`,
    `Scheduled Shifts: ${payroll.scheduledShifts ?? "-"}`,
    `Total Shift Hours: ${payroll.totalShiftHours ?? "-"}`,
    `Shift Rate: Rs. ${Number(payroll.shiftRate || 0).toFixed(2)}`,
    `Gross Shift Pay: Rs. ${payroll.baseSalary.toFixed(2)}`,
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
    status: { $in: ["issued", "partially_paid", "draft"] }
  }).sort({ createdAt: 1 });

  if (unpaidInvoices.length <= 1) {
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

  recalculateInvoice(primaryInvoice);
  await primaryInvoice.save();

  return successResponse(res, `Consolidated into one unified visit bill for patient`, primaryInvoice);
};

export const revenueSummary = async (req, res) => {
  const invoices = await Invoice.find();
  const payments = await Payment.find({ status: { $ne: "voided" } });
  const invoiced = invoices.reduce((sum, invoice) => sum + invoice.subtotal, 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
  const collected = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const payroll = await Payroll.find();
  const payrollExpense = payroll.reduce((sum, item) => sum + item.netSalary, 0);
  return successResponse(res, "Revenue summary loaded", { invoiced, collected, outstanding, payrollExpense });
};

const nameFromUser = (user, fallback = "Health Guard user") => [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || fallback;
