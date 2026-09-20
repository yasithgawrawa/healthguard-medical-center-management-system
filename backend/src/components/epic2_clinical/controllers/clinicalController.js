import { Appointment } from "../models/Appointment.js";
import { Consultation } from "../models/Consultation.js";
import { LabRequest } from "../models/LabRequest.js";
import { LabTestCatalog } from "../models/LabTestCatalog.js";
import { Notification } from "../models/Notification.js";
import { Prescription } from "../models/Prescription.js";
import { Vitals } from "../models/Vitals.js";
import { ROLES } from "../../../shared/constants/roles.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";
import { AppError } from "../../../shared/utils/AppError.js";
import { User } from "../../epic1_user_staff/models/User.js";
import { Invoice } from "../../epic4_billing/models/Invoice.js";

const isFutureAppointmentDate = (value) => {
  const startOfTomorrow = new Date();
  startOfTomorrow.setHours(24, 0, 0, 0);
  return new Date(value) >= startOfTomorrow;
};

export const createAppointment = async (req, res) => {
  const payload = {
    ...req.body,
    patientId: req.user.role === ROLES.PATIENT ? req.user._id : req.body.patientId
  };

  if (!payload.patientId) {
    throw new AppError("Patient is required", 400, { patientId: "Patient is required" });
  }

  const doctor = await User.findOne({ _id: payload.doctorId, role: ROLES.DOCTOR, status: "active" });
  if (!doctor) {
    throw new AppError("Active doctor not found", 404, { doctorId: "Select an active doctor" });
  }

  // Validate that the requested appointmentDate falls on a valid clinic slot.
  // Slots are stored as IST times (+05:30): clinic hours 9-16 IST = 3:30-10:30 UTC.
  // We check the IST hour by offsetting by 330 minutes (5h30m).
  const requestedDate = new Date(payload.appointmentDate);
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30 in milliseconds
  const istHour = Math.floor(((requestedDate.getTime() + IST_OFFSET_MS) % 86400000) / 3600000);
  const istMinutes = Math.floor(((requestedDate.getTime() + IST_OFFSET_MS) % 3600000) / 60000);
  const validSlotHours = [9, 10, 11, 12, 13, 14, 15, 16];
  if (!validSlotHours.includes(istHour) || istMinutes !== 0) {
    throw new AppError("Invalid appointment slot. Please select a valid time slot from the available options.", 400, { appointmentDate: "Invalid slot selected" });
  }

  // Guard against double-booking: re-check availability at submission time
  const slashClash = await Appointment.findOne({
    doctorId: payload.doctorId,
    appointmentDate: requestedDate,
    status: { $ne: "cancelled" }
  });
  if (slashClash) {
    throw new AppError("This slot has just been booked by someone else. Please select a different time.", 409, { appointmentDate: "Slot no longer available" });
  }

  const appointment = await Appointment.create(payload);

  // Automatically initialize patient visit invoice with doctor consultation fee
  try {
    const docName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
    const consultationFee = Number(doctor.consultationFee || 1500);
    await Invoice.create({
      patientId: appointment.patientId,
      appointmentId: appointment._id,
      invoiceType: "visit",
      items: [{
        description: `Doctor Consultation & Channelling (${docName} - ${appointment.slotLabel || "Standard"})`,
        quantity: 1,
        unitPrice: consultationFee,
        lineTotal: consultationFee
      }],
      subtotal: consultationFee,
      paidAmount: 0,
      outstandingAmount: consultationFee,
      status: "issued",
      createdBy: req.user._id
    });
  } catch (invErr) {
    // Non-blocking fallback
  }

  return successResponse(res, "Appointment booked successfully", appointment, 201);
};

