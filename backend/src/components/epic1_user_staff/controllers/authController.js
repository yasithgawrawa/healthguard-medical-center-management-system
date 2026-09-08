import * as authService from "../services/authService.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";

export const registerPatient = async (req, res, next) => {
  try {
    const result = await authService.registerPatient(req.body);
    return successResponse(res, "Patient registered successfully", result, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return successResponse(res, "Login successful", result);
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res) => {
  return successResponse(res, "Authenticated user loaded", {
    user: req.user.toSafeJSON ? req.user.toSafeJSON() : req.user
  });
};
