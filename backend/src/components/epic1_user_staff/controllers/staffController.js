import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Staff } from "../models/Staff.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";
import { AppError } from "../../../shared/utils/AppError.js";

export const createStaff = async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email }).select("_id");
  if (existingUser) throw new AppError("Email already exists", 409, { email: "Email already exists" });

  const existingStaff = await Staff.findOne({ employeeId: req.body.employeeId.toUpperCase() }).select("_id");
  if (existingStaff) throw new AppError("Employee ID already exists", 409, { employeeId: "Employee ID already exists" });

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    role: req.body.role,
    passwordHash
  });

  const staff = await Staff.create({
    userId: user._id,
    employeeId: req.body.employeeId,
    department: req.body.department,
    role: req.body.role,
    employmentDate: req.body.employmentDate,
    emergencyContact: req.body.emergencyContact
  });

  return successResponse(res, "Staff created successfully", { user: user.toSafeJSON(), staff }, 201);
};

export const listStaff = async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  const staff = await Staff.find(filter).populate("userId", "-passwordHash").sort({ createdAt: -1 });
  return successResponse(res, "Staff list loaded", staff);
};

export const updateStaff = async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) throw new AppError("Staff not found", 404);

  const staffUpdates = ["department", "role", "status", "emergencyContact"].reduce((acc, key) => {
    if (req.body[key] !== undefined) acc[key] = req.body[key];
    return acc;
  }, {});
  Object.assign(staff, staffUpdates);
  await staff.save();

  const userUpdates = ["firstName", "lastName", "phone", "address", "role", "status"].reduce((acc, key) => {
    if (req.body[key] !== undefined) acc[key] = req.body[key];
    return acc;
  }, {});
  const user = await User.findByIdAndUpdate(staff.userId, userUpdates, { new: true, runValidators: true }).select("-passwordHash");

  return successResponse(res, "Staff updated successfully", { staff, user });
};