export const listAppointmentSlots = async (req, res) => {
  const { doctorId, date } = req.validatedQuery || req.query;
  const doctor = await User.findOne({ _id: doctorId, role: ROLES.DOCTOR, status: "active" });
  if (!doctor) throw new AppError("Active doctor not found", 404, { doctorId: "Select an active doctor" });

  // Build slot timestamps using IST offset (+05:30) so clinic hours 9-16 are stored correctly.
  // e.g. "09:00 IST" = "2026-09-21T03:30:00.000Z" in UTC — correctly displays as 9 AM locally.
  const IST_OFFSET = "+05:30";
  const slotHours = [9, 10, 11, 12, 13, 14, 15, 16];

  const slotISOs = slotHours.map((hour) =>
    `${date}T${String(hour).padStart(2, "00")}:00:00.000${IST_OFFSET}`
  );

  // Query window: full IST day — midnight IST to 23:59 IST (expressed in UTC)
  const startOfDayIST = new Date(`${date}T00:00:00.000${IST_OFFSET}`);
  const endOfDayIST = new Date(`${date}T23:59:59.999${IST_OFFSET}`);
  const booked = await Appointment.find({
    doctorId,
    appointmentDate: { $gte: startOfDayIST, $lte: endOfDayIST },
    status: { $ne: "cancelled" }
  }).select("appointmentDate");

  const bookedISOs = new Set(booked.map((item) => new Date(item.appointmentDate).toISOString()));
  const now = new Date();

  const slots = slotISOs.map((iso, index) => {
    const startsAt = new Date(iso);
    const hour = slotHours[index];
    const label = `${hour < 12 ? "Morning" : "Afternoon"} ${String(hour).padStart(2, "0")}:00`;
    return {
      label,
      startsAt: startsAt.toISOString(), // canonical UTC ISO for storage
      available: startsAt > now && !bookedISOs.has(startsAt.toISOString())
    };
  });

  return successResponse(res, "Available appointment slots loaded", slots);
};

export const listAppointments = async (req, res) => {
  const filter = {};
  if (req.user.role === ROLES.PATIENT) filter.patientId = req.user._id;
  if (req.user.role === ROLES.DOCTOR) filter.doctorId = req.user._id;
  const appointments = await Appointment.find(filter)
    .populate("patientId", "firstName lastName email phone")
    .populate("doctorId", "firstName lastName email")
    .sort({ appointmentDate: -1 })
    .lean();

  const apptIds = appointments.map((a) => a._id);
  const [vitalsList, consultationsList] = await Promise.all([
    Vitals.find({ appointmentId: { $in: apptIds } }).lean(),
    Consultation.find({ appointmentId: { $in: apptIds } }).lean()
  ]);

  const vitalsMap = new Map(vitalsList.map((v) => [v.appointmentId.toString(), v]));
  const consultMap = new Map(consultationsList.map((c) => [c.appointmentId.toString(), c]));

  const enriched = appointments.map((a) => ({
    ...a,
    vitals: vitalsMap.get(a._id.toString()) || null,
    consultation: consultMap.get(a._id.toString()) || null
  }));

  return successResponse(res, "Appointment list loaded", enriched);
};

export const listDoctors = async (req, res) => {
  const doctors = await User.find({ role: ROLES.DOCTOR, status: "active" })
    .select("firstName lastName email consultationFee")
    .sort({ firstName: 1 });

  return successResponse(res, "Doctor list loaded", doctors);
};

export const cancelAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new AppError("Appointment not found", 404);
  if (req.user.role === ROLES.PATIENT && appointment.patientId.toString() !== req.user._id.toString()) {
    throw new AppError("You can only cancel your own appointments", 403);
  }
  if (appointment.status !== "booked") {
    throw new AppError("Only booked appointments can be cancelled", 409);
  }
  if (appointment.appointmentDate <= new Date()) {
    throw new AppError("Past appointments cannot be cancelled", 409);
  }
  appointment.status = "cancelled";
  await appointment.save();
  return successResponse(res, "Appointment cancelled", appointment);
};

