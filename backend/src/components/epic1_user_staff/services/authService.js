import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ROLES } from "../../../shared/constants/roles.js";
import { env } from "../../../shared/config/env.js";
import { AppError } from "../../../shared/utils/AppError.js";
import { User } from "../models/User.js";

const signToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

export const registerPatient = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email }).select("_id");
  if (existingUser) {
    throw new AppError("Email already exists", 409, { email: "Email already exists" });
  }

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
    passwordHash
  });

  return {
    user: user.toSafeJSON(),
    token: signToken(user)
  };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.status !== "active") {
    throw new AppError("Account is inactive", 403);
  }

  return {
    user: user.toSafeJSON(),
    token: signToken(user)
  };
};
