import * as service from "../services/patientNoticeService.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";
export const listOwned = async (req, res) => successResponse(res, "Notifications loaded", await service.listOwnedNotices(req.user._id));
export const create = async (req, res) => successResponse(res, "Notification created", await service.createNotice(req.body, req.user._id), 201);
export const update = async (req, res) => successResponse(res, "Notification updated", await service.updateNotice(req.params.id, req.user._id, req.body));
export const remove = async (req, res) => successResponse(res, "Notification deleted", await service.deleteNotice(req.params.id, req.user._id));
export const listPatient = async (req, res) => successResponse(res, "Notifications loaded", await service.listPatientNotices(req.user._id));
export const markRead = async (req, res) => successResponse(res, "Notification marked as read", await service.markNoticeRead(req.params.id, req.user._id));
export const patients = async (req, res) => successResponse(res, "Patients loaded", await service.searchPatients(req.validatedQuery.search));