export const updateAppointmentStatus = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new AppError("Appointment not found", 404);
  if (req.user.role === ROLES.NURSE && (appointment.status !== "booked" || req.body.status !== "checked_in")) {
    throw new AppError("Nurses can only check in booked patients", 403);
  }
  if (appointment.status === "cancelled" || appointment.status === "completed") {
    throw new AppError("Finalized appointments cannot change status", 409);
  }
  if (["checked_in", "in_consultation", "completed"].includes(req.body.status) && isFutureAppointmentDate(appointment.appointmentDate)) {
    throw new AppError("Future appointments cannot be checked in or moved to consultation", 409);
  }
  appointment.status = req.body.status;
  await appointment.save();
  return successResponse(res, "Appointment status updated", appointment);
};

export const recordVitals = async (req, res) => {
  const appointment = await Appointment.findById(req.body.appointmentId);
  if (!appointment) throw new AppError("Appointment not found", 404);
  if (req.user.role === ROLES.NURSE && appointment.status !== "checked_in") {
    throw new AppError("Nurses can only record vitals for checked-in patients", 403);
  }
  const vitals = await Vitals.findOneAndUpdate(
    { appointmentId: req.body.appointmentId },
    { ...req.body, patientId: req.body.patientId || appointment.patientId, recordedBy: req.user._id },
    { new: true, upsert: true, runValidators: true }
  );
  return successResponse(res, "Vitals recorded successfully", vitals, 201);
};

export const saveConsultation = async (req, res) => {
  const appointment = await Appointment.findById(req.body.appointmentId);
  if (!appointment) throw new AppError("Appointment not found", 404);
  if (isFutureAppointmentDate(appointment.appointmentDate)) {
    throw new AppError("Consultation can only be recorded on or after the appointment date", 409);
  }
  const consultation = await Consultation.findOneAndUpdate(
    { appointmentId: req.body.appointmentId },
    {
      ...req.body,
      patientId: req.body.patientId || appointment.patientId,
      doctorId: req.user.role === ROLES.DOCTOR ? req.user._id : req.body.doctorId || appointment.doctorId
    },
    { new: true, upsert: true, runValidators: true }
  );
  if (req.body.finalized) {
    await Appointment.findByIdAndUpdate(req.body.appointmentId, { status: "completed" });
  }
  return successResponse(res, "Consultation saved successfully", consultation, 201);
};

export const createPrescription = async (req, res) => {
  const appointment = await Appointment.findById(req.body.appointmentId);
  if (!appointment) throw new AppError("Appointment not found", 404);
  const prescription = await Prescription.create({
    ...req.body,
    patientId: req.body.patientId || appointment.patientId,
    doctorId: req.user.role === ROLES.DOCTOR ? req.user._id : req.body.doctorId || appointment.doctorId
  });
  return successResponse(res, "Prescription created successfully", prescription, 201);
};

export const listPrescriptions = async (req, res) => {
  const filter = {};
  if (req.user.role === ROLES.PATIENT) filter.patientId = req.user._id;
  if (req.user.role === ROLES.DOCTOR) filter.doctorId = req.user._id;
  const prescriptions = await Prescription.find(filter)
    .populate("doctorId", "firstName lastName")
    .sort({ createdAt: -1 });
  return successResponse(res, "Prescription list loaded", prescriptions);
};

