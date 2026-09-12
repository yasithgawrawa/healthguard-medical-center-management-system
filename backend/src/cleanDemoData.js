import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./shared/config/database.js";
import { ROLES } from "./shared/constants/roles.js";

// Epic 1 Models
import { User } from "./components/epic1_user_staff/models/User.js";
import { Staff } from "./components/epic1_user_staff/models/Staff.js";
import { Shift } from "./components/epic1_user_staff/models/Shift.js";
import { Attendance } from "./components/epic1_user_staff/models/Attendance.js";
import { LeaveRequest } from "./components/epic1_user_staff/models/LeaveRequest.js";
import { CenterLocation } from "./components/epic1_user_staff/models/CenterLocation.js";

// Epic 2 Models
import { Appointment } from "./components/epic2_clinical/models/Appointment.js";
import { Vitals } from "./components/epic2_clinical/models/Vitals.js";
import { Consultation } from "./components/epic2_clinical/models/Consultation.js";
import { Prescription } from "./components/epic2_clinical/models/Prescription.js";
import { LabRequest } from "./components/epic2_clinical/models/LabRequest.js";
import { Notification } from "./components/epic2_clinical/models/Notification.js";
import { LabTestCatalog } from "./components/epic2_clinical/models/LabTestCatalog.js";

// Epic 3 Models
import { Medicine } from "./components/epic3_inventory/models/Medicine.js";
import { MedicineBatch } from "./components/epic3_inventory/models/MedicineBatch.js";
import { Supplier } from "./components/epic3_inventory/models/Supplier.js";
import { Purchase } from "./components/epic3_inventory/models/Purchase.js";
import { PharmacySale } from "./components/epic3_inventory/models/PharmacySale.js";

// Epic 4 Models
import { Invoice } from "./components/epic4_billing/models/Invoice.js";
import { Payment } from "./components/epic4_billing/models/Payment.js";
import { Payroll } from "./components/epic4_billing/models/Payroll.js";

console.log("Connecting to MongoDB Atlas...");
await connectDatabase();
console.log(`Connected to database: ${mongoose.connection.name}`);

// 1. Purge all demo/transactional data while keeping User, Staff, and CenterLocation
console.log("\nPurging all operational/demo data...");
const purgeResults = await Promise.all([
  Shift.deleteMany({}),
  Attendance.deleteMany({}),
  LeaveRequest.deleteMany({}),
  Appointment.deleteMany({}),
  Vitals.deleteMany({}),
  Consultation.deleteMany({}),
  Prescription.deleteMany({}),
  LabRequest.deleteMany({}),
  Notification.deleteMany({}),
  LabTestCatalog.deleteMany({}),
  Medicine.deleteMany({}),
  MedicineBatch.deleteMany({}),
  Supplier.deleteMany({}),
  Purchase.deleteMany({}),
  PharmacySale.deleteMany({}),
  Invoice.deleteMany({}),
  Payment.deleteMany({}),
  Payroll.deleteMany({})
]);

console.log("✓ Operational/demo data successfully deleted.");

// Ensure primary CenterLocation is configured and referenced to an admin user
const adminUser = await User.findOne({ role: ROLES.ADMIN });
if (adminUser) {
  await CenterLocation.findOneAndUpdate(
    { key: "primary" },
    {
      key: "primary",
      name: "Health Guard Medical Center - Colombo 07",
      latitude: 6.9147,
      longitude: 79.8780,
      radiusMeters: 1000,
      updatedBy: adminUser._id
    },
    { upsert: true, new: true }
  );
  console.log("✓ Primary CenterLocation verified.");
}

// Synchronize state with 'test' database if it exists
try {
  const hgDb = mongoose.connection.client.db("healthguard");
  const testDb = mongoose.connection.client.db("test");
  const hgCollections = await hgDb.listCollections().toArray();

  for (const coll of hgCollections) {
    const docs = await hgDb.collection(coll.name).find().toArray();
    await testDb.collection(coll.name).deleteMany({});
    if (docs.length > 0) {
      await testDb.collection(coll.name).insertMany(docs);
    }
  }
  console.log("✓ Synchronized clean state to 'test' database.");
} catch (syncErr) {
  console.warn("Notice: could not sync to test database:", syncErr.message);
}

// Audit remaining database collections
console.log("\n=======================================================");
console.log("CLEAN DATABASE AUDIT (ACCOUNTS ONLY)");
console.log("=======================================================");
const auditCounts = {
  Users: await User.countDocuments(),
  Staff: await Staff.countDocuments(),
  CenterLocation: await CenterLocation.countDocuments(),
  Shifts: await Shift.countDocuments(),
  Attendance: await Attendance.countDocuments(),
  LeaveRequests: await LeaveRequest.countDocuments(),
  Appointments: await Appointment.countDocuments(),
  Vitals: await Vitals.countDocuments(),
  Consultations: await Consultation.countDocuments(),
  Prescriptions: await Prescription.countDocuments(),
  LabRequests: await LabRequest.countDocuments(),
  Notifications: await Notification.countDocuments(),
  LabTestCatalog: await LabTestCatalog.countDocuments(),
  Medicines: await Medicine.countDocuments(),
  MedicineBatches: await MedicineBatch.countDocuments(),
  Suppliers: await Supplier.countDocuments(),
  Purchases: await Purchase.countDocuments(),
  PharmacySales: await PharmacySale.countDocuments(),
  Invoices: await Invoice.countDocuments(),
  Payments: await Payment.countDocuments(),
  Payroll: await Payroll.countDocuments()
};
console.table(auditCounts);

// List active accounts
const allUsers = await User.find({}, "firstName lastName email role status").lean();
console.log(`\nActive Accounts Retained (${allUsers.length} total):`);
console.table(allUsers.map(u => ({
  Name: `${u.firstName} ${u.lastName}`,
  Email: u.email,
  Role: u.role,
  Status: u.status
})));

await mongoose.connection.close();
console.log("\nProcess completed successfully. All demo data removed; accounts preserved.");
process.exit(0);
