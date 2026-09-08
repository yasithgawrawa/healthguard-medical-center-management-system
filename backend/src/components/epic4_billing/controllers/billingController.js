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
  const attendanceDays = await Attendance.countDocuments({
    staffId: req.body.staffId,
    workDate: { $regex: `^${req.body.month}` },
    status: "checked_out"
  });
  const dailyRate = req.body.baseSalary / 26;
  const netSalary = Math.max(dailyRate * attendanceDays + req.body.allowances - req.body.deductions, 0);
  const payroll = await Payroll.create({ ...req.body, attendanceDays, netSalary });
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