export const createLabRequest = async (req, res) => {
  const appointment = await Appointment.findById(req.body.appointmentId);
  if (!appointment) throw new AppError("Appointment not found", 404);
  const labRequest = await LabRequest.create({
    ...req.body,
    patientId: req.body.patientId || appointment.patientId,
    doctorId: req.user.role === ROLES.DOCTOR ? req.user._id : req.body.doctorId || appointment.doctorId
  });
  await Notification.create({
    patientId: labRequest.patientId,
    type: "lab_request",
    title: "New lab test requested",
    message: `${labRequest.testName} has been requested by your doctor.`,
    relatedModel: "LabRequest",
    relatedId: labRequest._id,
    createdBy: req.user._id
  });

  // Append lab investigation fee to the patient's unified visit invoice
  try {
    let testFee = req.body.priority === "urgent" ? 1200 : 750;
    const catalogItem = await LabTestCatalog.findOne({ testName: req.body.testName });
    if (catalogItem) {
      testFee = req.body.priority === "urgent"
        ? (catalogItem.urgentPrice || Math.round(catalogItem.price * 1.4))
        : catalogItem.price;
    }
    let visitInvoice = await Invoice.findOne({ appointmentId: appointment._id, invoiceType: { $in: ["visit", null] }, status: { $ne: "cancelled" } });
    if (!visitInvoice) {
      visitInvoice = await Invoice.findOne({ patientId: appointment.patientId, invoiceType: { $in: ["visit", null] }, status: { $in: ["issued", "partially_paid", "draft"] } }).sort({ createdAt: -1 });
    }
    const labItem = {
      description: `Lab Investigation: ${labRequest.testName} (${labRequest.priority || "routine"})`,
      quantity: 1,
      unitPrice: testFee,
      lineTotal: testFee
    };
    if (visitInvoice && visitInvoice.status !== "paid") {
      visitInvoice.items.push(labItem);
      visitInvoice.subtotal = visitInvoice.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
      visitInvoice.outstandingAmount = Math.max(0, visitInvoice.subtotal - (visitInvoice.paidAmount || 0));
      await visitInvoice.save();
    } else {
      await Invoice.create({
        patientId: appointment.patientId,
        appointmentId: appointment._id,
        invoiceType: "visit",
        items: [labItem],
        subtotal: testFee,
        paidAmount: 0,
        outstandingAmount: testFee,
        status: "issued",
        createdBy: req.user._id
      });
    }
  } catch (invErr) {
    // Non-blocking fallback
  }

  return successResponse(res, "Lab request created successfully", labRequest, 201);
};

export const listLabRequests = async (req, res) => {
  const filter = {};
  if (req.user.role === ROLES.PATIENT) filter.patientId = req.user._id;
  if (req.user.role === ROLES.DOCTOR) filter.doctorId = req.user._id;
  const requests = await LabRequest.find(filter)
    .populate("patientId", "firstName lastName phone email dateOfBirth gender")
    .populate("doctorId", "firstName lastName")
    .populate("verifiedBy", "firstName lastName")
    .populate("appointmentId", "slotLabel appointmentDate reason")
    .sort({ createdAt: -1 });
  return successResponse(res, "Lab request list loaded", requests);
};

export const updateLabRequest = async (req, res) => {
  const request = await LabRequest.findById(req.params.id);
  if (!request) throw new AppError("Lab request not found", 404);
  const wasIncomplete = request.status !== "completed" && request.status !== "verified";
  request.status = req.body.status;
  request.resultSummary = req.body.resultSummary ?? request.resultSummary;
  request.resultUrl = req.body.resultUrl ?? request.resultUrl;
  if (req.body.parameters !== undefined) request.parameters = req.body.parameters;
  if (req.body.specimenType !== undefined) request.specimenType = req.body.specimenType;
  if (req.body.sampleCollectedAt !== undefined) request.sampleCollectedAt = req.body.sampleCollectedAt;
  if (req.body.reportedAt !== undefined) request.reportedAt = req.body.reportedAt;
  if (["completed", "verified"].includes(req.body.status)) {
    request.verifiedBy = req.user._id;
    if (!request.reportedAt) request.reportedAt = new Date();
  }
  await request.save();
  const populated = await LabRequest.findById(request._id)
    .populate("patientId", "firstName lastName phone email dateOfBirth gender")
    .populate("doctorId", "firstName lastName")
    .populate("verifiedBy", "firstName lastName")
    .populate("appointmentId", "slotLabel appointmentDate reason");
  if (wasIncomplete && ["completed", "verified"].includes(request.status)) {
    await Notification.create({
      patientId: request.patientId,
      type: "lab_result",
      title: "Lab result is ready",
      message: `${request.testName} result has been uploaded to your patient portal.`,
      relatedModel: "LabRequest",
      relatedId: request._id,
      createdBy: req.user._id
    });
  }
  return successResponse(res, "Lab request updated successfully", populated);
};

