import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./shared/config/database.js";
import { ROLES } from "./shared/constants/roles.js";

// Models
import { User } from "./components/epic1_user_staff/models/User.js";
import { Staff } from "./components/epic1_user_staff/models/Staff.js";
import { Shift } from "./components/epic1_user_staff/models/Shift.js";
import { Attendance } from "./components/epic1_user_staff/models/Attendance.js";
import { LeaveRequest } from "./components/epic1_user_staff/models/LeaveRequest.js";
import { CenterLocation } from "./components/epic1_user_staff/models/CenterLocation.js";

import { Appointment } from "./components/epic2_clinical/models/Appointment.js";
import { Vitals } from "./components/epic2_clinical/models/Vitals.js";
import { Consultation } from "./components/epic2_clinical/models/Consultation.js";
import { Prescription } from "./components/epic2_clinical/models/Prescription.js";
import { LabRequest } from "./components/epic2_clinical/models/LabRequest.js";
import { Notification } from "./components/epic2_clinical/models/Notification.js";

import { Medicine } from "./components/epic3_inventory/models/Medicine.js";
import { MedicineBatch } from "./components/epic3_inventory/models/MedicineBatch.js";
import { Supplier } from "./components/epic3_inventory/models/Supplier.js";
import { Purchase } from "./components/epic3_inventory/models/Purchase.js";
import { PharmacySale } from "./components/epic3_inventory/models/PharmacySale.js";

import { Invoice } from "./components/epic4_billing/models/Invoice.js";
import { Payment } from "./components/epic4_billing/models/Payment.js";
import { Payroll } from "./components/epic4_billing/models/Payroll.js";

console.log("Connecting to MongoDB Atlas...");
await connectDatabase();

console.log("Purging all existing collections (removing all fake/demo data)...");
await Promise.all([
  User.deleteMany({}),
  Staff.deleteMany({}),
  Shift.deleteMany({}),
  Attendance.deleteMany({}),
  LeaveRequest.deleteMany({}),
  CenterLocation.deleteMany({}),
  Appointment.deleteMany({}),
  Vitals.deleteMany({}),
  Consultation.deleteMany({}),
  Prescription.deleteMany({}),
  LabRequest.deleteMany({}),
  Notification.deleteMany({}),
  Medicine.deleteMany({}),
  MedicineBatch.deleteMany({}),
  Supplier.deleteMany({}),
  Purchase.deleteMany({}),
  PharmacySale.deleteMany({}),
  Invoice.deleteMany({}),
  Payment.deleteMany({}),
  Payroll.deleteMany({})
]);
console.log("All collections purged cleanly.");

console.log("Initializing genuine production foundation: Center Location & Super Admin account...");

// 1. Primary Center Location
const primaryLocation = await CenterLocation.create({
  key: "primary",
  name: "Health Guard Medical Center - Colombo 07",
  latitude: 6.9147,
  longitude: 79.8780,
  radiusMeters: 1000
});
console.log(`[✓] Primary Location registered: ${primaryLocation.name}`);

// 2. Initial Super Admin Account
const defaultPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
const passwordHash = await bcrypt.hash(defaultPassword, 12);
const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@healthguard.local").toLowerCase().trim();

const adminUser = await User.create({
  firstName: "System",
  lastName: "Administrator",
  email: adminEmail,
  phone: "+94112555000",
  address: "No. 120, Ward Place, Colombo 07, Sri Lanka",
  dateOfBirth: new Date("1985-06-15"),
  gender: "male",
  role: ROLES.ADMIN,
  status: "active",
  passwordHash
});
console.log(`[✓] Super Admin User created: ${adminUser.email} (Role: ${adminUser.role})`);

// 3. Admin Staff Profile
const adminStaff = await Staff.create({
  userId: adminUser._id,
  employeeId: "HG-ADM-001",
  department: "Administration",
  role: ROLES.ADMIN,
  employmentDate: new Date("2021-01-04"),
  baseSalary: 250000,
  allowances: 15000,
  deductions: 3000,
  emergencyContact: "+94112555000",
  status: "active"
});
console.log(`[✓] Super Admin Staff profile linked: ${adminStaff.employeeId}`);

// Verify collection counts
console.log("\n=======================================================");
console.log("CLEAN PRODUCTION DATABASE AUDIT");
console.log("=======================================================");
const counts = {
  Users: await User.countDocuments(),
  Staff: await Staff.countDocuments(),
  CenterLocation: await CenterLocation.countDocuments(),
  Patients: await User.countDocuments({ role: ROLES.PATIENT }),
  Appointments: await Appointment.countDocuments(),
  Vitals: await Vitals.countDocuments(),
  Consultations: await Consultation.countDocuments(),
  Prescriptions: await Prescription.countDocuments(),
  LabRequests: await LabRequest.countDocuments(),
  Medicines: await Medicine.countDocuments(),
  MedicineBatches: await MedicineBatch.countDocuments(),
  Suppliers: await Supplier.countDocuments(),
  Purchases: await Purchase.countDocuments(),
  PharmacySales: await PharmacySale.countDocuments(),
  Invoices: await Invoice.countDocuments(),
  Payments: await Payment.countDocuments(),
  Payroll: await Payroll.countDocuments(),
  Attendance: await Attendance.countDocuments(),
  LeaveRequests: await LeaveRequest.countDocuments(),
  Shifts: await Shift.countDocuments()
};
console.table(counts);

console.log("\nDatabase is 100% clean and ready for genuine real-world operation via UI forms.");
console.log(`Admin Login: ${adminUser.email} | Password: ${defaultPassword}`);

await mongoose.connection.close();
process.exit(0);
