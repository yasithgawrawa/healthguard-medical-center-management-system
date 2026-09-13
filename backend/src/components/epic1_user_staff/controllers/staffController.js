import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Staff } from "../models/Staff.js";
import { successResponse } from "../../../shared/utils/apiResponse.js";
import { AppError } from "../../../shared/utils/AppError.js";

const ROLE_CODE_MAP = {
  admin: "ADM",
  manager: "MGR",
  doctor: "DOC",
  nurse: "NUR",
  pharmacist: "PHA",
  cashier: "CAS",
  lab_assistant: "LAB"
};

export const createStaff = async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email }).select("_id");
  if (existingUser) throw new AppError("Email already exists", 409, { email: "Email already exists" });

  let employeeId = req.body.employeeId?.trim()?.toUpperCase();
  if (!employeeId) {
    const code = ROLE_CODE_MAP[req.body.role] || "EMP";
    const existing = await Staff.find({ employeeId: new RegExp(`^HG-${code}-`, "i") }).select("employeeId");
    let maxNum = 0;
    const regex = new RegExp(`^HG-${code}-([0-9]+)$`, "i");
    for (const s of existing) {
      const match = (s.employeeId || "").match(regex);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (parsed > maxNum) maxNum = parsed;
      }
    }
    employeeId = `HG-${code}-${String(maxNum + 1).padStart(3, "0")}`;
    while (await Staff.exists({ employeeId })) {
      maxNum += 1;
      employeeId = `HG-${code}-${String(maxNum).padStart(3, "0")}`;
    }
  } else {
    const existingStaff = await Staff.findOne({ employeeId }).select("_id");
    if (existingStaff) throw new AppError("Employee ID already exists", 409, { employeeId: "Employee ID already exists" });
  }

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
    employeeId,
    department: req.body.department || "General",
    role: req.body.role,
    employmentDate: req.body.employmentDate,
    emergencyContact: req.body.emergencyContact,
    baseSalary: req.body.baseSalary,
    allowances: req.body.allowances,
    deductions: req.body.deductions
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

  const staffUpdates = ["department", "role", "status", "employmentDate", "emergencyContact", "baseSalary", "allowances", "deductions"].reduce((acc, key) => {
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