export const listNotifications = async (req, res) => {
  const notifications = await Notification.find({ patientId: req.user._id }).sort({ createdAt: -1 }).limit(25);
  return successResponse(res, "Patient notifications loaded", notifications);
};

export const markNotificationRead = async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, patientId: req.user._id });
  if (!notification) throw new AppError("Notification not found", 404);
  notification.readAt = notification.readAt || new Date();
  await notification.save();
  return successResponse(res, "Notification marked as read", notification);
};

export const listLabTestCatalog = async (req, res) => {
  let tests = await LabTestCatalog.find().sort({ category: 1, testName: 1 });
  if (tests.length === 0) {
    // Auto-seed default tests if empty
    const defaults = [
      { testName: "Full Blood Count (FBC)", category: "Hematology", price: 850, urgentPrice: 1200 },
      { testName: "Fasting Blood Sugar (FBS)", category: "Biochemistry", price: 650, urgentPrice: 950 },
      { testName: "Lipid Profile", category: "Biochemistry", price: 1800, urgentPrice: 2400 },
      { testName: "Urine Full Report (UFR)", category: "Clinical Pathology", price: 550, urgentPrice: 800 },
      { testName: "Serum Creatinine", category: "Biochemistry", price: 750, urgentPrice: 1100 },
      { testName: "Liver Function Test (LFT)", category: "Biochemistry", price: 2200, urgentPrice: 2800 },
      { testName: "HbA1c Glycated Hemoglobin", category: "Biochemistry", price: 1400, urgentPrice: 1900 },
      { testName: "Serum Electrolytes", category: "Biochemistry", price: 1200, urgentPrice: 1650 }
    ];
    tests = await LabTestCatalog.insertMany(defaults);
  }
  return successResponse(res, "Lab test catalog loaded", tests);
};

export const createLabTestCatalog = async (req, res) => {
  const { testName, category, price, urgentPrice, description } = req.body;
  if (!testName || price === undefined) throw new AppError("Test name and price are required", 400);
  const item = await LabTestCatalog.create({
    testName: testName.trim(),
    category: category || "Routine Investigation",
    price: Number(price),
    urgentPrice: urgentPrice ? Number(urgentPrice) : Math.round(Number(price) * 1.4),
    description: description || "",
    updatedBy: req.user._id
  });
  return successResponse(res, "Lab test added to catalog", item, 201);
};

export const updateLabTestPrice = async (req, res) => {
  const { price, urgentPrice, category, description } = req.body;
  const item = await LabTestCatalog.findById(req.params.id);
  if (!item) throw new AppError("Lab test not found in catalog", 404);

  if (price !== undefined) item.price = Number(price);
  if (urgentPrice !== undefined) item.urgentPrice = Number(urgentPrice);
  if (category) item.category = category;
  if (description !== undefined) item.description = description;
  item.updatedBy = req.user._id;

  await item.save();
  return successResponse(res, `Price updated for ${item.testName}`, item);
};

export const updateDoctorFee = async (req, res) => {
  const targetDoctorId = req.user.role === ROLES.DOCTOR ? req.user._id : req.body.doctorId;
  if (!targetDoctorId) throw new AppError("Doctor ID is required", 400);

  const fee = Number(req.body.consultationFee);
  if (isNaN(fee) || fee < 0) throw new AppError("A valid consultation fee is required", 400);

  const doctor = await User.findOneAndUpdate(
    { _id: targetDoctorId, role: ROLES.DOCTOR },
    { consultationFee: fee },
    { new: true }
  ).select("firstName lastName email consultationFee");

  if (!doctor) throw new AppError("Doctor not found", 404);
  return successResponse(res, `Consultation fee updated to Rs. ${fee.toFixed(2)}`, doctor);
};
