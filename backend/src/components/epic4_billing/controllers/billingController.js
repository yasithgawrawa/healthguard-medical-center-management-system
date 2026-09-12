import { Attendance } from "../../epic1_user_staff/models/Attendance.js";
import { Staff } from "../../epic1_user_staff/models/Staff.js";
import { Appointment } from "../../epic2_clinical/models/Appointment.js";
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
    .populate("patientId", "firstName lastName email")
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
  return successResponse(res, "Payment recorded successfully", { payment, invoice }, 201);
};

export const listPayments = async (req, res) => {
  const payments = await Payment.find()
    .populate("invoiceId", "patientId subtotal outstandingAmount status")
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
  const staff = await Staff.findById(req.body.staffId);
  if (!staff) throw new AppError("Staff profile not found", 404);

  const existingPayroll = await Payroll.findOne({ staffId: req.body.staffId, month: req.body.month });
  if (existingPayroll) {
    throw new AppError(`Payroll has already been processed for this staff member in ${req.body.month}`, 409);
  }

  const baseSalary = req.body.baseSalary ?? staff.baseSalary;
  const allowances = req.body.allowances ?? staff.allowances ?? 0;
  const deductions = req.body.deductions ?? staff.deductions ?? 0;
  if (!baseSalary || baseSalary <= 0) throw new AppError("Base salary is required on staff profile or payroll form", 400, { baseSalary: "Base salary is required" });
  const attendanceDays = await Attendance.countDocuments({
    staffId: req.body.staffId,
    workDate: { $regex: `^${req.body.month}` },
    status: "checked_out"
  });
  const dailyRate = baseSalary / 26;
  const netSalary = Math.max(dailyRate * attendanceDays + allowances - deductions, 0);
  const payroll = await Payroll.create({ ...req.body, baseSalary, allowances, deductions, attendanceDays, netSalary });
  return successResponse(res, "Payroll calculated successfully", payroll, 201);
};

export const listPayroll = async (req, res) => {
  const filter = {};
  if (![ROLES.MANAGER, ROLES.ADMIN].includes(req.user.role)) {
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
  const invoice = await Invoice.findOne(filter).populate("patientId", "firstName lastName email");
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (invoice.status !== "paid") throw new AppError("Receipt is available only after the invoice is fully paid", 409);

  const lines = [
    "Health Guard Medical Center",
    "Payment Receipt",
    `Invoice: ${invoice._id}`,
    `Issued: ${invoice.updatedAt.toISOString()}`,
    `Patient: ${nameFromUser(invoice.patientId)}`,
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
  if (![ROLES.MANAGER, ROLES.ADMIN].includes(req.user.role) && payroll.staffId?.userId?._id?.toString() !== req.user._id.toString()) {
    throw new AppError("You can only download your own payslip", 403);
  }

  const lines = [
    "Health Guard Medical Center",
    "Staff Payslip",
    `Month: ${payroll.month}`,
    `Staff: ${nameFromUser(payroll.staffId?.userId)} (${payroll.staffId?.employeeId || "-"})`,
    `Status: ${payroll.status}`,
    "",
    `Base Salary: Rs. ${payroll.baseSalary.toFixed(2)}`,
    `Attendance Days: ${payroll.attendanceDays}`,
    `Allowances: Rs. ${payroll.allowances.toFixed(2)}`,
    `Deductions: Rs. ${payroll.deductions.toFixed(2)}`,
    `Net Salary: Rs. ${payroll.netSalary.toFixed(2)}`,
    payroll.paidAt ? `Paid At: ${payroll.paidAt.toISOString()}` : "Paid At: Pending"
  ];

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="healthguard-payslip-${payroll.month}-${payroll._id}.txt"`);
  return res.send(lines.join("\n"));
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

const nameFromUser = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Health Guard user";
