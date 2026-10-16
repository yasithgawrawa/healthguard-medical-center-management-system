// Patient Notifications | Controller | Handle patient notice HTTP requests and return consistent API responses.
import * as service from "../services/patientNoticeService.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";
// View Managed Notifications | Controller | Return notices owned by the signed-in manager.
export const listOwned = async (req, res) => successResponse(res, "Notifications loaded", await service.listOwnedNotices(req.user._id));
// Create Patient Notification | Controller | Create a notice for the signed-in manager and return HTTP 201.
export const create = async (req, res) => successResponse(res, "Notification created", await service.createNotice(req.body, req.user._id), 201);
// Update Patient Notification | Controller | Update the manager-owned notice identified by the route ID.
export const update = async (req, res) => successResponse(res, "Notification updated", await service.updateNotice(req.params.id, req.user._id, req.body));
// Delete Patient Notification | Controller | Delete the manager-owned notice identified by the route ID.
export const remove = async (req, res) => successResponse(res, "Notification deleted", await service.deleteNotice(req.params.id, req.user._id));
// View Patient Notifications | Controller | Return notices visible to the signed-in patient.
export const listPatient = async (req, res) => successResponse(res, "Notifications loaded", await service.listPatientNotices(req.user._id));
// Mark Notification Read | Controller | Mark an eligible notice as read for the signed-in patient.
export const markRead = async (req, res) => successResponse(res, "Notification marked as read", await service.markNoticeRead(req.params.id, req.user._id));
// Search Patients | Controller | Return active patient matches for the validated search query.
export const patients = async (req, res) => successResponse(res, "Patients loaded", await service.searchPatients(req.validatedQuery.search));
