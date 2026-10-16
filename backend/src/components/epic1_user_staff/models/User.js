// Shared User Model | Database Model | Define the stored fields, constraints, and relationships used by this record's features.
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { ROLE_VALUES, ROLES } from "../../../shared/constants/roles.js";

// Patient Registration | Database Model | Define stored user data with first name, last name, email, phone, address and database validation.
// Login | Database Model | Define stored user data with first name, last name, email, phone, address and database validation.
// Add Staff | Database Model | Define stored user data with first name, last name, email, phone, address and database validation.
// Add Walk-in Patient | Database Model | Define stored user data with first name, last name, email, phone, address and database validation.
// Update Doctor Fee | Database Model | Define stored user data with first name, last name, email, phone, address and database validation.
// View Profile | Database Model | Read the stored User record and its linked IDs for this feature.
// View Doctors | Database Model | Read the stored User record and its linked IDs for this feature.
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
    // Require a unique email value through a MongoDB unique index.
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
    // Restrict gender to the supported values defined for this record.
    gender: {
      type: String,
      enum: ["female", "male", "other", "prefer_not_to_say"]
    },
    // Restrict role to the supported values defined for this record.
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.PATIENT,
      index: true
    },
    // Restrict status to the supported values defined for this record.
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true
    },
    // Store only the password hash and exclude it from normal query selections.
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    // Restrict registration source to the supported values defined for this record.
    registrationSource: {
      type: String,
      enum: ["self_registered", "staff_created", "walk_in"],
      default: "self_registered",
      index: true
    },
    portalAccessEnabled: {
      type: Boolean,
      default: true,
      index: true
    },
    consultationFee: {
      type: Number,
      min: 0,
      default: 1500
    }
  },
  // Maintain createdAt and updatedAt automatically for auditing and date-based queries.
  { timestamps: true }
);

// Compare a submitted password with this user's stored bcrypt hash.
userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Return public user fields while excluding the password hash.
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
    registrationSource: this.registrationSource,
    portalAccessEnabled: this.portalAccessEnabled,
    consultationFee: this.consultationFee ?? 1500,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export const User = mongoose.model("User", userSchema);
