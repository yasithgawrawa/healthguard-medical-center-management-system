// Shared Authentication | Controller | Handle auth HTTP requests and return consistent API responses.
import * as authService from "../services/authService.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";

// Patient Registration | Controller | Pass validated patient details to the auth service and return the created session.
export const registerPatient = async (req, res, next) => {
  try {
    const result = await authService.registerPatient(req.body);
    return successResponse(res, "Patient registered successfully", result, 201);
  } catch (error) {
    next(error);
  }
};

// Login | Controller | Pass credentials to the auth service and return the authenticated session.
export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return successResponse(res, "Login successful", result);
  } catch (error) {
    next(error);
  }
};

// View Profile | Controller | Return the authenticated user without exposing the stored password hash.
export const me = async (req, res) => {
  return successResponse(res, "Authenticated user loaded", {
    user: req.user.toSafeJSON ? req.user.toSafeJSON() : req.user
  });
};
