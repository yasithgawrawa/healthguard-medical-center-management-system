import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { ROLE_VALUES, ROLES } from "../../../shared/constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true,
      maxlength: 250
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ["female", "male", "other", "prefer_not_to_say"]
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.PATIENT,
      index: true
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    }
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone,
    address: this.address,
    dateOfBirth: this.dateOfBirth,
    gender: this.gender,
    role: this.role,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export const User = mongoose.model("User", userSchema);
