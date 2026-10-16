// Implement auth business rules and coordinate database operations.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ROLES } from "../../../shared/constants/roles.js";
import { env } from "../../../shared/config/env.js";
import { AppError } from "../../../shared/utils/AppError.js";
import { User } from "../models/User.js";

// Sign an expiring JWT containing the user ID and role.
const signToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

// Identify generated clinic-only email addresses that cannot access the portal.
const isGeneratedWalkInEmail = (email = "") => /^walkin\..+@healthguard\.local$/i.test(email);

// Reject duplicate email, hash the password, create a patient, and return a safe user and JWT.
export const registerPatient = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email }).select("_id");
  if (existingUser) {
    throw new AppError("Email already exists", 409, { email: "Email already exists" });
  }

  // Hash the password with bcrypt cost 12 before storing the user.
  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
    role: ROLES.PATIENT,
    registrationSource: "self_registered",
    portalAccessEnabled: true,
    passwordHash
  });

  return {
    user: user.toSafeJSON(),
    token: signToken(user)
  };
};

// Verify the password and account access, then return a safe user and JWT.
export const login = async ({ email, password }) => {
  // Explicitly select the normally hidden password hash only for credential verification.
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.status !== "active") {
    throw new AppError("Account is inactive", 403);
  }

  // Prevent clinic-only walk-in records from signing into the patient portal.
  if (user.portalAccessEnabled === false || isGeneratedWalkInEmail(user.email)) {
    throw new AppError("This patient record is for in-clinic use only. Please register online to access the patient portal.", 403);
  }

  return {
    user: user.toSafeJSON(),
    token: signToken(user)
  };
};
