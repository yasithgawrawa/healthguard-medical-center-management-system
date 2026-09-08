import { Appointment } from "../models/Appointment.js";
import { Consultation } from "../models/Consultation.js";
import { LabRequest } from "../models/LabRequest.js";
import { Prescription } from "../models/Prescription.js";
import { Vitals } from "../models/Vitals.js";
import { ROLES } from "../../../shared/constants/roles.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";
import { AppError } from "../../../shared/utils/AppError.js";

export const createAppointment = async (req, res) => {
  const appointment = await Appointment.create(req.body);
  return successResponse(res, "Appointment booked successfully", appointment, 201);
};

export const listAppointments = async (req, res) => {
  const filter = {};
  if (req.user.role === ROLES.PATIENT) filter.patientId = req.user._id;
  if (req.user.role === ROLES.DOCTOR) filter.doctorId = req.user._id;
  const appointments = await Appointment.find(filter).sort({ appointmentDate: -1 });
  return successResponse(res, "Appointment list loaded", appointments);
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
  const vitals = await Vitals.findOneAndUpdate(
    { appointmentId: req.body.appointmentId },
    { ...req.body, recordedBy: req.user._id },
    { new: true, upsert: true, runValidators: true }
  );
  return successResponse(res, "Vitals recorded successfully", vitals, 201);
};

export const saveConsultation = async (req, res) => {
  const consultation = await Consultation.findOneAndUpdate(
    { appointmentId: req.body.appointmentId },
    req.body,
    { new: true, upsert: true, runValidators: true }
  );
  if (req.body.finalized) {
    await Appointment.findByIdAndUpdate(req.body.appointmentId, { status: "completed" });
  }
  return successResponse(res, "Consultation saved successfully", consultation, 201);
};

export const createPrescription = async (req, res) => {
  const prescription = await Prescription.create(req.body);
  return successResponse(res, "Prescription created successfully", prescription, 201);
};

export const listPrescriptions = async (req, res) => {
  const filter = {};
  if (req.user.role === ROLES.PATIENT) filter.patientId = req.user._id;
  if (req.user.role === ROLES.DOCTOR) filter.doctorId = req.user._id;
  const prescriptions = await Prescription.find(filter).sort({ createdAt: -1 });
  return successResponse(res, "Prescription list loaded", prescriptions);
};

export const createLabRequest = async (req, res) => {
  const labRequest = await LabRequest.create(req.body);
  return successResponse(res, "Lab request created successfully", labRequest, 201);
};

export const listLabRequests = async (req, res) => {
  const filter = {};
  if (req.user.role === ROLES.PATIENT) filter.patientId = req.user._id;
  if (req.user.role === ROLES.DOCTOR) filter.doctorId = req.user._id;
  const requests = await LabRequest.find(filter).sort({ createdAt: -1 });
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
