import { Appointment } from "../models/Appointment.js";
import { Consultation } from "../models/Consultation.js";
import { LabRequest } from "../models/LabRequest.js";
import { Prescription } from "../models/Prescription.js";
import { Vitals } from "../models/Vitals.js";
import { ROLES } from "../../../shared/constants/roles.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";
import { AppError } from "../../../shared/utils/AppError.js";
import { User } from "../../epic1_user_staff/models/User.js";

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

  const appointment = await Appointment.create(payload);
  return successResponse(res, "Appointment booked successfully", appointment, 201);
};

export const listAppointmentSlots = async (req, res) => {
  const { doctorId, date } = req.validatedQuery || req.query;
  const doctor = await User.findOne({ _id: doctorId, role: ROLES.DOCTOR, status: "active" });
  if (!doctor) throw new AppError("Active doctor not found", 404, { doctorId: "Select an active doctor" });

  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(day.getDate() + 1);

  const booked = await Appointment.find({
    doctorId,
    appointmentDate: { $gte: day, $lt: nextDay },
    status: { $ne: "cancelled" }
  }).select("appointmentDate slotLabel");

  const bookedTimes = new Set(booked.map((item) => item.appointmentDate.toISOString()));
  const slots = Array.from({ length: 8 }, (_, index) => {
    const hour = 9 + index;
    const startsAt = new Date(day);
    startsAt.setHours(hour, 0, 0, 0);
    const label = `${hour < 12 ? "Morning" : "Afternoon"} ${String(hour).padStart(2, "0")}:00`;
    return {
      label,
      startsAt,
      available: startsAt > new Date() && !bookedTimes.has(startsAt.toISOString())
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
    .sort({ appointmentDate: -1 });
  return successResponse(res, "Appointment list loaded", appointments);
};

export const listDoctors = async (req, res) => {
  const doctors = await User.find({ role: ROLES.DOCTOR, status: "active" })
    .select("firstName lastName email")
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
  if (appointment.status === "cancelled" || appointment.status === "completed") {
    throw new AppError("Finalized appointments cannot change status", 409);
  }
  appointment.status = req.body.status;
  await appointment.save();
  return successResponse(res, "Appointment status updated", appointment);
};

export const recordVitals = async (req, res) => {
  const appointment = await Appointment.findById(req.body.appointmentId);
  if (!appointment) throw new AppError("Appointment not found", 404);
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
  return successResponse(res, "Lab request created successfully", labRequest, 201);
};

export const listLabRequests = async (req, res) => {
  const filter = {};
  if (req.user.role === ROLES.PATIENT) filter.patientId = req.user._id;
  if (req.user.role === ROLES.DOCTOR) filter.doctorId = req.user._id;
  const requests = await LabRequest.find(filter)
    .populate("doctorId", "firstName lastName")
    .sort({ createdAt: -1 });
  return successResponse(res, "Lab request list loaded", requests);
};

export const updateLabRequest = async (req, res) => {
  const request = await LabRequest.findById(req.params.id);
  if (!request) throw new AppError("Lab request not found", 404);
  request.status = req.body.status;
  request.resultSummary = req.body.resultSummary ?? request.resultSummary;
  request.resultUrl = req.body.resultUrl ?? request.resultUrl;
  if (req.body.status === "verified") request.verifiedBy = req.user._id;
  await request.save();
  return successResponse(res, "Lab request updated successfully", request);
};
